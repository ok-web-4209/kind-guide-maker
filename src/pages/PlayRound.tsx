import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGolf } from '@/contexts/GolfContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ChevronLeft, ChevronRight, Flag, Trophy, Star } from 'lucide-react';
import { Player } from '@/types/golf';

const PlayRound = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { players, courses, rounds, getActiveSeason, createRound, updateRoundHole, completeRound, addCourse } = useGolf();
  
  const activeSeason = getActiveSeason();
  const [currentHole, setCurrentHole] = useState(1);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [holeInOnePlayers, setHoleInOnePlayers] = useState<string[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [totalHoles, setTotalHoles] = useState(18);

  // Get active round or create a new one
  const activeRound = useMemo(() => {
    if (activeRoundId) {
      return rounds.find(r => r.id === activeRoundId);
    }
    // Find incomplete round for current season
    return rounds.find(r => r.seasonId === activeSeason?.id && !r.completedAt);
  }, [rounds, activeRoundId, activeSeason?.id]);

  // Get season players
  const seasonPlayers = useMemo(() => {
    if (!activeSeason) return [];
    return players.filter(p => activeSeason.playerIds.includes(p.id));
  }, [players, activeSeason]);

  // Get current hole data
  const currentHoleData = useMemo(() => {
    if (!activeRound) return null;
    return activeRound.holeResults.find(h => h.holeNumber === currentHole);
  }, [activeRound, currentHole]);

  // Calculate scores (highest wins)
  const playerScores = useMemo(() => {
    if (!activeRound) return {};
    const scores: Record<string, number> = {};
    seasonPlayers.forEach(p => { scores[p.id] = 0; });
    
    activeRound.holeResults.forEach(hole => {
      hole.winnerIds.forEach(winnerId => {
        scores[winnerId] = (scores[winnerId] || 0) + 1;
      });
    });
    
    return scores;
  }, [activeRound, seasonPlayers]);

  // Load current hole data when navigating
  useState(() => {
    if (currentHoleData) {
      setSelectedWinners(currentHoleData.winnerIds);
      setHoleInOnePlayers(currentHoleData.holeInOnePlayerIds);
    } else {
      setSelectedWinners([]);
      setHoleInOnePlayers([]);
    }
  });

  const handleStartRound = () => {
    if (!activeSeason) return;
    
    // Create a default course if none exists
    let courseId = courses[0]?.id;
    if (!courseId) {
      const newCourse = addCourse('Default Course', 1, totalHoles);
      courseId = newCourse.id;
    }
    
    const newRound = createRound(activeSeason.id, courseId, activeSeason.playerIds);
    setActiveRoundId(newRound.id);
    toast({
      title: "Round started!",
      description: `Playing ${totalHoles} holes.`,
    });
  };

  const handleToggleWinner = (playerId: string) => {
    setSelectedWinners(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleToggleHoleInOne = (playerId: string) => {
    setHoleInOnePlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSaveHole = () => {
    if (!activeRound) return;
    
    updateRoundHole(activeRound.id, currentHole, selectedWinners, holeInOnePlayers);
    toast({
      title: `Hole ${currentHole} saved`,
      description: selectedWinners.length 
        ? `${selectedWinners.length} winner${selectedWinners.length > 1 ? 's' : ''}`
        : 'No winners recorded',
    });
  };

  const handleNavigateHole = (hole: number) => {
    // Auto-save current hole before navigating
    if (activeRound && (selectedWinners.length > 0 || holeInOnePlayers.length > 0)) {
      updateRoundHole(activeRound.id, currentHole, selectedWinners, holeInOnePlayers);
    }
    
    setCurrentHole(hole);
    
    // Load new hole data
    const newHoleData = activeRound?.holeResults.find(h => h.holeNumber === hole);
    if (newHoleData) {
      setSelectedWinners(newHoleData.winnerIds);
      setHoleInOnePlayers(newHoleData.holeInOnePlayerIds);
    } else {
      setSelectedWinners([]);
      setHoleInOnePlayers([]);
    }
  };

  const handleFinishRound = () => {
    if (!activeRound) return;
    
    // Save current hole first
    if (selectedWinners.length > 0 || holeInOnePlayers.length > 0) {
      updateRoundHole(activeRound.id, currentHole, selectedWinners, holeInOnePlayers);
    }
    
    completeRound(activeRound.id);
    toast({
      title: "Round complete!",
      description: "Great game! Check the statistics for results.",
    });
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLeader = () => {
    const entries = Object.entries(playerScores);
    if (entries.length === 0) return null;
    const maxScore = Math.max(...entries.map(([, score]) => score));
    if (maxScore === 0) return null;
    return entries.find(([, score]) => score === maxScore)?.[0];
  };

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Play Round</h1>
          </div>
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No active season</p>
              <Button variant="link" onClick={() => navigate('/new-season')}>
                Create a season first
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!activeRound) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Start Round</h1>
              <p className="text-sm text-muted-foreground">{activeSeason.name}</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Round Setup</CardTitle>
              <CardDescription>Configure your round settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Holes</Label>
                <Select value={totalHoles.toString()} onValueChange={(v) => setTotalHoles(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">9 Holes</SelectItem>
                    <SelectItem value="18">18 Holes</SelectItem>
                    <SelectItem value="27">27 Holes</SelectItem>
                    <SelectItem value="36">36 Holes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Label className="text-muted-foreground">Players in this round:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {seasonPlayers.map(player => (
                    <Badge key={player.id} variant="secondary">
                      {player.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full h-14 text-lg" size="lg" onClick={handleStartRound}>
            <Flag className="w-5 h-5 mr-2" />
            Start Round
          </Button>
        </div>
      </div>
    );
  }

  const leader = getLeader();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{activeSeason.name}</h1>
              <p className="text-sm text-muted-foreground">
                Hole {currentHole} of {totalHoles}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleFinishRound}>
            Finish
          </Button>
        </div>

        {/* Hole Navigation */}
        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentHole <= 1}
                onClick={() => handleNavigateHole(currentHole - 1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Select 
                value={currentHole.toString()} 
                onValueChange={(v) => handleNavigateHole(parseInt(v))}
              >
                <SelectTrigger className="w-32 text-center">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalHoles }, (_, i) => i + 1).map(hole => (
                    <SelectItem key={hole} value={hole.toString()}>
                      Hole {hole}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                disabled={currentHole >= totalHoles}
                onClick={() => handleNavigateHole(currentHole + 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Who Won This Hole */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Who won this hole?
            </CardTitle>
            <CardDescription>Select all winners (ties allowed)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {seasonPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWinners.includes(player.id) 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggleWinner(player.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedWinners.includes(player.id)}
                      onCheckedChange={() => handleToggleWinner(player.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">{player.name}</span>
                      {leader === player.id && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Leading
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{playerScores[player.id] || 0}</span>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hole in One */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Hole in One
            </CardTitle>
            <CardDescription>Record any hole-in-ones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seasonPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{player.name}</span>
                  </div>
                  <Switch
                    checked={holeInOnePlayers.includes(player.id)}
                    onCheckedChange={() => handleToggleHoleInOne(player.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 h-12" onClick={handleSaveHole}>
            Save Hole
          </Button>
          {currentHole < totalHoles && (
            <Button 
              variant="secondary" 
              className="flex-1 h-12"
              onClick={() => {
                handleSaveHole();
                handleNavigateHole(currentHole + 1);
              }}
            >
              Save & Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayRound;
