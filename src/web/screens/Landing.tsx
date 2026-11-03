import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TaskStatus } from '../lib/api';
import type { Session } from '../lib/session';
import { NEXT_STATUS, STATUS_LABEL, percent } from '../lib/format';
import { animateTaskCompletion, useLandingMotion } from '../lib/motion';
import { AuthSheet, type AuthMode } from '../components/AuthSheet';
import { Brand, StatusMark } from '../components/ui';

type DemoTask = { id: number; title: string; status: TaskStatus };

const DEMO: DemoTask[] = [
  { id: 1, title: 'Chốt đề tài với nhóm', status: 'done' },
  { id: 2, title: 'Dựng bản thảo báo cáo', status: 'doing' },
  { id: 3, title: 'Kiểm thử luồng tạo việc', status: 'todo' },
  { id: 4, title: 'Chuẩn bị buổi bảo vệ', status: 'todo' },
];

function DemoRow({ task, onToggle }: { task: DemoTask; onToggle: (id: number) => void }) {
  const rowRef = useRef<HTMLButtonElement | null>(null);
  const previous = useRef(task.status);

  useLayoutEffect(() => {
    if (!rowRef.current) return;
    if (previous.current !== task.status) {
      animateTaskCompletion(rowRef.current, task.status === 'done');
      previous.current = task.status;
    }
  }, [task.status]);

  return (
    <button
      type="button"
      ref={rowRef}
      className={task.status === 'done' ? 'brow done' : 'brow'}
      data-board-row
      onClick={() => onToggle(task.id)}
      aria-label={`${task.title}. ${STATUS_LABEL[task.status]}. Chuyển sang ${STATUS_LABEL[NEXT_STATUS[task.status]]}`}
    >
      <span className="brow-mark">
        <StatusMark status={task.status} />
      </span>
      <span className="brow-title marked">
        <span className="hl" aria-hidden="true" />
        <span className="tt">{task.title}</span>
      </span>
      <span className="brow-state">{STATUS_LABEL[task.status]}</span>
    </button>
  );
}

export function Landing({
  onAuthed,
  apiState,
}: {
  onAuthed: (session: Session) => void;
  apiState: 'checking' | 'ok' | 'down';
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(() => window.sessionStorage.getItem('studysync.oauth.error') ? 'login' : null);
  const [demo, setDemo] = useState<DemoTask[]>(DEMO);
  const [stuck, setStuck] = useState(false);

  useLandingMotion(rootRef);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const done = demo.filter((task) => task.status === 'done').length;
  const progress = percent(done, demo.length);

  return (
    <div className="land" ref={rootRef}>
      <header className={stuck ? 'topbar is-stuck' : 'topbar'}>
        <div className="wrap topbar-in">
          <Brand />
          <div className="topbar-actions">
            <button type="button" className="btn-quiet" onClick={() => setAuthMode('login')}>
              Đăng nhập
            </button>
            <button type="button" className="btn" onClick={() => setAuthMode('register')}>
              Bắt đầu
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="wrap hero">
          <div className="hero-copy">
            <h1 className="display">
              <span className="line" data-hero-line>
                <span>Biết việc gì</span>
              </span>
              <span className="line" data-hero-line>
                <span>đang chờ.</span>
              </span>
            </h1>
            <p className="lede" data-hero-fade>
              StudySync giữ công việc, thảo luận và tiến độ của nhóm học tập trong một chỗ, để buổi họp
              nhóm bắt đầu bằng việc làm chứ không phải hỏi lại.
            </p>
            <div className="hero-cta" data-hero-fade>
              <button type="button" className="btn" onClick={() => setAuthMode('register')}>
                Tạo tài khoản
              </button>
              <button type="button" className="btn-quiet" onClick={() => setAuthMode('login')}>
                Tôi đã có tài khoản
              </button>
            </div>
          </div>

          <div className="hero-art" data-hero-board>
            <div className="board-wrap">
              <div className="board">
                <div className="board-head">
                  <div>
                    <div className="board-name">Nhóm Đồ án Mobile</div>
                    <div className="board-meta">
                      {done} trên {demo.length} việc đã xong
                    </div>
                  </div>
                  <span className="board-meta">{progress}%</span>
                </div>
                <div className="meter">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <div className="board-list">
                  {demo.map((task) => (
                    <DemoRow
                      key={task.id}
                      task={task}
                      onToggle={(id) =>
                        setDemo((current) =>
                          current.map((item) =>
                            item.id === id ? { ...item, status: NEXT_STATUS[item.status] } : item,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
                <div className="board-foot">
                  <span>Bấm vào một việc để thử.</span>
                  <span>Ví dụ</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap facts" data-reveal>
          <div className="fact">
            <h3>Một danh sách cho cả nhóm</h3>
            <p>
              Ai mở cũng thấy đúng việc đang làm và việc đã xong, không phải hỏi lại trong nhóm chat.
            </p>
          </div>
          <div className="fact">
            <h3>Đổi trạng thái là lưu lại</h3>
            <p>
              Giao diện đổi trước, máy chủ ghi sau. Nếu mạng đứt, việc đó quay về trạng thái cũ và bạn
              được báo.
            </p>
          </div>
          <div className="fact">
            <h3>Bàn việc ngay cạnh công việc</h3>
            <p>
              Thảo luận và danh sách thành viên nằm trong cùng một nhóm, nên quyết định không bị trôi
              mất.
            </p>
          </div>
        </section>

        <section className="wrap quote-sec" data-reveal>
          <div className="quote-block">
            <p>
              “Học cùng nhau không cần ồn ào. Chỉ cần mọi người nhìn vào cùng một danh sách và biết việc
              gì đang chờ.”
            </p>
            <cite>StudySync</cite>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <span>Dành cho những nhóm học tập làm việc thật.</span>
          <span className="status">
            <span
              className={
                apiState === 'ok' ? 'sdot ok' : apiState === 'down' ? 'sdot bad' : 'sdot'
              }
            />
            {apiState === 'ok'
              ? 'Máy chủ đang hoạt động'
              : apiState === 'down'
                ? 'Chưa kết nối được máy chủ'
                : 'Đang kiểm tra máy chủ'}
          </span>
        </div>
      </footer>

      <AuthSheet
        open={authMode !== null}
        mode={authMode ?? 'login'}
        onModeChange={setAuthMode}
        onClose={() => setAuthMode(null)}
        onAuthed={onAuthed}
      />
    </div>
  );
}
