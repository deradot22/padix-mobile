export type EventFormat = 'AMERICANA';
export type PairingMode = 'ROUND_ROBIN' | 'BALANCED';
export type EventStatus =
  | 'DRAFT'
  | 'OPEN_FOR_REGISTRATION'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED';
export type ScoringMode = 'SETS' | 'POINTS';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type Player = {
  id: string;
  name: string;
  rating: number;
  ntrp?: string;
  gamesPlayed: number;
  calibrationEventsRemaining?: number | null;
  publicId?: string;
  avatarUrl?: string | null;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  format: EventFormat;
  pairingMode: PairingMode;
  status: EventStatus;
  registeredCount: number;
  courtsCount: number;
  roundsPlanned: number;
  scoringMode: ScoringMode;
  pointsPerPlayerPerMatch: number;
  setsPerMatch: number;
  gamesPerSet: number;
  tiebreakEnabled: boolean;
};

export type PointsScore = { teamAPoints: number; teamBPoints: number };
export type SetScore = { teamAGames: number; teamBGames: number };

export type Match = {
  id: string;
  courtNumber: number;
  courtName?: string | null;
  teamA: Player[];
  teamB: Player[];
  status: string;
  score?: {
    mode: ScoringMode;
    points?: PointsScore;
    sets?: SetScore[];
  } | null;
};

export type Round = {
  id: string;
  roundNumber: number;
  matches: Match[];
};

export type EventDetails = {
  event: Event;
  rounds: Round[];
  registeredPlayers: Player[];
  pendingCancelRequests: Player[];
  isAuthor: boolean;
  authorName: string;
};

export type MeResponse = {
  email: string;
  playerId: string;
  name: string;
  rating: number;
  ntrp: string;
  gamesPlayed: number;
  publicId: string;
  surveyCompleted: boolean;
  surveyLevel: number | null;
  calibrationEventsRemaining: number;
  calibrationMatchesRemaining: number;
  avatarUrl?: string | null;
  gender?: string | null;
};

export type EventHistoryItem = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  participants?: string[];
  matchesCount: number;
  totalPoints: number | null;
  ratingDelta: number;
};

export type MatchPlayerInfo = { name: string; avatarUrl?: string | null };

export type EventHistoryMatch = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  roundNumber: number;
  matchId: string;
  courtNumber: number;
  scoringMode: string;
  score?: string | null;
  status: string;
  ratingDelta: number | null;
  teamText: string;
  opponentText: string;
  result: string;
  isTeamA: boolean;
  teamPlayers?: MatchPlayerInfo[];
  opponentPlayers?: MatchPlayerInfo[];
};

export type RatingHistoryPoint = {
  date: string;
  rating: number;
  delta: number | null;
  eventId: string | null;
};

export type FriendItem = {
  userId: string;
  publicId: string;
  name: string;
  rating: number;
  ntrp?: string;
  gamesPlayed: number;
  calibrationEventsRemaining: number;
  avatarUrl?: string | null;
};

export type FriendRequestItem = {
  publicId: string;
  name: string;
  avatarUrl?: string | null;
};

export type FriendsSnapshot = {
  friends: FriendItem[];
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
};

export type EventInviteItem = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  fromName: string;
  fromPublicId: string;
};

export type EventInviteStatusItem = {
  publicId: string;
  name: string;
  status: InviteStatus;
};

export type RatingNotification = {
  id: string;
  newRating: number;
  delta: number;
  eventId: string;
};

export type LoginResponse = {
  token: string;
};
