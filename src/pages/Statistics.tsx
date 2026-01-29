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
import { useGolf } from '@/contexts/GolfContext';
import { ArrowLeft, Trophy, User, MapPin, Calendar, Star, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const Statistics = () => {
  const navigate = useNavigate();
  const { players, seasons, courses, rounds } = useGolf();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');

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
      };
    });

    filteredRounds.forEach(round => {
      // Count rounds played
      round.playerIds.forEach(playerId => {
        if (stats[playerId]) {
          stats[playerId].roundsPlayed++;
        }
      });

      // Count holes won and hole-in-ones
      round.holeResults.forEach(hole => {
        hole.winnerIds.forEach(winnerId => {
          if (stats[winnerId]) {
            stats[winnerId].holesWon++;
          }
        });
        hole.holeInOnePlayerIds.forEach(playerId => {
          if (stats[playerId]) {
            stats[playerId].holeInOnes++;
          }
        });
      });

      // Determine round winner (highest holes won in round)
      if (round.completedAt) {
        const roundScores: Record<string, number> = {};
        round.holeResults.forEach(hole => {
          hole.winnerIds.forEach(winnerId => {
            roundScores[winnerId] = (roundScores[winnerId] || 0) + 1;
          });
        });

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
  }, [players, filteredRounds]);

  // Course statistics
  const courseStats = useMemo(() => {
    return courses.map(course => {
      const courseRounds = filteredRounds.filter(r => r.courseId === course.id);
      const completedRounds = courseRounds.filter(r => r.completedAt);
      
      return {
        course,
        roundsPlayed: completedRounds.length,
        totalHolesPlayed: completedRounds.reduce(
          (sum, r) => sum + r.holeResults.length, 
          0
        ),
      };
    }).sort((a, b) => b.roundsPlayed - a.roundsPlayed);
  }, [courses, filteredRounds]);

  // Season statistics
  const seasonStats = useMemo(() => {
    return seasons.map(season => {
      const seasonRounds = rounds.filter(r => r.seasonId === season.id);
      const completedRounds = seasonRounds.filter(r => r.completedAt);
      const seasonPlayers = players.filter(p => season.playerIds.includes(p.id));

      // Calculate leaderboard for this season
      const leaderboard: Record<string, number> = {};
      seasonRounds.forEach(round => {
        round.holeResults.forEach(hole => {
          hole.winnerIds.forEach(winnerId => {
            leaderboard[winnerId] = (leaderboard[winnerId] || 0) + 1;
          });
        });
      });

      const sortedLeaderboard = Object.entries(leaderboard)
        .map(([playerId, score]) => ({
          player: players.find(p => p.id === playerId),
          score,
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

  const getExportData = () => {
    return playerStats.map((stat, index) => ({
      Rank: index + 1,
      Player: stat.name,
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
      stat.name,
      stat.holesWon,
      stat.totalWins,
      stat.holeInOnes,
      stat.roundsPlayed,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `golf-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistics');
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
                    className={index === 0 && stat.holesWon > 0 ? 'border-primary bg-primary/5' : ''}
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
                        <div className="text-right">
                          <div className="text-xl font-bold">{stat.holesWon}</div>
                          <div className="text-xs text-muted-foreground">holes won</div>
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
                {courseStats.map(({ course, roundsPlayed, totalHolesPlayed }) => (
                  <Card key={course.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.holesPerCourse} holes
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{roundsPlayed}</div>
                          <div className="text-xs text-muted-foreground">rounds</div>
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
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Leaderboard</p>
                          {leaderboard.slice(0, 3).map((entry, index) => (
                            <div key={entry.player?.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-5 text-muted-foreground">{index + 1}.</span>
                                <span className="font-medium">{entry.player?.name}</span>
                              </div>
                              <span className="font-bold">{entry.score} pts</span>
                            </div>
                          ))}
                        </div>
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
      </div>
    </div>
  );
};

export default Statistics;
