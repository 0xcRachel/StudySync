import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TaskStatus } from '../lib/api';
import type { Session } from '../lib/session';
import { NEXT_STATUS, STATUS_LABEL, percent } from '../lib/format';
import { animateTaskCompletion, useLandingMotion, useSmoothScroll } from '../lib/motion';
import { AuthSheet, type AuthMode } from '../components/AuthSheet';
import { Avatar, Brand, Icon, StatusMark } from '../components/ui';

type DemoTask = {
  id: number;
  code: string;
  title: string;
  assignee: string;
  status: TaskStatus;
};

const DEMO: DemoTask[] = [
  { id: 1, code: 'SYN-01', title: 'Chốt kiến trúc cơ sở dữ liệu & phân quyền nhóm', assignee: 'Minh Anh', status: 'done' },
  { id: 2, code: 'SYN-02', title: 'Đồng bộ luồng WebSocket thời gian thực cho thảo luận', assignee: 'Hoàng Nam', status: 'doing' },
  { id: 3, code: 'SYN-03', title: 'Kiểm thử tự động hóa API & độ trễ phản hồi', assignee: 'Thảo Vy', status: 'todo' },
  { id: 4, code: 'SYN-04', title: 'Hoàn thiện slide bảo vệ đồ án trước hội đồng', assignee: 'Gia Huy', status: 'todo' },
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
      <span className="brow-code num">{task.code}</span>
      <span className="brow-title marked">
        <span className="hl" aria-hidden="true" />
        <span className="tt">{task.title}</span>
      </span>
      <span className="brow-assignee">
        <Avatar name={task.assignee} size={20} />
        <span>{task.assignee}</span>
      </span>
      <span className={`task-status s-${task.status}`}>{STATUS_LABEL[task.status]}</span>
    </button>
  );
}

export function Landing({
  onAuthed,
  apiState,
  theme = 'dark',
  onToggleTheme,
}: {
  onAuthed: (session: Session) => void;
  apiState: 'checking' | 'ok' | 'down';
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useSmoothScroll();
  const [authMode, setAuthMode] = useState<AuthMode | null>(() =>
    window.sessionStorage.getItem('studysync.oauth.error') ? 'login' : null,
  );
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
  const doing = demo.filter((task) => task.status === 'doing').length;
  const progress = percent(done, demo.length);

  return (
    <div className="land" ref={rootRef}>
      <header className={stuck ? 'topbar is-stuck' : 'topbar'}>
        <div className="wrap topbar-in">
          <Brand subtitle="OS 2.4" />
          <nav className="topbar-nav" aria-label="Liên kết nhanh">
            <a href="#preview" className="topbar-link">Không gian trực tiếp</a>
            <a href="#architecture" className="topbar-link">Kiến trúc</a>
            <a href="#manifesto" className="topbar-link">Triết lý</a>
          </nav>
          <div className="topbar-actions">
            {onToggleTheme ? (
              <button
                type="button"
                className="rail-icon-btn"
                onClick={onToggleTheme}
                aria-label="Đổi giao diện sáng/tối"
                title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
              </button>
            ) : null}
            <button type="button" className="btn-quiet" onClick={() => setAuthMode('login')}>
              Đăng nhập
            </button>
            <button type="button" className="btn" onClick={() => setAuthMode('register')}>
              <span>Bắt đầu ngay</span>
              <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="wrap hero">
          <div className="hero-copy">
            <div className="hero-pill" data-hero-fade>
              <span className="hero-pill-dot" />
              <span>HỆ ĐIỀU HÀNH CHO NHÓM HỌC TẬP HIỆU SUẤT CAO</span>
            </div>

            <h1 className="display">
              <span className="line" data-hero-line>
                <span>Biết việc gì</span>
              </span>
              <span className="line" data-hero-line>
                <span>đang chờ.</span>
              </span>
            </h1>

            <p className="lede" data-hero-fade>
              StudySync hợp nhất bảng công việc tốc độ cao, thảo luận thời gian thực và phân công
              thành viên trong một mặt phẳng tối giản duy nhất — để mỗi buổi họp bắt đầu bằng kết quả,
              không phải câu hỏi lặp lại.
            </p>

            <div className="hero-cta" data-hero-fade>
              <button type="button" className="btn btn-lg" onClick={() => setAuthMode('register')}>
                <span>Khởi tạo không gian</span>
                <Icon name="arrow-right" size={15} />
              </button>
              <button type="button" className="btn-ghost btn-lg" onClick={() => setAuthMode('login')}>
                Tôi đã có tài khoản
              </button>
            </div>

            <div className="hero-metrics" data-hero-fade>
              <div className="hero-metric">
                <span className="hero-metric-val num">&lt; 15ms</span>
                <span className="hero-metric-lbl">Đồng bộ trạng thái tức thì</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-val num">3-in-1</span>
                <span className="hero-metric-lbl">Công việc · Thảo luận · Nhân sự</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-val num">100%</span>
                <span className="hero-metric-lbl">Kiến trúc tối giản không nhiễu</span>
              </div>
            </div>
          </div>

          <div className="hero-art" id="preview" data-hero-board>
            <div className="board-wrap">
              <div className="board">
                <div className="board-chrome">
                  <div className="board-dots" aria-hidden="true">
                    <i /><i /><i />
                  </div>
                  <div className="board-path num">studysync.app / nhom-do-an-he-thong / #cong-viec</div>
                  <span className="board-live">
                    <span className="sdot ok" />
                    LIVE
                  </span>
                </div>

                <div className="board-head">
                  <div>
                    <div className="board-eyebrow">KHÔNG GIAN NHÓM MẪU</div>
                    <div className="board-name">Đồ án Kiến trúc Hệ thống Phân tán</div>
                    <div className="board-meta">
                      {done}/{demo.length} hoàn thành · {doing} đang thực hiện
                    </div>
                  </div>
                  <div className="board-pct-box">
                    <span className="board-pct num">{progress}%</span>
                    <span className="board-pct-sub">TIẾN ĐỘ</span>
                  </div>
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
                  <span>Nhấp trực tiếp vào từng dòng công việc để chuyển trạng thái.</span>
                  <span className="num">BẢN THỬ TƯƠNG TÁC</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap facts" id="architecture" data-reveal>
          <div className="fact">
            <span className="fact-idx num">01 / SINGLE SOURCE OF TRUTH</span>
            <h3>Một sổ cái chuẩn xác cho cả nhóm</h3>
            <p>
              Mọi thành viên nhìn vào cùng một mặt phẳng công việc theo thời gian thực. Ai phụ trách
              việc gì, hạng mục nào đang nghẽn — hiển thị rõ ràng trong tích tắc.
            </p>
          </div>
          <div className="fact">
            <span className="fact-idx num">02 / OPTIMISTIC ENGINE</span>
            <h3>Phản hồi giao diện không độ trễ</h3>
            <p>
              Trạng thái công việc chuyển ngay khi bạn nhấp chuột và tự động đối chiếu với máy chủ ở
              tầng nền. Nếu mất kết nối, dữ liệu tự hoàn nguyên an toàn.
            </p>
          </div>
          <div className="fact">
            <span className="fact-idx num">03 / CONTEXTUAL COLLABORATION</span>
            <h3>Thảo luận nằm ngay cạnh đầu việc</h3>
            <p>
              Kênh trao đổi trực tiếp, bình luận từng tác vụ, chia sẻ hình ảnh và nhắc tên @mention
              tích hợp liền mạch trong cùng một khung làm việc.
            </p>
          </div>
        </section>

        <section className="wrap quote-sec" id="manifesto" data-reveal>
          <div className="quote-block">
            <span className="fact-idx num">TRIẾT LÝ THIẾT KẾ</span>
            <p>
              “Công cụ tốt nhất không gây tiếng ồn. Nó biến sự phức tạp của làm việc nhóm thành một
              đường thẳng rõ ràng từ lúc giao việc tới khi hoàn tất.”
            </p>
            <cite>STUDYSYNC ARCHITECTURE TEAM</cite>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div className="foot-left">
            <Brand />
            <span className="foot-copy">Thiết kế tối giản chuẩn xác cho các nhóm học tập hiện đại.</span>
          </div>
          <span className="status">
            <span
              className={
                apiState === 'ok' ? 'sdot ok' : apiState === 'down' ? 'sdot bad' : 'sdot'
              }
            />
            {apiState === 'ok'
              ? 'Hệ thống máy chủ hoạt động bình thường'
              : apiState === 'down'
                ? 'Không kết nối được máy chủ'
                : 'Đang kiểm tra kết nối máy chủ'}
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
