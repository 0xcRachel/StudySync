import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as api from '../lib/api';
import type { Member, Task, TaskComment } from '../lib/api';
import { NEXT_STATUS, STATUS_LABEL, formatDay, localStamp, relative } from '../lib/format';
import { animateTaskCompletion } from '../lib/motion';
import { Avatar, Icon, StatusMark } from './ui';

export function TaskRow({
  task,
  busy,
  onCycle,
  members,
  onAssign,
  token,
  userId,
  onRename,
  onDelete,
}: {
  task: Task;
  busy: boolean;
  onCycle: (task: Task) => void;
  members: Member[];
  onAssign: (task: Task, userIds: number[]) => Promise<void>;
  token: string;
  userId: number;
  onRename: (task: Task, title: string) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const previous = useRef(task.status);
  const assigneeKey = (task.assignees ?? []).map((person) => person.id).join(',');
  const [selected, setSelected] = useState<number[]>(task.assignees?.map((person) => person.id) ?? []);
  const [saving, setSaving] = useState(false);
  const syncedKey = useRef(assigneeKey);

  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const loadComments = useCallback(async () => {
    setCommentBusy(true);
    try {
      setComments(await api.getTaskComments(task.id, token));
    } catch {
      setComments([]);
    } finally {
      setCommentBusy(false);
    }
  }, [task.id, token]);

  useEffect(() => {
    if (syncedKey.current === assigneeKey) return;
    syncedKey.current = assigneeKey;
    setSelected(assigneeKey ? assigneeKey.split(',').map(Number) : []);
  }, [assigneeKey]);

  useLayoutEffect(() => {
    if (!rowRef.current) return;
    if (previous.current !== task.status) {
      animateTaskCompletion(rowRef.current, task.status === 'done');
      previous.current = task.status;
    }
  }, [task.status]);

  const saveTitle = async () => {
    const title = titleDraft.trim();
    setRenaming(false);
    if (title === '' || title === task.title) return;
    try {
      await onRename(task, title);
    } catch {
      /* thông báo lỗi do caller hiển thị */
    }
  };

  const postComment = async () => {
    const body = commentDraft.trim();
    if (body === '' || commentBusy) return;
    setCommentBusy(true);
    try {
      const created = await api.addTaskComment(task.id, body, token);
      setComments((current) => [...(current ?? []), { ...created, created_at: localStamp() }]);
      setCommentDraft('');
    } catch {
      /* giữ nguyên draft khi thất bại */
    } finally {
      setCommentBusy(false);
    }
  };

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
        <div className="task-primary-line">
          <span className="task-code num">TSK-{String(task.id).padStart(2, '0')}</span>
          {renaming ? (
            <div className="task-rename">
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={() => void saveTitle()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void saveTitle();
                  }
                  if (event.key === 'Escape') {
                    setTitleDraft(task.title);
                    setRenaming(false);
                  }
                }}
                maxLength={120}
                autoFocus
                aria-label="Đổi tên công việc"
              />
            </div>
          ) : (
            <span className="task-title" onDoubleClick={() => { setTitleDraft(task.title); setRenaming(true); }}>
              <span className="marked">
                <span className="hl" aria-hidden="true" />
                <span className="tt">{task.title}</span>
              </span>
            </span>
          )}
        </div>

        <div className="task-meta">
          <span className={`task-status s-${task.status}`}>{STATUS_LABEL[task.status]}</span>
          {task.created_at ? <span className="task-when num">Tạo {formatDay(task.created_at)}</span> : null}
          {task.assignees?.length ? (
            <span className="task-people" title={task.assignees.map((person) => person.name).join(', ')}>
              {task.assignees.slice(0, 3).map((person) => (
                <Avatar key={person.id} name={person.name} url={person.avatar_url} size={20} />
              ))}
              {task.assignees.length > 3 ? (
                <span className="task-people-more num">+{task.assignees.length - 3}</span>
              ) : null}
              <span className="task-people-label">
                {task.assignees.length === 1
                  ? task.assignees[0].name
                  : `${task.assignees.length} người phụ trách`}
              </span>
            </span>
          ) : (
            <span className="task-people none">Chưa phân công</span>
          )}
        </div>

        <div className="task-tools">
          <button
            type="button"
            className="task-tool"
            onClick={() => {
              setTitleDraft(task.title);
              setRenaming(true);
            }}
            aria-label="Đổi tên công việc"
            title="Đổi tên"
          >
            <Icon name="pencil" size={14} />
          </button>
          <button
            type="button"
            className={confirmDelete ? 'task-tool danger confirm' : 'task-tool danger'}
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                window.setTimeout(() => setConfirmDelete(false), 4000);
                return;
              }
              void onDelete(task);
            }}
            aria-label={confirmDelete ? 'Bấm lần nữa để xoá' : 'Xoá công việc'}
            title={confirmDelete ? 'Bấm lần nữa để xoá' : 'Xoá công việc'}
          >
            {confirmDelete ? 'Xoá?' : <Icon name="trash" size={14} />}
          </button>
        </div>

        <div className="task-drawers">
          <details className="task-assign">
            <summary className="task-chip">
              <span>Phân công</span>
              <Icon name="chevron" size={12} />
            </summary>
            <div className="task-assign-menu">
              {members.map((member) => (
                <label key={member.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(member.id)}
                    onChange={() =>
                      setSelected((current) =>
                        current.includes(member.id)
                          ? current.filter((id) => id !== member.id)
                          : [...current, member.id],
                      )
                    }
                  />
                  <Avatar name={member.name} url={member.avatar_url} size={18} />
                  <span>{member.name}</span>
                </label>
              ))}
              <button
                type="button"
                className="btn btn-sm"
                disabled={saving}
                onClick={() => {
                  setSaving(true);
                  void onAssign(task, selected).finally(() => setSaving(false));
                }}
              >
                {saving ? 'Đang lưu…' : 'Lưu phân công'}
              </button>
            </div>
          </details>

          <details
            className="task-comments"
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open && comments === null) void loadComments();
            }}
          >
            <summary className="task-chip">
              <span>Bình luận{comments && comments.length > 0 ? ` (${comments.length})` : ''}</span>
              <Icon name="chevron" size={12} />
            </summary>
            <div className="task-comment-list">
              {comments === null ? (
                <p className="task-comment-empty">Đang tải…</p>
              ) : comments.length === 0 ? (
                <p className="task-comment-empty">Chưa có bình luận nào cho công việc này.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    className={comment.user_id === userId ? 'task-comment me' : 'task-comment'}
                    key={comment.id}
                  >
                    <span className="task-comment-head">
                      <strong>{comment.user_id === userId ? 'Bạn' : comment.user_name}</strong>
                      <span className="num">{relative(comment.created_at)}</span>
                    </span>
                    <p className="task-comment-body">{comment.body}</p>
                  </div>
                ))
              )}
              <div className="task-comment-form">
                <input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void postComment();
                    }
                  }}
                  placeholder="Viết bình luận phản hồi…"
                  maxLength={1000}
                  aria-label="Bình luận mới"
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={commentBusy || commentDraft.trim() === ''}
                  onClick={() => void postComment()}
                >
                  Gửi
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
