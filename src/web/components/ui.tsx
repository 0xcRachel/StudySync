import type { ReactNode } from 'react';
import { resolveMediaUrl } from '../lib/api';
import type { TaskStatus } from '../lib/api';
import { initials } from '../lib/format';

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <span className="brand">
      <span className="mark" aria-hidden="true">
        <i />
      </span>
      <span className="brand-text">
        <span className="word">StudySync</span>
        {subtitle ? <span className="brand-tag">{subtitle}</span> : null}
      </span>
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
  const src = resolveMediaUrl(url);
  return (
    <span
      className={onPine ? 'avatar on-pine' : 'avatar'}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

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
  | 'at'
  | 'home'
  | 'users'
  | 'user'
  | 'search'
  | 'arrow-right'
  | 'arrow-left'
  | 'hash'
  | 'check'
  | 'sun'
  | 'moon'
  | 'help'
  | 'logout'
  | 'layers'
  | 'bolt'
  | 'sidebar';

const ICON_PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1.4" />
      <rect x="11" y="3" width="6" height="6" rx="1.4" />
      <rect x="3" y="11" width="6" height="6" rx="1.4" />
      <rect x="11" y="11" width="6" height="6" rx="1.4" />
    </>
  ),
  users: (
    <>
      <circle cx="8" cy="7.2" r="2.8" />
      <path d="M3.2 15.8c.5-2.6 2.4-4 4.8-4s4.3 1.4 4.8 4" />
      <circle cx="13.8" cy="7.8" r="2.1" />
      <path d="M14.4 12c1.6.4 2.7 1.6 3.1 3.5" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M4.2 16.2c.8-3 2.9-4.6 5.8-4.6s5 1.6 5.8 4.6" />
    </>
  ),
  at: (
    <>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M13.2 10v1.2a2 2 0 0 0 4 0V10a7.2 7.2 0 1 0-2.8 5.7" />
    </>
  ),
  bell: (
    <>
      <path d="M6.2 8.3a3.8 3.8 0 0 1 7.6 0c0 3.3 1.4 4.5 1.4 4.5H4.8s1.4-1.2 1.4-4.5Z" />
      <path d="M8.6 15.4a1.6 1.6 0 0 0 2.8 0" />
    </>
  ),
  chevron: <path d="M6.2 8.2 10 12l3.8-3.8" />,
  smiley: (
    <>
      <circle cx="10" cy="10" r="6.8" />
      <path d="M7.3 11.6c.7 1.1 1.6 1.6 2.7 1.6s2-.5 2.7-1.6" />
      <path d="M7.8 8.3h.01" />
      <path d="M12.2 8.3h.01" />
    </>
  ),
  reply: (
    <>
      <path d="M8 5.5 3.8 9.5 8 13.5" />
      <path d="M4 9.5h7.4a4.6 4.6 0 0 1 4.6 4.6v1.2" />
    </>
  ),
  pencil: (
    <>
      <path d="M4.2 15.8l.8-2.9 7.6-7.6a1.7 1.7 0 0 1 2.4 2.4l-7.6 7.6-3.2.5Z" />
      <path d="M12.5 6.5l1.9 1.9" />
    </>
  ),
  trash: (
    <>
      <path d="M3.8 6.2h12.4" />
      <path d="M7.8 6.2V4.8a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1v1.4" />
      <path d="M5.6 6.2l.6 9.1a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.6-9.1" />
    </>
  ),
  close: (
    <>
      <path d="M5.5 5.5l9 9" />
      <path d="M14.5 5.5l-9 9" />
    </>
  ),
  plus: (
    <>
      <path d="M10 4.5v11" />
      <path d="M4.5 10h11" />
    </>
  ),
  gift: (
    <>
      <rect x="3.8" y="8.2" width="12.4" height="3.2" rx="0.8" />
      <path d="M5.2 11.4v3.8a1 1 0 0 0 1 1h7.6a1 1 0 0 0 1-1v-3.8" />
      <path d="M10 8.2v8" />
      <path d="M10 8.2c-2.5 0-3.3-.9-3.3-2A1.6 1.6 0 0 1 10 5.2a1.6 1.6 0 0 1 3.3 1c0 1.1-.8 2-3.3 2Z" />
    </>
  ),
  send: (
    <>
      <path d="M16.8 3.6 3.4 8.7a.6.6 0 0 0 .02 1.14l5.4 1.84 1.84 5.4a.6.6 0 0 0 1.14.02L16.8 3.6Z" />
      <path d="M8.8 11.6 16.8 3.6" />
    </>
  ),
  image: (
    <>
      <rect x="3.2" y="4.4" width="13.6" height="11.2" rx="2" />
      <path d="M3.4 12.8l3.5-3.2a1.6 1.6 0 0 1 2.2 0l4.3 4" />
      <circle cx="7.4" cy="8" r="1" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5.2" />
      <path d="M13 13l3.6 3.6" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4.2 10h11.6" />
      <path d="M11.2 5.4 15.8 10l-4.6 4.6" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M15.8 10H4.2" />
      <path d="M8.8 5.4 4.2 10l4.6 4.6" />
    </>
  ),
  hash: (
    <>
      <path d="M4.5 7.5h11" />
      <path d="M4.5 12.5h11" />
      <path d="M8 4l-1.2 12" />
      <path d="M13.2 4 12 16" />
    </>
  ),
  check: <path d="M4.5 10.5 8.2 14.2 15.5 6.2" />,
  sun: (
    <>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.8v1.8M10 15.4v1.8M2.8 10h1.8M15.4 10h1.8M4.9 4.9l1.3 1.3M13.8 13.8l1.3 1.3M15.1 4.9l-1.3 1.3M6.2 13.8l-1.3 1.3" />
    </>
  ),
  moon: (
    <path d="M15.4 12.4A6.2 6.2 0 0 1 7.6 4.6a6.2 6.2 0 1 0 7.8 7.8Z" />
  ),
  help: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M8.2 7.8a2 2 0 1 1 2.7 1.9c-.6.3-.9.7-.9 1.4" />
      <path d="M10 13.8h.01" />
    </>
  ),
  logout: (
    <>
      <path d="M7.5 4.2H5.4a1.4 1.4 0 0 0-1.4 1.4v8.8a1.4 1.4 0 0 0 1.4 1.4h2.1" />
      <path d="M12.4 6.6 15.8 10l-3.4 3.4" />
      <path d="M8.2 10h7.4" />
    </>
  ),
  layers: (
    <>
      <path d="M10 3.4 3.2 7l6.8 3.6L16.8 7 10 3.4Z" />
      <path d="M3.2 10.2 10 13.8l6.8-3.6" />
      <path d="M3.2 13.4 10 17l6.8-3.6" />
    </>
  ),
  bolt: (
    <path d="M11 3.2 4.8 10.8H10l-1 6 6.2-7.6H10l1-6Z" />
  ),
  sidebar: (
    <>
      <rect x="3" y="3.8" width="14" height="12.4" rx="2" />
      <path d="M7.6 3.8v12.4" />
    </>
  ),
};

export function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
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
  const doing = status === 'doing';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`status-svg is-${status}`}>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={done ? 'var(--accent)' : 'transparent'}
        stroke={status === 'todo' ? 'var(--line-3)' : doing ? 'var(--warn)' : 'var(--accent)'}
        strokeWidth="1.75"
        strokeDasharray={status === 'todo' ? '3 2.5' : undefined}
        style={{ transition: 'fill .2s ease, stroke .2s ease' }}
      />
      {doing ? <path d="M12 3a9 9 0 0 1 0 18V3Z" fill="var(--warn)" /> : null}
      <path
        d="M7.8 12.2 10.6 15l5.6-5.8"
        stroke={done ? 'var(--accent-ink)' : 'transparent'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="15"
        strokeDashoffset={done ? 0 : 15}
        style={{ transition: 'stroke-dashoffset .32s cubic-bezier(.22,1,.36,1), stroke .15s ease' }}
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
      <div className="empty-head">
        <div>
          <p className="empty-title">{title}</p>
          {children ? <p className="empty-copy">{children}</p> : null}
        </div>
        {action ? <div className="empty-action">{action}</div> : null}
      </div>
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="sk-list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="sk-row" key={index}>
          <span className="sk" style={{ width: 18, height: 18, borderRadius: 999 }} />
          <span className="sk" style={{ height: 12, width: `${46 + ((index * 17) % 38)}%` }} />
          <span className="sk" style={{ height: 10, width: 56 }} />
        </div>
      ))}
    </div>
  );
}

export function ErrorBar({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bar" role="status">
      <span className="bar-dot" aria-hidden="true" />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry ? (
        <button type="button" className="btn-quiet" onClick={onRetry} style={{ color: 'inherit' }}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
