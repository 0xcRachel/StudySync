import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { gsap } from 'gsap';
import type { Group, User } from '../lib/api';
import { longToday, percent } from '../lib/format';
import { prefersReducedMotion, useCountUp } from '../lib/motion';
import { EmptyState, ErrorBar, SkeletonRows } from '../components/ui';
import { useToast } from '../components/Toast';

export function Home({
  user,
  groups,
  loading,
  error,
  createIntent,
  onReload,
  onOpenGroup,
  onCreateGroup,
}: {
  user: User;
  groups: Group[];
  loading: boolean;
  error: string | null;
  createIntent: number;
  onReload: () => void;
  onOpenGroup: (group: Group) => void;
  onCreateGroup: (name: string, description: string) => Promise<void>;
}) {
  const toast = useToast();
  const openTasks = groups.reduce(
    (sum, group) => sum + Math.max(0, Number(group.task_count) - Number(group.completed_count)),
    0,
  );
  const doneTasks = groups.reduce((sum, group) => sum + Number(group.completed_count), 0);

  const groupsCount = useCountUp(groups.length);
  const openCount = useCountUp(openTasks);
  const doneCount = useCountUp(doneTasks);

  const [createOpen, setCreateOpen] = useState(createIntent > 0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [lastIntent, setLastIntent] = useState(createIntent);

  // "Nhóm mới" từ thanh bên: mở form ngay khi intent tăng.
  if (createIntent !== lastIntent) {
    setLastIntent(createIntent);
    if (createIntent > 0) setCreateOpen(true);
  }

  useEffect(() => {
    if (!createOpen) return;
    const frame = window.requestAnimationFrame(() => nameRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [createOpen]);

  useLayoutEffect(() => {
    if (!createOpen || !formRef.current || prefersReducedMotion()) return undefined;
    const tween = gsap.fromTo(
      formRef.current,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: 0.34, ease: 'power2.out', clearProps: 'height' },
    );
    return () => {
      tween.kill();
    };
  }, [createOpen]);

  const closeForm = () => {
    setCreateOpen(false);
    setName('');
    setDescription('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const cleanName = name.trim();
    if (cleanName.length < 1) {
      toast('Nhập tên cho nhóm.', 'bad');
      return;
    }
    setBusy(true);
    try {
      await onCreateGroup(cleanName, description.trim());
      closeForm();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không tạo được nhóm.', 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="phead" data-tour="overview">
        <div>
          <div className="date">{longToday()}</div>
          <h1 className="h1">Chào {user.name}.</h1>
          <p className="psub">
            Đây là nhịp làm việc của nhóm bạn. Việc gì đang chờ nằm ngay bên dưới.
          </p>
        </div>
      </div>

      <div className="ledger">
        <div className="stat">
          <span className="stat-num num" ref={groupsCount}>
            {groups.length}
          </span>
          <div className="stat-label">Nhóm đang tham gia</div>
        </div>
        <div className="stat">
          <span className="stat-num num" ref={openCount}>
            {openTasks}
          </span>
          <div className="stat-label">Việc còn mở</div>
        </div>
        <div className="stat">
          <span className="stat-num num" ref={doneCount}>
            {doneTasks}
          </span>
          <div className="stat-label">Việc đã xong</div>
        </div>
      </div>

      <div className="shead" data-tour="group-list">
        <h2 className="h2">Nhóm của bạn</h2>
        <button
          type="button"
          className="btn-quiet"
          data-tour="create-group"
          onClick={() => (createOpen ? closeForm() : setCreateOpen(true))}
        >
          {createOpen ? 'Đóng' : 'Tạo nhóm'}
        </button>
      </div>

      {createOpen ? (
        <form className="groupform" ref={formRef} onSubmit={submit} noValidate>
          <div className="groupform-grid">
            <div>
              <label className="field-label" htmlFor="group-name">
                Tên nhóm
              </label>
              <input
                id="group-name"
                ref={nameRef}
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ôn thi Giải tích"
                maxLength={120}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="group-desc">
                Mô tả ngắn, không bắt buộc
              </label>
              <input
                id="group-desc"
                className="field"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ba buổi mỗi tuần, mục tiêu 8.0"
                maxLength={500}
              />
            </div>
          </div>
          <div className="actions" style={{ marginTop: 14 }}>
            <button type="submit" className="btn" disabled={busy || name.trim().length === 0}>
              {busy ? 'Đang tạo…' : 'Tạo nhóm'}
            </button>
            <button type="button" className="btn-quiet" onClick={closeForm}>
              Huỷ
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <div style={{ marginTop: 18 }}>
          <ErrorBar message={error} onRetry={onReload} />
        </div>
      ) : null}

      <div style={{ marginTop: 8 }}>
        {loading ? (
          <SkeletonRows rows={3} />
        ) : groups.length === 0 ? (
          <EmptyState
            title="Chưa có nhóm nào."
            action={
              <button type="button" className="btn" onClick={() => setCreateOpen(true)}>
                Tạo nhóm đầu tiên
              </button>
            }
          >
            Một nhóm là nơi công việc, thảo luận và thành viên cùng nằm. Tạo nhóm rồi mời người học cùng.
          </EmptyState>
        ) : (
          groups.map((group) => {
            const pct = percent(Number(group.completed_count), Number(group.task_count));
            return (
              <button
                type="button"
                className="grow"
                key={group.id}
                onClick={() => onOpenGroup(group)}
              >
                <span>
                  <span className="grow-name">{group.name}</span>
                  <span className="grow-meta">
                    {group.completed_count} trên {group.task_count} việc đã xong
                  </span>
                </span>
                <span className="grow-prog">
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span className="grow-pct">{pct}%</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
