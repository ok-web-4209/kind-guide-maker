import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGolf } from '@/contexts/GolfContext';
import { Users, Plus, Play, Trophy, BarChart3 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { players, rounds, getActiveSeason, isLoading } = useGolf();

  const activeSeason = getActiveSeason();
  const seasonPlayers = activeSeason 
    ? players.filter(p => activeSeason.playerIds.includes(p.id))
    : [];
  const seasonRounds = activeSeason 
    ? rounds.filter(r => r.seasonId === activeSeason.id)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Golf Tracker</h1>
          <p className="text-muted-foreground mt-1">Season & Statistics</p>
        </div>

        {/* Current Season Status */}
        {activeSeason && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">Current Season</CardDescription>
              <CardTitle className="text-xl">{activeSeason.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Players:</span>{' '}
                  <span className="font-semibold">{seasonPlayers.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rounds:</span>{' '}
                  <span className="font-semibold">{seasonRounds.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Active Season */}
        {!activeSeason && (
          <Card className="mb-6 border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No active season</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new season to get started</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="space-y-3">
          {activeSeason && (
            <Button 
              className="w-full h-14 text-lg" 
              size="lg"
              onClick={() => navigate('/continue-season')}
            >
              <Play className="w-5 h-5 mr-2" />
              Continue Season
            </Button>
          )}

          <Button 
            variant={activeSeason ? 'secondary' : 'default'}
            className="w-full h-14 text-lg" 
            size="lg"
            onClick={() => navigate('/new-season')}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Season
          </Button>

          <Button 
            variant="outline"
            className="w-full h-14 text-lg" 
            size="lg"
            onClick={() => navigate('/players')}
          >
            <Users className="w-5 h-5 mr-2" />
            Manage Players
          </Button>

          <Button 
            variant="outline"
            className="w-full h-14 text-lg" 
            size="lg"
            onClick={() => navigate('/stats')}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Statistics
          </Button>
        </div>

        {/* Player Count */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {players.length} player{players.length !== 1 ? 's' : ''} in roster
        </div>
      </div>
    </div>
  );
};

export default Index;
