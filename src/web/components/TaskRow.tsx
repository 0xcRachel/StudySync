import { useLayoutEffect, useRef, useState } from 'react';
import type { Member, Task } from '../lib/api';
import { NEXT_STATUS, STATUS_LABEL, formatDay } from '../lib/format';
import { animateTaskCompletion } from '../lib/motion';
import { StatusMark } from './ui';

export function TaskRow({
  task,
  busy,
  onCycle,
  members,
  onAssign,
}: {
  task: Task;
  busy: boolean;
  onCycle: (task: Task) => void;
  members: Member[];
  onAssign: (task: Task, userIds: number[]) => Promise<void>;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const previous = useRef(task.status);
  const [selected, setSelected] = useState<number[]>(task.assignees?.map((person) => person.id) ?? []);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!rowRef.current) return;
    if (previous.current !== task.status) {
      animateTaskCompletion(rowRef.current, task.status === 'done');
      previous.current = task.status;
    }
  }, [task.status]);

  return (
    <div className={task.status === 'done' ? 'task is-done' : 'task'} ref={rowRef}>
      <button
        type="button"
        className="task-mark"
        onClick={() => onCycle(task)}
        disabled={busy}
        aria-label={`Đổi trạng thái: ${task.title} (${STATUS_LABEL[task.status]})`}
        title={`Chuyển sang ${STATUS_LABEL[NEXT_STATUS[task.status]]}`}
        style={busy ? { opacity: 0.5, cursor: 'progress' } : undefined}
      >
        <StatusMark status={task.status} />
      </button>
      <div className="task-body">
        <span className="task-title marked">
          <span className="hl" aria-hidden="true" />
          <span className="tt">{task.title}</span>
        </span>
        <div className="task-meta">
          <span>{STATUS_LABEL[task.status]}</span>
          {task.created_at ? <span>tạo {formatDay(task.created_at)}</span> : null}
          <span>{task.assignees?.length ? `Phụ trách: ${task.assignees.map((person) => person.name).join(', ')}` : 'Chưa phân công'}</span>
        </div>
        <details className="task-assign">
          <summary>Phân công</summary>
          <div className="task-assign-menu">
            {members.map((member) => (
              <label key={member.id}>
                <input type="checkbox" checked={selected.includes(member.id)} onChange={() => setSelected((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} />
                <span>{member.name}</span>
              </label>
            ))}
            <button type="button" className="btn btn-sm" disabled={saving} onClick={() => { setSaving(true); void onAssign(task, selected).finally(() => setSaving(false)); }}>
              {saving ? 'Đang lưu…' : 'Lưu phân công'}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
