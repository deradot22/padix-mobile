export type EventStatus =
  | 'DRAFT'
  | 'OPEN_FOR_REGISTRATION'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED';

export type PairingMode = 'ROUND_ROBIN' | 'BALANCED';
export type ScoringMode = 'SETS' | 'POINTS';

export type Player = {
  id: string;
  name: string;
  rating: number;
  ntrp?: string;
  gamesPlayed: number;
  publicId?: string;
  avatarUrl?: string | null;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  format: 'AMERICANA';
  pairingMode: PairingMode;
  status: EventStatus;
  registeredCount: number;
  courtsCount: number;
  roundsPlanned: number;
  scoringMode: ScoringMode;
};

export type MeResponse = {
  email: string;
  playerId: string;
  name: string;
  rating: number;
  ntrp: string;
  gamesPlayed: number;
  publicId: string;
  avatarUrl?: string | null;
};

export type LoginResponse = {
  token: string;
  player: MeResponse;
};
