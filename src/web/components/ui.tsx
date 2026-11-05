import type { ReactNode } from 'react';
import type { TaskStatus } from '../lib/api';
import { initials } from '../lib/format';

export function Brand() {
  return (
    <span className="brand">
      <span className="mark" aria-hidden="true">
        <i />
      </span>
      <span className="word">StudySync</span>
    </span>
  );
}

export function Avatar({
  name,
  url,
  size = 28,
  onPine = false,
}: {
  name: string;
  url?: string | null;
  size?: number;
  onPine?: boolean;
}) {
  return (
    <span
      className={onPine ? 'avatar on-pine' : 'avatar'}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {url && url.startsWith('https://') ? <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" /> : initials(name)}
    </span>
  );
}

/**
 * Bộ icon nét mảnh dùng chung. Trước đây chat vẽ icon bằng ký tự văn bản
 * (☺ ↩ ✎ × ＋ ↑), mỗi ký tự một bề rộng và baseline riêng nên hàng nút bị
 * lech; SVG cùng khung 20×20 khắc phục hẳn.
 */
export type IconName =
  | 'smiley'
  | 'reply'
  | 'pencil'
  | 'trash'
  | 'close'
  | 'plus'
  | 'gift'
  | 'send'
  | 'image'
  | 'bell'
  | 'chevron'
  | 'at';

const ICON_PATHS: Record<IconName, ReactNode> = {
  at: (
    <>
      <circle cx="10" cy="10" r="3.3" />
      <path d="M13.3 10v1.3a2.1 2.1 0 0 0 4.2 0V10a7.5 7.5 0 1 0-2.9 5.9" />
    </>
  ),
  bell: (
    <>
      <path d="M6.2 8.4a3.8 3.8 0 0 1 7.6 0c0 3.4 1.3 4.6 1.3 4.6H4.9s1.3-1.2 1.3-4.6z" />
      <path d="M8.6 15.4a1.6 1.6 0 0 0 2.8 0" />
    </>
  ),
  chevron: <path d="M6.5 8.5 10 12l3.5-3.5" />,
  smiley: (
    <>
      <circle cx="10" cy="10" r="6.75" />
      <path d="M7.2 11.7c.7 1.1 1.6 1.7 2.8 1.7s2.1-.6 2.8-1.7" />
      <path d="M7.9 8.2h.01" />
      <path d="M12.1 8.2h.01" />
    </>
  ),
  reply: (
    <>
      <path d="M8.2 5.4 3.8 9.5l4.4 4.1" />
      <path d="M3.8 9.5h7.4a4.6 4.6 0 0 1 4.6 4.6v1.4" />
    </>
  ),
  pencil: (
    <>
      <path d="M4.2 15.8l.8-2.9 7.6-7.6a1.7 1.7 0 0 1 2.4 2.4l-7.6 7.6-3.2.5z" />
      <path d="M12.6 6.6l1.8 1.8" />
    </>
  ),
  trash: (
    <>
      <path d="M3.8 6.4h12.4" />
      <path d="M7.8 6.4V4.9a1.1 1.1 0 0 1 1.1-1.1h2.2a1.1 1.1 0 0 1 1.1 1.1v1.5" />
      <path d="M5.6 6.4l.7 9a1.6 1.6 0 0 0 1.6 1.5h4.2a1.6 1.6 0 0 0 1.6-1.5l.7-9" />
    </>
  ),
  close: (
    <>
      <path d="M5.6 5.6l8.8 8.8" />
      <path d="M14.4 5.6l-8.8 8.8" />
    </>
  ),
  plus: (
    <>
      <path d="M10 4.6v10.8" />
      <path d="M4.6 10h10.8" />
    </>
  ),
  gift: (
    <>
      <path d="M4.2 8.6h11.6v3.2H4.2z" />
      <path d="M5.6 11.8v3.4a1 1 0 0 0 1 1h6.8a1 1 0 0 0 1-1v-3.4" />
      <path d="M10 8.6v7.6" />
      <path d="M10 8.6c-2.6 0-3.4-1-3.4-2.1A1.7 1.7 0 0 1 10 5.4a1.7 1.7 0 0 1 3.4 1.1c0 1.1-.8 2.1-3.4 2.1z" />
    </>
  ),
  send: (
    <>
      <path d="M17.4 3.4 3.2 8.6a.7.7 0 0 0 0 1.3l5.5 1.9 1.9 5.5a.7.7 0 0 0 1.3 0z" />
      <path d="M8.7 11.8 17.4 3.4" />
    </>
  ),
  image: (
    <>
      <rect x="3.4" y="4.6" width="13.2" height="10.8" rx="2.2" />
      <path d="M3.4 12.6l3.4-3.1a1.8 1.8 0 0 1 2.4 0l4.2 3.9" />
      <path d="M12.6 8.4l1.2-1.1a1.8 1.8 0 0 1 2.4 0l.4.4" />
      <path d="M7.6 8.2h.01" />
    </>
  ),
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function StatusMark({ status }: { status: TaskStatus }) {
  const done = status === 'done';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill={done ? '#16483B' : 'transparent'}
        stroke={status === 'todo' ? '#BCC1B6' : '#16483B'}
        strokeWidth="1.5"
        style={{ transition: 'fill .22s ease, stroke .22s ease' }}
      />
      {status === 'doing' ? <path d="M12 2.75a9.25 9.25 0 0 1 0 18.5V2.75Z" fill="#16483B" /> : null}
      <path
        d="M7.7 12.15 10.6 15l5.7-5.9"
        stroke={done ? '#F7F8F3' : 'transparent'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="15"
        strokeDashoffset={done ? 0 : 15}
        style={{ transition: 'stroke-dashoffset .38s cubic-bezier(.22,1,.36,1), stroke .15s ease' }}
      />
    </svg>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children ? <p className="small muted">{children}</p> : null}
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="sk-row" key={index}>
          <span className="sk" style={{ width: 20, height: 20, borderRadius: 999 }} />
          <span className="sk" style={{ height: 12, width: `${52 + ((index * 13) % 34)}%` }} />
          <span className="sk" style={{ height: 10, width: 44 }} />
        </div>
      ))}
    </div>
  );
}

export function ErrorBar({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bar" role="status">
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry ? (
        <button type="button" className="btn-quiet" onClick={onRetry} style={{ borderColor: 'currentColor', color: 'inherit' }}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
