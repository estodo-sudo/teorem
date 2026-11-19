import type * as Notifications from 'expo-notifications';

/**
 * Camp notifications, shared plumbing. Each camp plans its own local notifications (pure planning in
 * its engine) and exposes them through a `CampNotifier`; the app scheduler asks every registered camp
 * in the same sync (it cancels everything first) and routes taps back to the camp that owns them.
 */
export interface CampNotifRequest {
  identifier: string;
  content: Notifications.NotificationContentInput;
  date: Date;
}

export interface CampNotifier {
  /** Registers the camp's notification category (action buttons). */
  setup: () => Promise<void>;
  /** The camp's notifications for the coming days. */
  requests: (now: Date) => CampNotifRequest[];
  /** Handles a tap / action on one of the camp's notifications; false when it is not the camp's. */
  handleResponse: (res: Notifications.NotificationResponse) => boolean;
}

/** iOS keeps at most 64 scheduled notifications: every camp together stays under this. */
export const ALL_CAMPS_MAX = 40;

/** A local date at HH:MM on a day. */
export function atTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}

export async function setupCampNotifiers(notifiers: CampNotifier[]) {
  for (const n of notifiers) await n.setup();
}

/** Every camp's requests, soonest first, capped. */
export function campNotifRequests(notifiers: CampNotifier[], now = new Date()): CampNotifRequest[] {
  return notifiers
    .flatMap((n) => n.requests(now))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, ALL_CAMPS_MAX);
}

/** Lets the camp that owns a notification handle it. */
export const handleCampNotifResponse = (notifiers: CampNotifier[], res: Notifications.NotificationResponse) => notifiers.some((n) => n.handleResponse(res));
