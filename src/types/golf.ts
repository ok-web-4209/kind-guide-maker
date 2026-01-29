// Golf Season & Statistics Tracker Types

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Season {
  id: string;
  name: string;
  playerIds: string[];
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface Course {
  id: string;
  name: string;
  location?: string;
  numberOfCourses: number;
  holesPerCourse: number;
  createdAt: string;
}

export interface HoleResult {
  holeNumber: number;
  winnerIds: string[]; // Multiple winners allowed
  holeInOnePlayerIds: string[];
}

export interface Round {
  id: string;
  seasonId: string;
  courseId: string;
  playerIds: string[];
  holeResults: HoleResult[];
  startedAt: string;
  completedAt?: string;
}

export interface PlayerStats {
  playerId: string;
  totalWins: number;
  totalHolesWon: number;
  holeInOnes: number;
  roundsPlayed: number;
}
