// Admin inbox alerts: a short beep (Web Audio, no asset needed) + a desktop
// Notification when a message/conversation arrives while the tab is in the
// background. Preference is per-browser, stored in localStorage.

const ENABLED_KEY = "notificationsEnabled";

export function isNotifEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) !== "false"; // default on
}

export function setNotifEnabled(value: boolean): void {
  localStorage.setItem(ENABLED_KEY, String(value));
}

export function playBeep(): void {
  try {
    const Ctx =
      window.AudioContext || (window as unknown as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available — ignore.
  }
}

export async function ensureNotifPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notifyDesktop(title: string, body: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  try {
    new Notification(title, { body });
  } catch {
    // Some browsers throw on the constructor (require ServiceWorker) — ignore.
  }
}

/** Beep + desktop notification, but only when the tab is backgrounded. */
export function alertNewActivity(title: string, body: string): void {
  if (!isNotifEnabled()) return;
  if (!document.hidden) return;
  playBeep();
  notifyDesktop(title, body);
}
