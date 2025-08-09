export type Player = {
  id: string;
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  paymentStatus: 'paid' | 'unpaid';
};

export type Team = {
  id: string;
  name: string;
  teamNumber: number;
  tournamentId: string;
  players: [Player, Player];
  isCheckedIn: boolean;
  createdAt: Date;
};

export type Court = {
  id: string;
  number: number;
  name?: string;
  tournamentId: string;
  createdAt: Date;
};

export type Tournament = {
  id: string;
  name: string;
  seedMatchesPerTeam: number;
  totalCourts: number;
  teamsToAdvance?: number;
  courts?: Court[];
  createdAt: Date;
};

export type Match = {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  roundType: 'seed' | 'playoff';
  scheduledCourt?: number;
  teamAScore?: number;
  teamBScore?: number;
  completedAt?: Date;
  startTime?: Date;
  result?: MatchResult;
  createdAt: Date;
};

export type MatchResult = {
  teamAScore: number;
  teamBScore: number;
  completedAt: Date;
};

export type CourtAssignment = {
  courtNumber: number;
  matchId: string;
  teamAId: string;
  teamBId: string;
  startTime: Date;
};

export type BracketMatch = {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  teamAId?: string;
  teamBId?: string;
  teamA?: Team;
  teamB?: Team;
  teamAScore?: number;
  teamBScore?: number;
  scheduledCourtId?: string;
  scheduledCourt?: Court;
  completedAt?: Date;
  winnerAdvancesToMatchId?: string;
};

export type Bracket = {
  tournamentId: string;
  matches: BracketMatch[];
};

export type TeamStats = {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
};