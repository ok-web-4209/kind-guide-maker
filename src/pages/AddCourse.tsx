import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGolf } from '@/contexts/GolfContext';
import { useToast } from '@/hooks/use-toast';
import { CourseSearchMap } from '@/components/maps/CourseSearchMap';
import { ArrowLeft, MapPin, Settings, Users, Play } from 'lucide-react';

interface CourseConfig {
  name: string;
  holes: number;
}

const AddCourse = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { players, getActiveSeason, addCourse, createRound } = useGolf();
  
  const seasonId = location.state?.seasonId;
  const activeSeason = getActiveSeason();
  const currentSeason = seasonId 
    ? activeSeason?.id === seasonId ? activeSeason : null
    : activeSeason;

  const [step, setStep] = useState<'map' | 'configure' | 'players'>('map');
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  // Course configuration
  const [locationName, setLocationName] = useState('');
  const [numberOfCourses, setNumberOfCourses] = useState(1);
  const [courseConfigs, setCourseConfigs] = useState<CourseConfig[]>([
    { name: 'Course 1', holes: 18 }
  ]);
  
  // Player selection
  const seasonPlayers = currentSeason 
    ? players.filter(p => currentSeason.playerIds.includes(p.id))
    : [];
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    seasonPlayers.map(p => p.id)
  );

  const handleLocationSelect = (loc: typeof selectedLocation) => {
    setSelectedLocation(loc);
    setLocationName(loc?.name || '');
  };

  const handleNumberOfCoursesChange = (value: string) => {
    const num = parseInt(value);
    setNumberOfCourses(num);
    
    const newConfigs = Array.from({ length: num }, (_, i) => 
      courseConfigs[i] || { name: `Course ${i + 1}`, holes: 18 }
    );
    setCourseConfigs(newConfigs);
  };

  const updateCourseConfig = (index: number, field: keyof CourseConfig, value: string | number) => {
    setCourseConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, [field]: value } : config
    ));
  };

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleContinue = () => {
    if (step === 'map') {
      if (!selectedLocation) {
        toast({
          title: "Select a location",
          description: "Please search for or click on a golf course location.",
          variant: "destructive",
        });
        return;
      }
      setStep('configure');
    } else if (step === 'configure') {
      if (!locationName.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a name for this location.",
          variant: "destructive",
        });
        return;
      }
      setStep('players');
    }
  };

  const handleStartPlaying = () => {
    if (selectedPlayerIds.length < 2) {
      toast({
        title: "Not enough players",
        description: "Please select at least 2 players.",
        variant: "destructive",
      });
      return;
    }

    if (!currentSeason) {
      toast({
        title: "No active season",
        description: "Please create a season first.",
        variant: "destructive",
      });
      return;
    }

    // Add each course and create a round for the first one
    const createdCourses = courseConfigs.map((config, index) => {
      return addCourse(
        index === 0 ? locationName : `${locationName} - ${config.name}`,
        numberOfCourses,
        config.holes,
        selectedLocation?.address
      );
    });

    // Create round with first course
    const round = createRound(currentSeason.id, createdCourses[0].id, selectedPlayerIds);

    toast({
      title: "Course added!",
      description: `${locationName} is ready to play.`,
    });

    // Navigate to play with the new round
    navigate('/play', { state: { roundId: round.id, totalHoles: courseConfigs[0].holes } });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!currentSeason) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Add Course</h1>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (step === 'configure') setStep('map');
              else if (step === 'players') setStep('configure');
              else navigate(-1);
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Course</h1>
            <p className="text-sm text-muted-foreground">
              {step === 'map' && 'Search for a golf course'}
              {step === 'configure' && 'Configure course details'}
              {step === 'players' && 'Select players'}
            </p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step === 'map' || step === 'configure' || step === 'players' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'configure' || step === 'players' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'players' ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Step 1: Map Search */}
        {step === 'map' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Find Golf Course
              </CardTitle>
              <CardDescription>
                Search for a golf course or tap on the map
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CourseSearchMap onLocationSelect={handleLocationSelect} />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configure Course */}
        {step === 'configure' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Course Configuration
              </CardTitle>
              <CardDescription>
                Define the course layout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Pebble Beach Golf Links"
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Courses at Location</Label>
                <Select 
                  value={numberOfCourses.toString()} 
                  onValueChange={handleNumberOfCoursesChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Course{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Course Details</Label>
                {courseConfigs.map((config, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={config.name}
                      onChange={(e) => updateCourseConfig(index, 'name', e.target.value)}
                      placeholder="Course name"
                      className="flex-1"
                    />
                    <Select
                      value={config.holes.toString()}
                      onValueChange={(v) => updateCourseConfig(index, 'holes', parseInt(v))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9">9 holes</SelectItem>
                        <SelectItem value="18">18 holes</SelectItem>
                        <SelectItem value="27">27 holes</SelectItem>
                        <SelectItem value="36">36 holes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Players */}
        {step === 'players' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Players
              </CardTitle>
              <CardDescription>
                Choose who's playing this round
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {seasonPlayers.map(player => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlayerIds.includes(player.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleTogglePlayer(player.id)}
                  >
                    <Checkbox
                      checked={selectedPlayerIds.includes(player.id)}
                      onCheckedChange={() => handleTogglePlayer(player.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                ))}
              </div>

              {seasonPlayers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No players in this season</p>
                  <Button variant="link" onClick={() => navigate('/players')}>
                    Add players first
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-6">
          {step !== 'players' ? (
            <Button 
              className="w-full h-12" 
              onClick={handleContinue}
              disabled={step === 'map' && !selectedLocation}
            >
              Continue
            </Button>
          ) : (
            <Button 
              className="w-full h-12" 
              onClick={handleStartPlaying}
              disabled={selectedPlayerIds.length < 2}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Playing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
