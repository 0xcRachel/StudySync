import { useState } from 'react';
import type { Group, User } from '../lib/api';
import { longToday, percent } from '../lib/format';
import { useCountUp } from '../lib/motion';
import { Avatar, EmptyState, ErrorBar, Icon, SkeletonRows } from '../components/ui';

export function Home({
  user,
  groups,
  loading,
  error,
  onReload,
  onOpenGroup,
  onNewGroup,
}: {
  user: User;
  groups: Group[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
  onOpenGroup: (group: Group) => void;
  onNewGroup: () => void;
}) {
  const totalTasks = groups.reduce((sum, group) => sum + Number(group.task_count), 0);
  const openTasks = groups.reduce(
    (sum, group) => sum + Math.max(0, Number(group.task_count) - Number(group.completed_count)),
    0,
  );
  const doneTasks = groups.reduce((sum, group) => sum + Number(group.completed_count), 0);
  const globalPct = percent(doneTasks, totalTasks);

  const groupsCount = useCountUp(groups.length);
  const openCount = useCountUp(openTasks);
  const doneCount = useCountUp(doneTasks);

  const [search, setSearch] = useState('');

  const needle = search.trim().toLocaleLowerCase();
  const visibleGroups =
    needle === ''
      ? groups
      : groups.filter(
          (group) =>
            group.name.toLocaleLowerCase().includes(needle) ||
            (group.description ?? '').toLocaleLowerCase().includes(needle),
        );

  return (
    <>
      <div className="phead" data-tour="overview">
        <div>
          <div className="date num">{longToday().toUpperCase()}</div>
          <h1 className="h1">Chào {user.name}.</h1>
          <p className="psub">
            Toàn cảnh tiến độ các nhóm học tập của bạn. Chọn một nhóm bên dưới để điều phối công việc hoặc thảo luận trực tiếp.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn"
            data-tour="create-group"
            onClick={onNewGroup}
          >
            <Icon name="plus" size={14} />
            <span>Tạo nhóm mới</span>
          </button>
        </div>
      </div>

      <div className="ledger">
        <div className="stat">
          <div className="stat-head">
            <span className="stat-label">NHÓM ĐANG THAM GIA</span>
            <span className="stat-tag num">ACTIVE</span>
          </div>
          <span className="stat-num num" ref={groupsCount}>
            {groups.length}
          </span>
        </div>
        <div className="stat">
          <div className="stat-head">
            <span className="stat-label">VIỆC CÒN MỞ</span>
            <span className="stat-tag num">QUEUE</span>
          </div>
          <span className="stat-num num" ref={openCount}>
            {openTasks}
          </span>
        </div>
        <div className="stat">
          <div className="stat-head">
            <span className="stat-label">VIỆC ĐÃ HOÀN TẤT</span>
            <span className="stat-tag num">DONE</span>
          </div>
          <span className="stat-num num" ref={doneCount}>
            {doneTasks}
          </span>
        </div>
        <div className="stat">
          <div className="stat-head">
            <span className="stat-label">HIỆU SUẤT TỔNG</span>
            <span className="stat-tag num">{doneTasks}/{totalTasks}</span>
          </div>
          <div className="stat-meter-row">
            <span className="stat-num num">{globalPct}%</span>
            <span className="stat-bar">
              <i style={{ width: `${globalPct}%` }} />
            </span>
          </div>
        </div>
      </div>

      <div className="shead" data-tour="group-list">
        <div className="shead-left">
          <h2 className="h2">Không gian nhóm</h2>
          <span className="shead-badge num">{groups.length}</span>
        </div>
        {groups.length > 0 ? (
          <div className="shead-tools">
            <div className="inline-search">
              <Icon name="search" size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Lọc nhóm theo tên…"
                aria-label="Lọc nhóm theo tên"
              />
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div style={{ marginTop: 16 }}>
          <ErrorBar message={error} onRetry={onReload} />
        </div>
      ) : null}

      <div className="group-list-wrap">
        {loading ? (
          <SkeletonRows rows={3} />
        ) : groups.length === 0 ? (
          <EmptyState
            title="Chưa có không gian nhóm nào."
            action={
              <button type="button" className="btn" onClick={onNewGroup}>
                <Icon name="plus" size={14} />
                <span>Tạo nhóm đầu tiên</span>
              </button>
            }
          >
            Mỗi nhóm là một không gian độc lập gồm bảng công việc, phòng thảo luận thời gian thực và danh sách thành viên.
          </EmptyState>
        ) : visibleGroups.length === 0 ? (
          <EmptyState
            title={`Không tìm thấy nhóm khớp với “${search}”.`}
            action={
              <button type="button" className="btn-quiet" onClick={() => setSearch('')}>
                Xoá bộ lọc
              </button>
            }
          />
        ) : (
          <div className="grow-grid">
            {visibleGroups.map((group) => {
              const pct = percent(Number(group.completed_count), Number(group.task_count));
              const unread = Math.max(0, Number(group.unread_count ?? 0));
              const mentions = Math.max(0, Number(group.mention_count ?? 0));
              const open = Math.max(0, Number(group.task_count) - Number(group.completed_count));
              return (
                <button
                  type="button"
                  className={unread > 0 ? 'grow unread' : 'grow'}
                  key={group.id}
                  onClick={() => onOpenGroup(group)}
                >
                  <span className="grow-main">
                    <span className="grow-top">
                      <Avatar name={group.name} url={group.avatar_url} size={28} />
                      <span className="grow-code num">GRP-{String(group.id).padStart(2, '0')}</span>
                      <span className="grow-name">{group.name}</span>
                      {mentions > 0 ? (
                        <span className="grow-mention" aria-label={`${mentions} tin nhắc đến bạn`}>
                          @{mentions > 99 ? '99+' : mentions}
                        </span>
                      ) : unread > 0 ? (
                        <span className="grow-unread" aria-label={`${unread} tin chưa đọc`}>
                          {unread > 99 ? '99+' : unread} mới
                        </span>
                      ) : null}
                    </span>
                    <span className="grow-meta">
                      {group.description ||
                        `${open} việc đang chờ · ${group.completed_count}/${group.task_count} hoàn tất`}
                    </span>
                  </span>

                  <span className="grow-side">
                    <span className="grow-side-meta">
                      <span className="grow-tasks num">
                        {group.completed_count}/{group.task_count} việc
                      </span>
                      <span className="grow-pct num">{pct}%</span>
                    </span>
                    <span className="grow-prog">
                      <i style={{ width: `${pct}%` }} />
                    </span>
                  </span>

                  <span className="grow-arrow" aria-hidden="true">
                    <Icon name="arrow-right" size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
