import type { TaskStatus } from './api';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  doing: 'Đang làm',
  done: 'Xong',
};

export const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'doing',
  doing: 'done',
  done: 'todo',
};

export const ROLE_LABEL: Record<string, string> = {
  owner: 'Chủ nhóm',
  admin: 'Quản trị',
  member: 'Thành viên',
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const picked = parts.length === 1 ? [parts[0]] : [parts[0], parts[parts.length - 1]];
  return picked.map((part) => part[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export function firstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : name;
}

/**
 * MySQL trả "YYYY-MM-DD HH:mm:ss" không kèm timezone (giờ của máy chủ).
 * Parse thủ công để Safari/Firefox không hiểu sai; hiển thị theo giờ máy chủ.
 */
function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? 0),
  );
}

export function formatDay(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function formatTime(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatStamp(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  return `${formatDay(value)} ${formatTime(value)}`;
}

export function formatJoined(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  return `tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

export function longToday(): string {
  const now = new Date();
  const weekday = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][now.getDay()];
  return `${weekday}, ${now.getDate()} tháng ${now.getMonth() + 1}`;
}

/** Mốc thời gian cùng định dạng backend trả về, dùng cho bản ghi vừa tạo tại client. */
export function localStamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
    now.getMinutes(),
  )}:${pad(now.getSeconds())}`;
}


export function relative(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  if (diff < minute) return 'vừa xong';
  if (diff < 60 * minute) return `${Math.floor(diff / minute)} phút trước`;
  if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} giờ trước`;
  if (diff < 48 * 60 * minute) return 'hôm qua';
  return formatDay(value);
}

export function isOnline(lastSeen?: string | null): boolean {
  const date = parseDate(lastSeen);
  if (!date) return false;
  return Date.now() - date.getTime() < 5 * 60_000;
}

export function percent(done: number, total: number): number {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
