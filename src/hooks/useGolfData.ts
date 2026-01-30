import { useState, useEffect, useCallback } from 'react';
import { Player, Season, Course, Round } from '@/types/golf';

const STORAGE_KEYS = {
  players: 'golf-tracker-players',
  seasons: 'golf-tracker-seasons',
  courses: 'golf-tracker-courses',
  rounds: 'golf-tracker-rounds',
};

export function useGolfData() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const storedPlayers = localStorage.getItem(STORAGE_KEYS.players);
        const storedSeasons = localStorage.getItem(STORAGE_KEYS.seasons);
        const storedCourses = localStorage.getItem(STORAGE_KEYS.courses);
        const storedRounds = localStorage.getItem(STORAGE_KEYS.rounds);

        if (storedPlayers) setPlayers(JSON.parse(storedPlayers));
        if (storedSeasons) setSeasons(JSON.parse(storedSeasons));
        if (storedCourses) setCourses(JSON.parse(storedCourses));
        if (storedRounds) setRounds(JSON.parse(storedRounds));
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Persist players
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players));
    }
  }, [players, isLoading]);

  // Persist seasons
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.seasons, JSON.stringify(seasons));
    }
  }, [seasons, isLoading]);

  // Persist courses
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courses));
    }
  }, [courses, isLoading]);

  // Persist rounds
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.rounds, JSON.stringify(rounds));
    }
  }, [rounds, isLoading]);

  // Player actions
  const addPlayer = useCallback((name: string, avatar?: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      avatar,
      createdAt: new Date().toISOString(),
    };
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  }, []);

  const updatePlayer = useCallback((playerId: string, updates: Partial<Pick<Player, 'name' | 'avatar'>>) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    ));
  }, []);

  // Season actions
  const createSeason = useCallback((name: string, playerIds: string[]) => {
    const newSeason: Season = {
      id: crypto.randomUUID(),
      name: name.trim(),
      playerIds,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setSeasons(prev => [...prev, newSeason]);
    return newSeason;
  }, []);

  const getActiveSeason = useCallback(() => {
    return seasons.find(s => s.status === 'active');
  }, [seasons]);

  const completeSeason = useCallback((seasonId: string) => {
    setSeasons(prev => prev.map(s => 
      s.id === seasonId 
        ? { ...s, status: 'completed' as const, completedAt: new Date().toISOString() }
        : s
    ));
  }, []);

  const deleteSeason = useCallback((seasonId: string) => {
    setSeasons(prev => prev.filter(s => s.id !== seasonId));
    // Also delete associated rounds
    setRounds(prev => prev.filter(r => r.seasonId !== seasonId));
  }, []);

  // Course actions
  const addCourse = useCallback((name: string, numberOfCourses: number, holesPerCourse: number, location?: string) => {
    const newCourse: Course = {
      id: crypto.randomUUID(),
      name: name.trim(),
      location,
      numberOfCourses,
      holesPerCourse,
      createdAt: new Date().toISOString(),
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  }, []);

  // Round actions
  const createRound = useCallback((seasonId: string, courseId: string, playerIds: string[]) => {
    const newRound: Round = {
      id: crypto.randomUUID(),
      seasonId,
      courseId,
      playerIds,
      holeResults: [],
      startedAt: new Date().toISOString(),
    };
    setRounds(prev => [...prev, newRound]);
    return newRound;
  }, []);

  const updateRoundHole = useCallback((roundId: string, holeNumber: number, winnerIds: string[], holeInOnePlayerIds: string[] = []) => {
    setRounds(prev => prev.map(r => {
      if (r.id !== roundId) return r;
      
      const existingIndex = r.holeResults.findIndex(h => h.holeNumber === holeNumber);
      const newResult = { holeNumber, winnerIds, holeInOnePlayerIds };
      
      const newHoleResults = existingIndex >= 0
        ? r.holeResults.map((h, i) => i === existingIndex ? newResult : h)
        : [...r.holeResults, newResult];
      
      return { ...r, holeResults: newHoleResults };
    }));
  }, []);

  const completeRound = useCallback((roundId: string) => {
    setRounds(prev => prev.map(r => 
      r.id === roundId 
        ? { ...r, completedAt: new Date().toISOString() }
        : r
    ));
  }, []);

  return {
    // State
    players,
    seasons,
    courses,
    rounds,
    isLoading,
    
    // Player actions
    addPlayer,
    removePlayer,
    updatePlayer,
    
    // Season actions
    createSeason,
    getActiveSeason,
    completeSeason,
    deleteSeason,
    
    // Course actions
    addCourse,
    
    // Round actions
    createRound,
    updateRoundHole,
    completeRound,
  };
}
