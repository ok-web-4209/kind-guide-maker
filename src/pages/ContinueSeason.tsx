import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useGolf } from '@/contexts/GolfContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Play, Calendar, MapPin, Trophy, Users, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ContinueSeason = () => {
  const navigate = useNavigate();
  const { seasonId } = useParams();
  const { players, seasons, courses, rounds, deleteSeason } = useGolf();
  const { toast } = useToast();

  // If seasonId is provided, show that season's details
  const selectedSeason = seasonId 
    ? seasons.find(s => s.id === seasonId)
    : null;

  // Get season rounds and courses
  const seasonRounds = useMemo(() => {
    if (!selectedSeason) return [];
    return rounds
      .filter(r => r.seasonId === selectedSeason.id)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [rounds, selectedSeason]);

  const seasonPlayers = useMemo(() => {
    if (!selectedSeason) return [];
    return players.filter(p => selectedSeason.playerIds.includes(p.id));
  }, [players, selectedSeason]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCourse = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const getRoundWinner = (round: typeof rounds[0]) => {
    const scores: Record<string, number> = {};
    round.holeResults.forEach(hole => {
      hole.winnerIds.forEach(winnerId => {
        scores[winnerId] = (scores[winnerId] || 0) + 1;
      });
    });
    
    const maxScore = Math.max(...Object.values(scores), 0);
    if (maxScore === 0) return null;
    
    const winnerId = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
    return winnerId ? players.find(p => p.id === winnerId) : null;
  };

  // If no season selected, show list of seasons
  if (!selectedSeason) {
    const activeSeasons = seasons.filter(s => s.status === 'active');
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Select Season</h1>
              <p className="text-sm text-muted-foreground">Choose a season to continue</p>
            </div>
          </div>

          {activeSeasons.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active seasons</p>
                <Button variant="link" onClick={() => navigate('/new-season')}>
                  Create a new season
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeSeasons.map(season => {
                const seasonPlayerList = players.filter(p => season.playerIds.includes(p.id));
                const seasonRoundCount = rounds.filter(r => r.seasonId === season.id).length;
                
                return (
                  <Card 
                    key={season.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 space-y-1"
                          onClick={() => navigate(`/continue-season/${season.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{season.name}</h3>
                            <Badge variant="default" className="text-xs">Active</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {seasonPlayerList.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {seasonRoundCount} rounds
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Season?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{season.name}" and all {seasonRoundCount} associated rounds. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => {
                                    deleteSeason(season.id);
                                    toast({
                                      title: "Season deleted",
                                      description: `"${season.name}" has been removed.`,
                                    });
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show season details with rounds list
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/continue-season')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{selectedSeason.name}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(selectedSeason.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Season Players */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {seasonPlayers.map(player => (
                <div key={player.id} className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{player.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button className="flex-1 h-12" onClick={() => navigate('/add-course', { state: { seasonId: selectedSeason.id } })}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 h-12"
            onClick={() => navigate('/play', { state: { seasonId: selectedSeason.id } })}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Playing
          </Button>
        </div>

        {/* Rounds List */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Previous Games ({seasonRounds.length})
          </h2>

          {seasonRounds.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No games played yet</p>
                <p className="text-sm text-muted-foreground">Add a course to start your first game</p>
              </CardContent>
            </Card>
          ) : (
            seasonRounds.map(round => {
              const course = getCourse(round.courseId);
              const winner = getRoundWinner(round);
              const totalHoles = round.holeResults.length;
              
              return (
                <Card key={round.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">{course?.name || 'Unknown Course'}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(round.startedAt), 'MMM d, yyyy • h:mm a')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {totalHoles} holes played
                        </div>
                      </div>
                      <div className="text-right">
                        {round.completedAt ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline">In Progress</Badge>
                        )}
                        {winner && (
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <Trophy className="w-3 h-3 text-amber-500" />
                            <span>{winner.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ContinueSeason;
