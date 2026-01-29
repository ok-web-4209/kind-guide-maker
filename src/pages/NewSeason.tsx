import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGolf } from '@/contexts/GolfContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, AlertCircle } from 'lucide-react';

const NewSeason = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { players, createSeason, getActiveSeason } = useGolf();
  const [seasonName, setSeasonName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const activeSeason = getActiveSeason();

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.length === players.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(players.map(p => p.id));
    }
  };

  const handleCreateSeason = () => {
    if (!seasonName.trim()) {
      toast({
        title: "Season name required",
        description: "Please enter a name for your season.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlayerIds.length < 2) {
      toast({
        title: "More players needed",
        description: "Please select at least 2 players for the season.",
        variant: "destructive",
      });
      return;
    }

    createSeason(seasonName.trim(), selectedPlayerIds);
    toast({
      title: "Season created!",
      description: `"${seasonName}" is now active with ${selectedPlayerIds.length} players.`,
    });
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const canCreate = seasonName.trim() && selectedPlayerIds.length >= 2;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Season</h1>
            <p className="text-sm text-muted-foreground">Set up a new golf season</p>
          </div>
        </div>

        {/* Warning if active season exists */}
        {activeSeason && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Active season exists</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Creating a new season will replace "{activeSeason.name}".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Season Name */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Season Name</CardTitle>
            <CardDescription>Give your season a memorable name</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., Summer 2025, Championship Series"
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Player Selection */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Select Players</CardTitle>
                <CardDescription>
                  {selectedPlayerIds.length} of {players.length} selected (min. 2)
                </CardDescription>
              </div>
              {players.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {selectedPlayerIds.length === players.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No players in roster</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => navigate('/players')}
                >
                  Add players first
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleTogglePlayer(player.id)}
                  >
                    <Checkbox
                      checked={selectedPlayerIds.includes(player.id)}
                      onCheckedChange={() => handleTogglePlayer(player.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Button */}
        <Button
          className="w-full h-14 text-lg"
          size="lg"
          onClick={handleCreateSeason}
          disabled={!canCreate}
        >
          Start Season
        </Button>

        {!canCreate && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            {!seasonName.trim() && "Enter a season name"}
            {seasonName.trim() && selectedPlayerIds.length < 2 && "Select at least 2 players"}
          </p>
        )}
      </div>
    </div>
  );
};

export default NewSeason;
