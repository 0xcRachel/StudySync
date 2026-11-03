import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './api';

const KEY = 'studysync.session.v1';

export type Session = { token: string; user: User };

/**
 * Phiên được lưu trên thiết bị để mở app không phải đăng nhập lại, và để
 * đăng xuất xoá được token thật thay vì chỉ quên nó trong bộ nhớ.
 */
export async function readSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed.token !== 'string' || !parsed.user || typeof parsed.user.name !== 'string') return null;
    return { token: parsed.token, user: parsed.user };
  } catch {
    return null;
  }
}

export async function writeSession(session: Session): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage đầy hoặc bị chặn: phiên vẫn dùng được cho tới khi đóng app */
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}
