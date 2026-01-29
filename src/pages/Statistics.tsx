import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGolf } from '@/contexts/GolfContext';
import { ArrowLeft, Trophy, User, MapPin, Calendar, Star, Download, FileSpreadsheet, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const Statistics = () => {
  const navigate = useNavigate();
  const { players, seasons, courses, rounds } = useGolf();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Filter data by selected season
  const filteredRounds = useMemo(() => {
    if (selectedSeasonId === 'all') return rounds;
    return rounds.filter(r => r.seasonId === selectedSeasonId);
  }, [rounds, selectedSeasonId]);

  // Calculate player statistics (HIGHEST SCORE WINS)
  const playerStats = useMemo(() => {
    const stats: Record<string, {
      playerId: string;
      name: string;
      avatar?: string;
      totalWins: number;
      holesWon: number;
      holeInOnes: number;
      roundsPlayed: number;
      courseHistory: Array<{
        courseId: string;
        courseName: string;
        score: number;
        date: string;
        holeInOnes: number;
      }>;
    }> = {};

    players.forEach(player => {
      stats[player.id] = {
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        totalWins: 0,
        holesWon: 0,
        holeInOnes: 0,
        roundsPlayed: 0,
        courseHistory: [],
      };
    });

    filteredRounds.forEach(round => {
      const course = courses.find(c => c.id === round.courseId);
      
      // Count rounds played and build history
      round.playerIds.forEach(playerId => {
        if (stats[playerId]) {
          stats[playerId].roundsPlayed++;
        }
      });

      // Calculate score per player for this round
      const roundScores: Record<string, number> = {};
      const roundHoleInOnes: Record<string, number> = {};
      
      round.holeResults.forEach(hole => {
        hole.winnerIds.forEach(winnerId => {
          if (stats[winnerId]) {
            stats[winnerId].holesWon++;
            roundScores[winnerId] = (roundScores[winnerId] || 0) + 1;
          }
        });
        hole.holeInOnePlayerIds.forEach(playerId => {
          if (stats[playerId]) {
            stats[playerId].holeInOnes++;
            roundHoleInOnes[playerId] = (roundHoleInOnes[playerId] || 0) + 1;
          }
        });
      });

      // Add to course history
      round.playerIds.forEach(playerId => {
        if (stats[playerId] && round.completedAt) {
          stats[playerId].courseHistory.push({
            courseId: round.courseId,
            courseName: course?.name || 'Unknown',
            score: roundScores[playerId] || 0,
            date: round.startedAt,
            holeInOnes: roundHoleInOnes[playerId] || 0,
          });
        }
      });

      // Determine round winner (highest holes won in round)
      if (round.completedAt) {
        const maxScore = Math.max(...Object.values(roundScores), 0);
        if (maxScore > 0) {
          Object.entries(roundScores).forEach(([playerId, score]) => {
            if (score === maxScore && stats[playerId]) {
              stats[playerId].totalWins++;
            }
          });
        }
      }
    });

    // Sort by holesWon (highest first - the winner!)
    return Object.values(stats).sort((a, b) => b.holesWon - a.holesWon);
  }, [players, filteredRounds, courses]);

  // Course statistics with player rankings
  const courseStats = useMemo(() => {
    return courses.map(course => {
      const courseRounds = filteredRounds.filter(r => r.courseId === course.id && r.completedAt);
      
      // Build rankings: best scores per player
      const playerBestScores: Record<string, { score: number; date: string }> = {};
      
      courseRounds.forEach(round => {
        const roundScores: Record<string, number> = {};
        round.holeResults.forEach(hole => {
          hole.winnerIds.forEach(winnerId => {
            roundScores[winnerId] = (roundScores[winnerId] || 0) + 1;
          });
        });
        
        Object.entries(roundScores).forEach(([playerId, score]) => {
          if (!playerBestScores[playerId] || score > playerBestScores[playerId].score) {
            playerBestScores[playerId] = { score, date: round.startedAt };
          }
        });
      });

      const rankings = Object.entries(playerBestScores)
        .map(([playerId, data]) => ({
          player: players.find(p => p.id === playerId),
          score: data.score,
          date: data.date,
        }))
        .filter(r => r.player)
        .sort((a, b) => b.score - a.score);

      return {
        course,
        roundsPlayed: courseRounds.length,
        rankings,
      };
    }).sort((a, b) => b.roundsPlayed - a.roundsPlayed);
  }, [courses, filteredRounds, players]);

  // Season statistics with leaderboard
  const seasonStats = useMemo(() => {
    return seasons.map(season => {
      const seasonRounds = rounds.filter(r => r.seasonId === season.id);
      const completedRounds = seasonRounds.filter(r => r.completedAt);
      const seasonPlayers = players.filter(p => season.playerIds.includes(p.id));

      // Calculate leaderboard with hole-in-ones
      const leaderboard: Record<string, { score: number; holeInOnes: number }> = {};
      
      seasonRounds.forEach(round => {
        round.holeResults.forEach(hole => {
          hole.winnerIds.forEach(winnerId => {
            if (!leaderboard[winnerId]) {
              leaderboard[winnerId] = { score: 0, holeInOnes: 0 };
            }
            leaderboard[winnerId].score++;
          });
          hole.holeInOnePlayerIds.forEach(playerId => {
            if (!leaderboard[playerId]) {
              leaderboard[playerId] = { score: 0, holeInOnes: 0 };
            }
            leaderboard[playerId].holeInOnes++;
          });
        });
      });

      const sortedLeaderboard = Object.entries(leaderboard)
        .map(([playerId, data]) => ({
          player: players.find(p => p.id === playerId),
          score: data.score,
          holeInOnes: data.holeInOnes,
        }))
        .filter(entry => entry.player)
        .sort((a, b) => b.score - a.score);

      return {
        season,
        roundsPlayed: completedRounds.length,
        playerCount: seasonPlayers.length,
        leaderboard: sortedLeaderboard,
      };
    });
  }, [seasons, rounds, players]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedPlayer = playerStats.find(p => p.playerId === selectedPlayerId);
  const selectedCourse = courseStats.find(c => c.course.id === selectedCourseId);

  // Sanitize CSV values to prevent formula injection attacks
  // Prefixes values starting with =, +, -, @, or tab with a single quote
  const sanitizeCSVValue = (value: string | number): string => {
    const str = String(value);
    // Check for formula injection characters and escape them
    if (/^[=+\-@\t]/.test(str)) {
      return `'${str}`;
    }
    // Escape double quotes and wrap in quotes if contains comma or quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const getExportData = () => {
    return playerStats.map((stat, index) => ({
      Rank: index + 1,
      Player: sanitizeCSVValue(stat.name),
      'Holes Won': stat.holesWon,
      'Rounds Won': stat.totalWins,
      'Hole-in-Ones': stat.holeInOnes,
      'Rounds Played': stat.roundsPlayed,
    }));
  };

  const handleExportCSV = () => {
    const headers = ['Rank', 'Player', 'Holes Won', 'Rounds Won', 'Hole-in-Ones', 'Rounds Played'];
    const rows = playerStats.map((stat, index) => [
      index + 1,
      sanitizeCSVValue(stat.name),
      stat.holesWon,
      stat.totalWins,
      stat.holeInOnes,
      stat.roundsPlayed,
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => sanitizeCSVValue(cell)).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `golf-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    const workbook = XLSX.utils.book_new();
    
    // Player stats sheet
    const playerData = getExportData();
    const playerSheet = XLSX.utils.json_to_sheet(playerData);
    XLSX.utils.book_append_sheet(workbook, playerSheet, 'Player Statistics');

    // Course stats sheet - sanitize user-supplied names to prevent formula injection
    const courseData = courseStats.flatMap(({ course, rankings }) =>
      rankings.map((r, i) => ({
        Course: sanitizeCSVValue(course.name),
        Rank: i + 1,
        Player: sanitizeCSVValue(r.player?.name || ''),
        Score: r.score,
        Date: format(new Date(r.date), 'yyyy-MM-dd'),
      }))
    );
    if (courseData.length > 0) {
      const courseSheet = XLSX.utils.json_to_sheet(courseData);
      XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course Rankings');
    }

    // Season stats sheet - sanitize user-supplied names to prevent formula injection
    const seasonData = seasonStats.flatMap(({ season, leaderboard }) =>
      leaderboard.map((entry, i) => ({
        Season: sanitizeCSVValue(season.name),
        Rank: i + 1,
        Player: sanitizeCSVValue(entry.player?.name || ''),
        Score: entry.score,
        'Hole-in-Ones': entry.holeInOnes,
      }))
    );
    if (seasonData.length > 0) {
      const seasonSheet = XLSX.utils.json_to_sheet(seasonData);
      XLSX.utils.book_append_sheet(workbook, seasonSheet, 'Season Standings');
    }

    XLSX.writeFile(workbook, `golf-stats-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Statistics</h1>
              <p className="text-sm text-muted-foreground">Rankings & performance</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportXLSX}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Season Filter */}
        <div className="mb-6">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map(season => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="players">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="players" className="flex-1">
              <User className="w-4 h-4 mr-1" />
              Players
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex-1">
              <MapPin className="w-4 h-4 mr-1" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="seasons" className="flex-1">
              <Calendar className="w-4 h-4 mr-1" />
              Seasons
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            {playerStats.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No player statistics yet</p>
                  <p className="text-sm text-muted-foreground">Play some rounds to see rankings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {playerStats.map((stat, index) => (
                  <Card 
                    key={stat.playerId} 
                    className={`cursor-pointer hover:border-primary/50 transition-colors ${index === 0 && stat.holesWon > 0 ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setSelectedPlayerId(stat.playerId)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                          {index === 0 && stat.holesWon > 0 ? (
                            <Trophy className="w-4 h-4 text-primary" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={stat.avatar} alt={stat.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(stat.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{stat.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {stat.roundsPlayed} round{stat.roundsPlayed !== 1 ? 's' : ''} played
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-xl font-bold">{stat.holesWon}</div>
                            <div className="text-xs text-muted-foreground">holes won</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      {(stat.totalWins > 0 || stat.holeInOnes > 0) && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          {stat.totalWins > 0 && (
                            <Badge variant="secondary">
                              <Trophy className="w-3 h-3 mr-1" />
                              {stat.totalWins} round win{stat.totalWins !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {stat.holeInOnes > 0 && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                              <Star className="w-3 h-3 mr-1" />
                              {stat.holeInOnes} ace{stat.holeInOnes !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            {courseStats.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No course statistics yet</p>
                  <p className="text-sm text-muted-foreground">Add courses to track performance</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {courseStats.map(({ course, roundsPlayed, rankings }) => (
                  <Card 
                    key={course.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.holesPerCourse} holes • {roundsPlayed} rounds
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {rankings[0] && (
                            <Badge variant="outline" className="text-xs">
                              <Trophy className="w-3 h-3 mr-1" />
                              {rankings[0].player?.name}
                            </Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Seasons Tab */}
          <TabsContent value="seasons">
            {seasonStats.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No seasons yet</p>
                  <Button variant="link" onClick={() => navigate('/new-season')}>
                    Create your first season
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {seasonStats.map(({ season, roundsPlayed, playerCount, leaderboard }) => (
                  <Card key={season.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{season.name}</CardTitle>
                        <Badge variant={season.status === 'active' ? 'default' : 'secondary'}>
                          {season.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {playerCount} players • {roundsPlayed} rounds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leaderboard.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Player</TableHead>
                              <TableHead className="text-right">Score</TableHead>
                              <TableHead className="text-right">Aces</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaderboard.map((entry, index) => (
                              <TableRow key={entry.player?.id}>
                                <TableCell className="font-medium">
                                  {index === 0 ? <Trophy className="w-4 h-4 text-amber-500" /> : index + 1}
                                </TableCell>
                                <TableCell>{entry.player?.name}</TableCell>
                                <TableCell className="text-right font-bold">{entry.score}</TableCell>
                                <TableCell className="text-right">
                                  {entry.holeInOnes > 0 && (
                                    <span className="flex items-center justify-end gap-1">
                                      <Star className="w-3 h-3 text-amber-500" />
                                      {entry.holeInOnes}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No rounds played yet</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Player Detail Dialog */}
        <Dialog open={!!selectedPlayerId} onOpenChange={() => setSelectedPlayerId(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedPlayer?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedPlayer ? getInitials(selectedPlayer.name) : ''}
                  </AvatarFallback>
                </Avatar>
                {selectedPlayer?.name}
              </DialogTitle>
              <DialogDescription>
                Course history and statistics
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlayer && (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">{selectedPlayer.holesWon}</div>
                    <div className="text-xs text-muted-foreground">Holes Won</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">{selectedPlayer.totalWins}</div>
                    <div className="text-xs text-muted-foreground">Round Wins</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                    <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">{selectedPlayer.holeInOnes}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-400">Hole-in-Ones</div>
                  </div>
                </div>

                {/* Course History Table */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Course History</h4>
                  {selectedPlayer.courseHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                          <TableHead className="text-right">Aces</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPlayer.courseHistory.map((entry, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{entry.courseName}</TableCell>
                            <TableCell className="text-right">{entry.score}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {format(new Date(entry.date), 'M/d/yy')}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.holeInOnes > 0 && (
                                <span className="flex items-center justify-end gap-1">
                                  <Star className="w-3 h-3 text-amber-500" />
                                  {entry.holeInOnes}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No course history yet</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Course Detail Dialog */}
        <Dialog open={!!selectedCourseId} onOpenChange={() => setSelectedCourseId(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {selectedCourse?.course.name}
              </DialogTitle>
              <DialogDescription>
                Player rankings for this course
              </DialogDescription>
            </DialogHeader>
            
            {selectedCourse && (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{selectedCourse.course.holesPerCourse} holes</span>
                  <span>{selectedCourse.roundsPlayed} rounds played</span>
                </div>

                {selectedCourse.rankings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">Best Score</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCourse.rankings.map((entry, index) => (
                        <TableRow key={entry.player?.id}>
                          <TableCell className="font-medium">
                            {index === 0 ? <Trophy className="w-4 h-4 text-amber-500" /> : index + 1}
                          </TableCell>
                          <TableCell>{entry.player?.name}</TableCell>
                          <TableCell className="text-right font-bold">{entry.score}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {format(new Date(entry.date), 'M/d/yy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No games played at this course</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Statistics;
