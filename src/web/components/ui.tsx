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
