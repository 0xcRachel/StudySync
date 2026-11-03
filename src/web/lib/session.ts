import type { User } from './api';

const KEY = 'studysync.session.v1';

export type Session = {
  token: string;
  user: User;
};

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed || typeof parsed.token !== 'string' || !parsed.user || typeof parsed.user.name !== 'string') {
      return null;
    }
    return { token: parsed.token, user: parsed.user };
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage bị chặn: phiên chỉ tồn tại trong bộ nhớ */
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}

export function updateStoredUser(user: User): void {
  const current = readSession();
  if (!current) return;
  writeSession({ ...current, user });
}
