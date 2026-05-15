import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_KEY } from '../config';
import type {
  Event,
  EventDetails,
  EventHistoryItem,
  EventHistoryMatch,
  EventInviteItem,
  EventInviteStatusItem,
  FriendsSnapshot,
  LoginResponse,
  MeResponse,
  PairingMode,
  Player,
  RatingHistoryPoint,
  RatingNotification,
} from './types';

let cachedToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return cachedToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      try {
        const text = await res.text();
        if (text?.trim()) msg = text.trim();
      } catch {
        // ignore
      }
    }
    if (res.status === 401) {
      await setToken(null);
      if (
        msg === 'Session expired' ||
        msg === 'Token signature invalid' ||
        msg === 'Token malformed' ||
        msg === 'Token unsupported' ||
        msg === 'Invalid token'
      ) {
        throw new Error('Сессия истекла. Войдите снова.');
      }
    }
    throw new Error(msg);
  }

  const text = await res.text();
  return (text ? (JSON.parse(text) as T) : (undefined as T));
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string, gender?: string) =>
    request<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, gender: gender || null }),
    }),
  me: () => request<MeResponse>('/api/me'),
  updateProfile: (payload: { name?: string; email?: string; password?: string; gender?: string }) =>
    request<MeResponse>('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateAvatar: (avatarDataUrl: string | null) =>
    request<MeResponse>('/api/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarDataUrl }),
    }),

  // Events
  upcomingEvents: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<Event[]>(`/api/events/upcoming${qs ? `?${qs}` : ''}`);
  },
  eventDetails: (eventId: string) => request<EventDetails>(`/api/events/${eventId}`),
  createEvent: (payload: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    format: 'AMERICANA';
    pairingMode: PairingMode;
    courtsCount: number;
    courtNames?: string[];
    autoRounds: boolean;
    roundsPlanned?: number;
    scoringMode: 'POINTS' | 'SETS';
    pointsPerPlayerPerMatch?: number;
  }) =>
    request<Event>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEvent: (
    eventId: string,
    payload: {
      title?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      pointsPerPlayerPerMatch?: number;
      courtsCount?: number;
      pairingMode?: PairingMode;
    },
  ) =>
    request<Event>(`/api/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteEvent: (eventId: string) =>
    request(`/api/events/${eventId}`, { method: 'DELETE' }),
  registerForEvent: (eventId: string, playerId: string) =>
    request(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),
  closeRegistration: (eventId: string) =>
    request(`/api/events/${eventId}/close-registration`, { method: 'POST' }),
  startEvent: (eventId: string) =>
    request(`/api/events/${eventId}/start`, { method: 'POST' }),
  finishEvent: (eventId: string) =>
    request(`/api/events/${eventId}/finish`, { method: 'POST' }),
  cancelRegistration: (eventId: string) =>
    request<{ status: string; message: string }>(`/api/events/${eventId}/cancel`, { method: 'POST' }),
  approveCancel: (eventId: string, playerId: string) =>
    request(`/api/events/${eventId}/cancel/${playerId}/approve`, { method: 'POST' }),
  removePlayerFromEvent: (eventId: string, playerId: string) =>
    request(`/api/events/${eventId}/remove/${playerId}`, { method: 'POST' }),
  submitScore: (matchId: string, points: { teamAPoints: number; teamBPoints: number }) =>
    request(`/api/events/matches/${matchId}/score`, {
      method: 'POST',
      body: JSON.stringify({ points }),
    }),
  saveDraftScore: (matchId: string, points: { teamAPoints: number; teamBPoints: number }) =>
    request(`/api/events/matches/${matchId}/draft-score`, {
      method: 'POST',
      body: JSON.stringify(points),
    }),
  addRound: (eventId: string) =>
    request(`/api/events/${eventId}/rounds/add`, { method: 'POST' }),
  addFinalRound: (eventId: string) =>
    request(`/api/events/${eventId}/rounds/final`, { method: 'POST' }),
  deleteRound: (eventId: string, roundId: string) =>
    request(`/api/events/${eventId}/rounds/${roundId}`, { method: 'DELETE' }),

  // Rating
  rating: () => request<Player[]>('/api/players/rating'),
  ratingHistory: () => request<RatingHistoryPoint[]>('/api/me/rating-history'),
  ratingNotification: () => request<RatingNotification | null>('/api/me/rating-notification'),
  markRatingNotificationSeen: (id: string) =>
    request(`/api/me/rating-notification/${id}/seen`, { method: 'POST' }),

  // History
  myHistory: () => request<EventHistoryItem[]>('/api/me/history'),
  myHistoryEvent: (eventId: string) =>
    request<EventHistoryMatch[]>(`/api/me/history/${eventId}`),

  // Friends
  friends: () => request<FriendsSnapshot>('/api/friends'),
  requestFriend: (publicId: string) =>
    request('/api/friends/request', { method: 'POST', body: JSON.stringify({ publicId }) }),
  acceptFriend: (publicId: string) =>
    request('/api/friends/accept', { method: 'POST', body: JSON.stringify({ publicId }) }),
  declineFriend: (publicId: string) =>
    request('/api/friends/decline', { method: 'POST', body: JSON.stringify({ publicId }) }),

  // Invites
  invites: () => request<EventInviteItem[]>('/api/invites'),
  acceptEventInvite: (eventId: string) =>
    request(`/api/events/${eventId}/invites/accept`, { method: 'POST' }),
  declineEventInvite: (eventId: string) =>
    request(`/api/events/${eventId}/invites/decline`, { method: 'POST' }),
  eventInvites: (eventId: string) =>
    request<EventInviteStatusItem[]>(`/api/events/${eventId}/invites`),
  inviteFriendToEvent: (eventId: string, publicId: string) =>
    request(`/api/events/${eventId}/invite`, { method: 'POST', body: JSON.stringify({ publicId }) }),
  addFriendToEvent: (eventId: string, publicId: string) =>
    request(`/api/events/${eventId}/add-friend`, { method: 'POST', body: JSON.stringify({ publicId }) }),
};
