import { Platform } from 'react-native';

import { ScheduledWorkout, WorkoutPlan } from '@/types/workout';

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';
let accessToken = '';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: { client_id: string; scope: string; callback: (response: { access_token?: string; error?: string }) => void }) => { requestAccessToken: (options?: { prompt?: string }) => void };
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

export const googleCalendarConfigured = Platform.OS === 'web' && Boolean(CLIENT_ID);

function loadGoogleIdentity() {
  if (Platform.OS !== 'web') return Promise.reject(new Error('Google Calendar connection is currently available on the web app.'));
  if (window.google?.accounts.oauth2) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-kinetic-google]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.kineticGoogle = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
    document.head.appendChild(script);
  });
}

export async function connectGoogleCalendar() {
  if (!CLIENT_ID) throw new Error('Google Calendar needs an OAuth client ID for this live domain.');
  await loadGoogleIdentity();
  return new Promise<string>((resolve, reject) => {
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) reject(new Error(response.error || 'Google authorization was cancelled.'));
        else { accessToken = response.access_token; resolve(accessToken); }
      },
    });
    if (!client) reject(new Error('Google sign-in is unavailable.'));
    else client.requestAccessToken({ prompt: 'consent' });
  });
}

async function calendarFetch(path: string, init?: RequestInit) {
  if (!accessToken) throw new Error('Connect Google Calendar first.');
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error?.message || 'Google Calendar request failed.');
  return response.status === 204 ? null : response.json();
}

function eventBody(item: ScheduledWorkout, plan: WorkoutPlan) {
  const start = new Date(item.startISO);
  const end = new Date(start.getTime() + item.durationMinutes * 60000);
  const basePath = Platform.OS === 'web' ? `/${window.location.pathname.split('/').filter(Boolean)[0] ?? ''}/` : '';
  const workoutUrl = Platform.OS === 'web' ? `${window.location.origin}${basePath}?workout=${encodeURIComponent(plan.id)}` : 'kineticform://';
  return {
    summary: `${plan.name} · KineticForm`,
    description: `${plan.exercises.map((exercise) => `${exercise.name}: ${exercise.sets} × ${exercise.repTarget}`).join('\n')}\n\nOpen workout: ${workoutUrl}`,
    start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    recurrence: item.recurrence === 'weekly' && item.weekdays?.length ? [`RRULE:FREQ=WEEKLY;BYDAY=${item.weekdays.map((day) => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][day]).join(',')}`] : undefined,
    reminders: { useDefault: true },
    source: { title: 'KineticForm', url: workoutUrl },
  };
}

export async function createGoogleEvent(item: ScheduledWorkout, plan: WorkoutPlan) {
  return calendarFetch('/calendars/primary/events', { method: 'POST', body: JSON.stringify(eventBody(item, plan)) }) as Promise<{ id: string; htmlLink: string }>;
}

export async function updateGoogleEvent(item: ScheduledWorkout, plan: WorkoutPlan) {
  if (!item.googleEventId) return createGoogleEvent(item, plan);
  return calendarFetch(`/calendars/primary/events/${encodeURIComponent(item.googleEventId)}`, { method: 'PUT', body: JSON.stringify(eventBody(item, plan)) }) as Promise<{ id: string; htmlLink: string }>;
}

export async function deleteGoogleEvent(eventId: string) {
  await calendarFetch(`/calendars/primary/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
}

export async function listGoogleWorkoutEvents() {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 90 * 86400000).toISOString();
  return calendarFetch(`/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&q=${encodeURIComponent('KineticForm')}`) as Promise<{ items?: { id: string; summary: string; htmlLink: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }[] }>;
}

export function disconnectGoogleCalendar() {
  if (accessToken && window.google?.accounts.oauth2) window.google.accounts.oauth2.revoke(accessToken, () => {});
  accessToken = '';
}

export function googleCalendarFallbackUrl(item: ScheduledWorkout, plan: WorkoutPlan) {
  const start = new Date(item.startISO);
  const end = new Date(start.getTime() + item.durationMinutes * 60000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const details = plan.exercises.map((exercise) => `${exercise.name}: ${exercise.sets} × ${exercise.repTarget}`).join('\n');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${plan.name} · KineticForm`)}&dates=${stamp(start)}/${stamp(end)}&details=${encodeURIComponent(details)}`;
}
