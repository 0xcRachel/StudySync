/**
 * StudySync web — design system.
 *
 * Hướng: "studio ledger". Giấy lạnh, mực đậm, một accent duy nhất (pine).
 * Không gradient, không glass, không icon emoji. Cấu trúc bằng đường kẻ 1px,
 * nhịp chữ và khoảng trắng. Toàn bộ CSS nằm trong một chuỗi để inject vào
 * <head> lúc runtime (Metro không cần xử lý CSS, native không bị ảnh hưởng).
 */
export const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@1,6..72,300..500&family=Onest:wght@300..800&display=swap';

export const CSS = `
:root {
  --paper: #f0f1ec;
  --surface: #f7f8f3;
  --sunk: #e6e8e1;
  --ink: #15171a;
  --ink-2: #565b54;
  --ink-3: #878c84;
  --line: #d8dbd2;
  --line-2: #bcc1b6;
  --pine: #16483b;
  --pine-deep: #0e3328;
  --wash: #dfe8e1;
  --danger: #8e3223;
  --rail: 248px;
  --pad: clamp(20px, 4vw, 64px);
  --sans: 'Onest', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --quote: 'Newsreader', Georgia, 'Times New Roman', serif;
}

.studysync-tour-popover.driver-popover {
  max-width: min(350px, calc(100vw - 28px));
  border: 1px solid var(--line-2);
  border-radius: 10px;
  background: var(--surface);
  color: var(--ink);
  font-family: Onest, sans-serif;
  box-shadow: 0 18px 60px rgb(13 28 23 / 24%);
}
.studysync-tour-popover .driver-popover-title { color: var(--ink); font: 600 16px/1.3 Onest, sans-serif; }
.studysync-tour-popover .driver-popover-description { color: var(--ink-2); font: 400 13px/1.65 Onest, sans-serif; }
.studysync-tour-popover .driver-popover-progress-text { color: var(--ink-3); font: 500 11px/1.4 Onest, sans-serif; }
.studysync-tour-popover .driver-popover-navigation-btns button { border-radius: 6px; font: 500 12px/1.2 Onest, sans-serif; }
.studysync-tour-popover .driver-popover-next-btn { background: var(--pine); border-color: var(--pine); text-shadow: none; }
.studysync-tour-popover .driver-popover-prev-btn { color: var(--ink-2); }
.studysync-tour-popover .driver-popover-close-btn { color: var(--ink-3); }

*, *::before, *::after { box-sizing: border-box; }

html, body {
  height: auto !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  margin: 0;
  padding: 0;
}

html { -webkit-text-size-adjust: 100%; scrollbar-gutter: stable; }

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 15.5px;
  line-height: 1.6;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-synthesis-weight: none;
}

#root {
  display: block !important;
  height: auto !important;
  min-height: 100vh;
  isolation: isolate;
}

/* Hạt giấy rất nhẹ: tạo cảm giác in ấn, không phải gradient trang trí. */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  opacity: .022;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
}

::selection { background: var(--wash); color: var(--ink); }

:focus-visible {
  outline: 2px solid var(--pine);
  outline-offset: 2px;
  border-radius: 2px;
}

html { scrollbar-width: thin; scrollbar-color: var(--line-2) transparent; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line-2); border: 3px solid var(--paper); border-radius: 6px; }

/* Lenis: một vòng raf duy nhất do gsap.ticker điều khiển. */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden !important; }
html.sheet-open, html.sheet-open body { overflow: hidden !important; }

/* Bỏ qua điều hướng: chỉ hiện khi được tab tới. */
.skip {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 200;
  padding: 10px 15px;
  border-radius: 4px;
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  transform: translateY(-180%);
  transition: transform .18s ease;
}
.skip:focus, .skip:focus-visible { transform: none; outline-color: var(--pine); }

h1, h2, h3, h4, p, blockquote, figure { margin: 0; }
ul, ol { margin: 0; padding: 0; list-style: none; }
button, input, textarea, select { font: inherit; color: inherit; }
button { cursor: pointer; background: none; border: 0; padding: 0; text-align: inherit; }
a { color: inherit; text-decoration: none; }
svg { display: block; }

/* ---------- Typography ---------- */

.display {
  font-size: clamp(46px, 6.4vw, 88px);
  line-height: 1.06;
  letter-spacing: -.045em;
  font-weight: 500;
}

.h1 {
  font-size: clamp(32px, 3.4vw, 46px);
  line-height: 1.05;
  letter-spacing: -.038em;
  font-weight: 500;
}

.h2 {
  font-size: 21px;
  line-height: 1.25;
  letter-spacing: -.022em;
  font-weight: 550;
}

.h3 {
  font-size: 16.5px;
  line-height: 1.35;
  letter-spacing: -.012em;
  font-weight: 550;
}

.lede {
  font-size: 16.5px;
  line-height: 1.62;
  letter-spacing: -.006em;
  color: var(--ink-2);
  max-width: 46ch;
}

.small { font-size: 13.5px; line-height: 1.5; letter-spacing: -.004em; }
.micro { font-size: 12px; line-height: 1.45; letter-spacing: .002em; }
.muted { color: var(--ink-2); }
.faint { color: var(--ink-3); }
.ink { color: var(--ink); }
.num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1; letter-spacing: -.03em; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ---------- Primitives ---------- */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border-radius: 6px;
  background: var(--pine);
  color: #f6f7f2;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -.008em;
  white-space: nowrap;
  transition: background-color .18s ease, color .18s ease, border-color .18s ease, transform .18s ease;
}
.btn:hover { background: var(--pine-deep); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

.btn-ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line-2);
}
.btn-ghost:hover { background: var(--surface); border-color: var(--ink-3); }

.btn-quiet {
  background: transparent;
  color: var(--ink-2);
  padding: 0 4px;
  height: auto;
  font-size: 13.5px;
  font-weight: 450;
  border-bottom: 1px solid var(--line-2);
  border-radius: 0;
  padding-bottom: 3px;
  transition: color .18s ease, border-color .18s ease;
}
.btn-quiet:hover { color: var(--ink); border-color: var(--ink); background: none; }

.btn-sm { height: 33px; padding: 0 14px; font-size: 12.5px; }

.linkish {
  color: var(--ink);
  border-bottom: 1px solid var(--line-2);
  padding-bottom: 1px;
  transition: border-color .18s ease, color .18s ease;
}
.linkish:hover { border-color: var(--ink); }

.field {
  width: 100%;
  height: 44px;
  padding: 0 13px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 15px;
  letter-spacing: -.006em;
  transition: border-color .16s ease, background-color .16s ease;
}
.field::placeholder { color: var(--ink-3); }
.field:hover { border-color: var(--line-2); }
.field:focus {
  outline: 2px solid var(--pine);
  outline-offset: 1px;
  border-color: var(--pine);
  background: #fbfcf8;
}
textarea.field {
  height: auto;
  min-height: 96px;
  padding: 11px 13px;
  line-height: 1.55;
  resize: vertical;
}
.field-label {
  display: block;
  font-size: 12.5px;
  color: var(--ink-2);
  margin-bottom: 7px;
  letter-spacing: -.004em;
}
.field-hint { font-size: 12px; color: var(--ink-3); margin-top: 6px; }

.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 1px solid var(--danger);
  border-radius: 4px;
  color: var(--danger);
  background: transparent;
  font-size: 13.5px;
  line-height: 1.45;
}

/* ---------- Avatar ---------- */

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 4px;
  background: var(--wash);
  color: var(--pine-deep);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: .01em;
  user-select: none;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.avatar.on-pine { background: rgba(255, 255, 255, .14); color: #f2f4ee; }

/* ---------- Landing ---------- */

.land { min-height: 100vh; display: flex; flex-direction: column; }
.wrap { width: 100%; max-width: 1200px; margin: 0 auto; padding-inline: var(--pad); }

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--paper);
  transition: border-color .25s ease;
  border-bottom: 1px solid transparent;
}
.topbar.is-stuck { border-bottom-color: var(--line); }
.topbar-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 72px;
}

.brand { display: inline-flex; align-items: center; gap: 10px; }
.brand .mark {
  width: 17px;
  height: 17px;
  border: 1px solid var(--ink);
  border-radius: 2px;
  display: grid;
  place-items: center;
  flex: none;
}
.brand .mark i { width: 7px; height: 7px; background: var(--pine); display: block; }
.brand .word {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -.035em;
}

.topbar-actions { display: flex; align-items: center; gap: 22px; }

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
  gap: clamp(44px, 6vw, 88px);
  align-items: start;
  padding-top: clamp(48px, 7vw, 96px);
  padding-bottom: clamp(64px, 9vw, 128px);
}
.hero-copy { padding-top: 6px; }
/* Dòng chữ có dấu tiếng Việt cần chừa chỗ cho dấu thanh trên đầu chữ. */
.line {
  display: block;
  overflow: hidden;
  padding: .06em 0 .1em;
  margin: -.06em 0 0;
}
.line > span { display: block; will-change: transform; }
.lede { margin-top: 30px; }
.hero-cta { display: flex; align-items: center; gap: 28px; margin-top: 38px; flex-wrap: wrap; }

.hero-art { position: relative; padding-top: 8px; }

/* Bảng việc thật ở hero: hiển thị đúng ngôn ngữ của sản phẩm. */
.board-wrap { position: relative; }
.board-wrap::before {
  content: '';
  position: absolute;
  inset: 12px -12px -12px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #e9eae3;
  z-index: 0;
}
.board {
  position: relative;
  z-index: 1;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 20px 20px 4px;
}
.board-head { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
.board-name { font-size: 15px; font-weight: 600; letter-spacing: -.02em; }
.board-meta { font-size: 12px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.meter { height: 1px; background: var(--line); margin: 14px 0 0; position: relative; overflow: hidden; }
.meter > i { position: absolute; inset: 0 auto 0 0; background: var(--pine); width: 0; transition: width .5s cubic-bezier(.22, 1, .36, 1); }
.board-list { margin-top: 4px; }
.brow {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: 13px 0;
  border-bottom: 1px solid var(--line);
  width: 100%;
}
.board-list .brow:last-child { border-bottom: 0; }
.brow:hover .brow-title { color: var(--ink); }
.brow-mark { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; }
.brow-title { font-size: 13.5px; color: var(--ink-2); letter-spacing: -.006em; }
.brow.done .brow-title { color: var(--ink-3); }
.brow-state { font-size: 11.5px; color: var(--ink-3); }
.board-foot {
  margin-top: 10px;
  padding: 12px 0 16px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-3);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--line-2);
}
.fact { padding: 26px 30px 0 0; }
.fact + .fact { padding-left: 30px; border-left: 1px solid var(--line); }
.fact h3 { margin-bottom: 8px; }
.fact p { font-size: 13.5px; line-height: 1.55; color: var(--ink-2); max-width: 34ch; }

.quote-sec { padding: clamp(72px, 11vw, 152px) 0; }
.quote-block { max-width: 620px; margin-left: auto; }
.quote-block p {
  font-family: var(--quote);
  font-style: italic;
  font-weight: 300;
  font-size: clamp(26px, 3.2vw, 38px);
  line-height: 1.28;
  letter-spacing: -.012em;
}
.quote-block cite {
  display: block;
  margin-top: 24px;
  font-family: var(--sans);
  font-style: normal;
  font-size: 12.5px;
  color: var(--ink-3);
}

.foot { border-top: 1px solid var(--line); margin-top: auto; }
.foot-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 0 40px;
  font-size: 12.5px;
  color: var(--ink-3);
  flex-wrap: wrap;
}
.status { display: inline-flex; align-items: center; gap: 8px; }
.sdot { width: 6px; height: 6px; border-radius: 50%; background: var(--ink-3); flex: none; }
.sdot.ok { background: var(--pine); }
.sdot.bad { background: var(--danger); }

/* ---------- App shell ---------- */

/* Khung app cao đúng bằng viewport: sidebar và vùng nội dung cuộn ĐỘC LẬP.
   Trước đây .app chỉ min-height:100vh nên mọi thứ dồn thành một trang ~2000px
   và người dùng phải cuộn cả trang để thấy tiêu đề nhóm, tab rồi ô soạn thảo. */
.app { height: 100dvh; display: grid; grid-template-columns: var(--rail) minmax(0, 1fr); overflow: hidden; }

.rail {
  position: relative;
  align-self: stretch;
  overflow-y: auto;
  min-height: 100vh;
  width: auto;
  border-right: 1px solid var(--line);
  padding: 26px 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 0;
  z-index: 30;
  background: var(--paper);
}

.rail-brand { margin-bottom: 34px; padding-left: 2px; }
.rail-section { margin-bottom: 26px; }
.rail-groups {
  flex: none;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 22px;
}
.rail-scroll { overflow-y: auto; min-height: 0; max-height: min(46vh, 420px); scrollbar-width: none; }
.rail-scroll::-webkit-scrollbar { width: 0; height: 0; }
.rail-empty { padding: 6px 10px 2px; font-size: 12px; color: var(--ink-3); }
.rail-label {
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0;
  padding: 0 10px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.rail-group {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px 8px 18px;
  border-radius: 4px;
  color: var(--ink-2);
  font-size: 13.5px;
  letter-spacing: -.006em;
  transition: background-color .16s ease, color .16s ease;
}
.rail-group:hover { background: var(--sunk); color: var(--ink); }
.rail-group.active { background: var(--surface); color: var(--ink); font-weight: 500; }
.rail-group.active::before {
  content: '';
  position: absolute;
  left: 0; top: 8px; bottom: 8px;
  width: 2px;
  background: var(--pine);
  border-radius: 2px;
}
/* Chưa đọc = chữ đậm + pill mép trái, đúng cách Discord báo hiệu. */
.rail-group.unread { color: var(--ink); }
.rail-group.unread .name { font-weight: 600; }
.rail-pill {
  position: absolute;
  left: 5px;
  top: 50%;
  width: 4px;
  height: 8px;
  border-radius: 0 3px 3px 0;
  background: var(--pine);
  transform: translateY(-50%);
  transition: width .16s ease, height .16s ease;
}
.rail-group:hover .rail-pill { width: 14px; height: 10px; }
.rail-group .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-count { font-size: 11.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; flex: none; }
.rail-badge {
  flex: none;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--sunk);
  color: var(--ink-2);
  font-size: 10.5px;
  font-weight: 650;
  line-height: 18px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.rail-group:hover .rail-badge { background: var(--surface); }
/* Badge đỏ chỉ dành cho tin nhắc tên — như Discord, xám là unread thường. */
.rail-badge.mention { background: var(--danger); color: #f6efe9; }
.rail-badge.mention:hover { background: var(--danger); }
.rail-add {
  display: block;
  margin: 7px 0 0;
  padding: 6px 10px;
  font-size: 12.5px;
  color: var(--ink-3);
  transition: color .16s ease;
}
.rail-add:hover { color: var(--ink); }
.rail-nav { border-top: 1px solid var(--line); padding-top: 10px; display: grid; gap: 1px; flex: none; }
.rail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 4px;
  font-size: 13.5px;
  color: var(--ink-2);
  transition: background-color .16s ease, color .16s ease;
}
.rail-item > span { flex: 1; min-width: 0; }
.rail-item .icon { color: var(--ink-3); transition: color .16s ease; }
.rail-item:hover { background: var(--sunk); color: var(--ink); }
.rail-item:hover .icon { color: var(--ink-2); }
.rail-item.active { color: var(--ink); background: var(--surface); font-weight: 500; }
.rail-item.active .icon { color: var(--pine); }
.rail-foot { margin-top: auto; padding-top: 18px; border-top: 1px solid var(--line); }
.rail-user { display: flex; align-items: center; gap: 10px; }
.rail-user .avatar { width: 28px; height: 28px; }
.rail-user-name { font-size: 13px; letter-spacing: -.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-signout { margin-top: 10px; padding-left: 10px; font-size: 12px; color: var(--ink-3); }
.rail-signout:hover { color: var(--ink); }

.main { min-width: 0; height: 100%; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; }
.page {
  max-width: 1080px;
  /* Không tự căn giữa thì ở màn 1918px toàn bộ cột nội dung dính sát sidebar
     và để trống ~640px phía phải. */
  margin-inline: auto;
  padding: clamp(34px, 4.4vw, 68px) var(--pad) 140px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.mhead { display: none; }
.tabbar { display: none; }

/* ---------- Page header ---------- */

.phead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 34px;
}
.date { font-size: 12.5px; color: var(--ink-3); margin-bottom: 12px; font-variant-numeric: tabular-nums; }
.psub { margin-top: 12px; font-size: 14.5px; color: var(--ink-2); max-width: 52ch; }
.actions { display: flex; align-items: center; gap: 14px; }

.back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--ink-3);
  margin-bottom: 22px;
  transition: color .16s ease;
}
.back:hover { color: var(--ink); }

/* ---------- Ledger ---------- */

.ledger {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--line);
}
.stat { padding: 20px 0 22px; }
.stat + .stat { padding-left: 26px; border-left: 1px solid var(--line); }
.stat-num {
  font-size: 36px;
  line-height: 1;
  letter-spacing: -.04em;
  font-weight: 450;
  font-variant-numeric: tabular-nums;
}
.stat-label { margin-top: 10px; font-size: 12.5px; color: var(--ink-3); letter-spacing: -.002em; }

.shead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  margin: 54px 0 6px;
}
.shead .h2 { font-weight: 500; }
.shead.tight { margin-top: 12px; }

/* ---------- Group rows ---------- */

.grow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168px 64px;
  gap: 22px;
  align-items: center;
  width: 100%;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
  transition: opacity .16s ease;
}
.grow:hover { opacity: .82; }
.grow-name { display: block; font-size: 16px; letter-spacing: -.018em; font-weight: 500; }
.grow-meta { display: block; margin-top: 4px; font-size: 12px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.grow-prog { height: 1px; background: var(--line); position: relative; }
.grow-prog i { position: absolute; inset: 0 auto 0 0; background: var(--pine); }
.grow-pct { font-size: 12px; color: var(--ink-3); text-align: right; font-variant-numeric: tabular-nums; }

/* ---------- Tabs ---------- */

.tabs { display: flex; gap: 28px; border-bottom: 1px solid var(--line); position: relative; margin-bottom: 2px; }
.tab {
  padding: 12px 0 13px;
  font-size: 14px;
  color: var(--ink-3);
  letter-spacing: -.008em;
  transition: color .18s ease;
}
.tab:hover { color: var(--ink-2); }
.tab[aria-selected='true'] { color: var(--ink); }
.tab-ink { position: absolute; bottom: -1px; left: 0; height: 1px; background: var(--ink); width: 0; }
.tab-count { font-size: 11.5px; color: var(--ink-3); margin-left: 6px; font-variant-numeric: tabular-nums; }

/* ---------- Task list ---------- */

.filters { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 0 6px; }
.filter-set { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.filter {
  font-size: 13px;
  color: var(--ink-3);
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
  transition: color .16s ease, border-color .16s ease;
}
.filter:hover { color: var(--ink-2); }
.filter[aria-pressed='true'] { color: var(--ink); border-bottom-color: var(--ink); }

.composer { overflow: hidden; }
.composer-row { display: flex; align-items: center; gap: 12px; padding: 14px 0 16px; border-bottom: 1px solid var(--line); }
.composer input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 4px 0;
  font-size: 15.5px;
  letter-spacing: -.01em;
  color: var(--ink);
}
.composer input::placeholder { color: var(--ink-3); }
.composer input:focus { outline: none; }
.composer-row:focus-within { border-bottom-color: var(--ink); }
.task-assignee-picker { margin: 0; padding: 12px 0 16px; border: 0; border-bottom: 1px solid var(--line); }
.task-assignee-picker legend { margin-bottom: 8px; color: var(--ink-3); font-size: 11px; }
.task-assignee-picker > div { display: flex; flex-wrap: wrap; gap: 7px; }
.task-assignee-picker label { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px 6px 7px; border: 1px solid var(--line); border-radius: 999px; color: var(--ink-2); font-size: 11.5px; cursor: pointer; }
.task-assignee-picker label.selected { border-color: #8aa697; background: var(--wash); color: var(--pine); }
.task-assignee-picker input { position: absolute; opacity: 0; pointer-events: none; }

.groupform { overflow: hidden; padding: 18px 0 20px; border-bottom: 1px solid var(--line); }
.groupform-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }

.task {
  position: relative;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 15px 0 16px;
  border-bottom: 1px solid var(--line);
}
.task-mark {
  width: 26px;
  height: 26px;
  margin-left: -3px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  align-self: start;
  margin-top: -2px;
  transition: background-color .16s ease;
}
.task-mark:hover { background: var(--sunk); }
.task-body { min-width: 0; padding-top: 1px; }
.task-title {
  position: relative;
  display: inline-block;
  font-size: 15.5px;
  line-height: 1.45;
  letter-spacing: -.012em;
  color: var(--ink);
  transition: color .28s ease;
  max-width: 100%;
  padding: 0 2px;
  margin-left: -2px;
}
.task-title .hl,
.brow-title .hl {
  position: absolute;
  left: 0; right: 0; top: 12%;
  bottom: 8%;
  background: rgba(22, 72, 59, .14);
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: left center;
  z-index: 0;
  will-change: transform;
}
.task-title .tt { position: relative; z-index: 1; }
.marked { position: relative; display: inline-block; max-width: 100%; }
.task.is-done .hl, .brow.done .hl { transform: scaleX(1); }
.task.is-done .task-title { color: var(--ink-3); }
.task-meta { margin-top: 6px; display: flex; align-items: center; gap: 12px; font-size: 11.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.task-assign { position: relative; width: fit-content; margin-top: 7px; }
.task-assign summary { color: var(--pine); font-size: 11px; cursor: pointer; list-style: none; }
.task-assign summary::-webkit-details-marker { display: none; }
.task-assign-menu { position: absolute; left: 0; top: calc(100% + 7px); z-index: 20; display: grid; gap: 5px; width: 230px; padding: 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); box-shadow: 0 14px 35px rgba(21,23,26,.14); }
.task-assign-menu label { display: flex; align-items: center; gap: 8px; padding: 5px; border-radius: 7px; color: var(--ink-2); font-size: 12px; cursor: pointer; }
.task-assign-menu label:hover { background: var(--sunk); }
.task-assign-menu .btn { margin-top: 4px; }

/* Nút đổi tên / xoá việc: hiện khi rê chuột, giống hàng nút tin nhắn chat. */
.task-tools { position: absolute; top: 10px; right: 12px; display: flex; gap: 4px; opacity: 0; transition: opacity .16s ease; }
.task:hover .task-tools, .task:focus-within .task-tools { opacity: 1; }
.task-tool { display: grid; place-items: center; min-width: 26px; height: 24px; padding: 0 6px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--ink-3); font-size: 10.5px; }
.task-tool:hover { color: var(--pine); border-color: var(--line); background: rgba(255,255,255,.8); }
.task-tool.danger:hover, .task-tool.danger.confirm { color: var(--danger); border-color: rgba(142,50,35,.4); }
@media (hover: none), (pointer: coarse) { .task-tools { opacity: 1; position: static; justify-content: flex-start; margin-top: 8px; } }
.task-rename { margin-top: 1px; }
.task-rename input { width: 100%; max-width: 520px; padding: 5px 9px; border: 1px solid var(--pine); border-radius: 8px; background: var(--surface); color: var(--ink); font: inherit; font-size: 14.5px; outline: 0; }

.task-comments { margin-top: 8px; }
.task-comments summary { color: var(--ink-3); font-size: 11px; cursor: pointer; list-style: none; }
.task-comments summary:hover { color: var(--pine); }
.task-comments summary::-webkit-details-marker { display: none; }
.task-comment-list { display: grid; gap: 8px; margin-top: 9px; padding: 10px 11px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,.5); }
.task-comment-empty { margin: 0; color: var(--ink-3); font-size: 11.5px; }
.task-comment { display: grid; gap: 2px; }
.task-comment-head { display: flex; align-items: baseline; gap: 8px; font-size: 11px; color: var(--ink-3); }
.task-comment-head strong { color: var(--ink-2); font-weight: 600; }
.task-comment.me .task-comment-head strong { color: var(--pine); }
.task-comment-body { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ink-2); white-space: pre-wrap; overflow-wrap: anywhere; }
.task-comment-form { display: flex; gap: 8px; margin-top: 2px; }
.task-comment-form input { flex: 1; min-width: 0; padding: 8px 11px; border: 1px solid var(--line-2); border-radius: 9px; background: var(--surface); color: var(--ink); font: inherit; font-size: 13px; outline: 0; }
.task-comment-form input:focus { border-color: #8aa697; }

/* Chủ nhóm chỉ xoá được cả nhóm ở một chỗ duy nhất, và nút phải "tắt" cho tới
   khi được bấm lần hai — đây là thao tác không hoàn tác. */
.danger-zone { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 18px; padding: 13px 14px; border: 1px solid var(--line); border-radius: 13px; }
.danger-title { font-size: 12.5px; font-weight: 600; color: var(--ink); }
.danger-hint { margin: 3px 0 0; font-size: 11.5px; line-height: 1.45; color: var(--ink-3); }
.btn-danger-quiet { border: 1px solid var(--line-2); background: transparent; color: var(--ink-3); white-space: nowrap; }
.btn-danger-quiet:hover { border-color: rgba(142,50,35,.45); color: var(--danger); background: rgba(142,50,35,.05); }
.btn-danger { border: 1px solid var(--danger); background: var(--danger); color: #f6efe9; white-space: nowrap; }

/* ---------- Chat ---------- */
/* Khung chat chiếm hết chiều cao còn lại: danh sách tin là vùng cuộn riêng,
   ô soạn thảo nằm chết ở đáy thay vì trôi theo trang. */
/* Khi tab chat đang mở, .main KHÔNG được cuộn nữa — nếu nó cuộn thì mọi flex:1
   bên trong nhận chiều cao theo nội dung thay vì theo viewport, và ô soạn thảo
   tràn ra ngoài màn hình. .chat trở thành vùng cuộn duy nhất.
   Chrome của trang chat cũng phải thắt lại: padding + header + tab + livebar +
   composer từng ngốn 429/459px, khiến danh sách tin chỉ còn 30px. */
.main:has(#panel-chat) { overflow: hidden; }
.page:has(#panel-chat) { padding-top: 10px; padding-bottom: 0; overflow: hidden; }
.page:has(#panel-chat) .back { margin-bottom: 10px; }
.page:has(#panel-chat) .phead { margin-bottom: 14px; }
.page:has(#panel-chat) .tabs { margin-bottom: 10px; }
#panel-chat { position: relative; isolation: isolate; flex: 1; min-height: 0; display: flex; flex-direction: column; }
.chat-livebar { flex: none; position: relative; z-index: 12; display: flex; align-items: center; gap: 9px; min-height: 46px; margin: 0 0 8px; padding: 0 14px; color: var(--ink-2); font-size: 11px; background: rgba(247,248,243,.94); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 5px 18px rgba(21,23,26,.035); backdrop-filter: blur(12px); }
.chat-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #d4a044; box-shadow: 0 0 0 3px rgba(212,160,68,.12); }
.chat-live-dot.connected { background: #3b9b73; box-shadow: 0 0 0 3px rgba(59,155,115,.12); }
.chat-live-dot.reconnecting { background: #d4a044; }
.chat-live-count { margin-left: auto; padding: 5px 9px; border-radius: 999px; background: var(--wash); color: var(--pine); font-size: 10px; font-weight: 550; }
.chat-typing { min-height: 18px; margin: 0 0 3px; color: var(--ink-3); font-size: 11.5px; font-style: italic; }
.chat:has(.msg) { padding: 10px 2px 22px; overflow-anchor: none; }
/* Không đặt min-height ở đây: .chat là flex con phải co đúng phần còn lại của
   panel, min-height sẽ cưỡng nó cao hơn chỗ được chia và đẩy composer ra ngoài
   màn hình. */
.chat { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.chat-unit { display: grid; }
.chat-day { display: flex; align-items: center; gap: 12px; margin: 22px 0 12px; color: var(--ink-3); font-size: 10.5px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; }
.chat-day::before, .chat-day::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.chat-day span { padding: 3px 11px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,.72); }
.chat-older { display: grid; justify-content: center; margin: 0 0 12px; }
.msg {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0 0 12px;
}
.msg.me { flex-direction: row-reverse; }
.msg:has(.message-reaction-menu) { z-index: 20; }
.msg .avatar { flex: none; width: 30px; height: 30px; margin-top: 2px; border-radius: 50%; }
.msg-content { display: flex; flex-direction: column; min-width: 0; max-width: min(660px, 82%); }
.msg.me .msg-content { align-items: flex-end; }
.msg-head { display: flex; align-items: baseline; gap: 8px; margin: 0 4px 4px; }
.msg.me .msg-head { flex-direction: row-reverse; }
.msg-name { font-size: 12px; font-weight: 600; letter-spacing: -.01em; color: var(--ink-2); }
.msg-time { font-size: 10.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.msg-bubble {
  min-width: 0;
  max-width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.msg.me .msg-bubble { border-color: #c7ddd0; background: var(--wash); }
.msg-bubble.media-only { padding: 4px; }
.msg-body { margin: 0; font-size: 14.5px; line-height: 1.56; color: var(--ink-2); white-space: pre-wrap; overflow-wrap: anywhere; }
.msg.me .msg-body { color: var(--ink); }
.msg.me .msg-name::after { content: ' · bạn'; color: var(--ink-3); font-weight: 400; }
.msg[data-continuation="true"] { margin-bottom: 4px; }
.msg-gutter { position: relative; flex: none; width: 30px; display: grid; place-items: center; padding-top: 10px; }
.msg-gutter::before { content: ''; position: absolute; top: -9px; bottom: -13px; left: 50%; width: 1px; background: rgba(206,211,201,.9); }
.msg-hover-time { color: var(--ink-3); font-size: 9px; font-variant-numeric: tabular-nums; opacity: 0; transition: opacity .16s ease; }
@media (hover: hover) and (pointer: fine) {
  .msg[data-continuation="true"]:hover .msg-hover-time,
  .msg[data-continuation="true"]:focus-within .msg-hover-time { opacity: 1; }
  /* Pill chỉ được hiện nền cùng lúc với các nút; nếu không nó là một khối trắng
     rỗng đè lên bubble khi chưa trỏ chuột. */
  .msg-head-quiet { position: absolute; top: -11px; z-index: 15; display: flex; padding: 2px; border: 1px solid transparent; border-radius: 9px; background: transparent; opacity: 0; transition: opacity .14s ease; }
  .msg:hover .msg-head-quiet, .msg:focus-within .msg-head-quiet { opacity: 1; border-color: var(--line); background: var(--surface); box-shadow: 0 4px 14px rgba(21,23,26,.1); }
  .msg:not(.me) .msg-head-quiet { left: 42px; }
  .msg.me .msg-head-quiet { right: 42px; }
}
@media (hover: none), (pointer: coarse) {
  .msg-head-quiet { margin: 0 4px 3px; }
  .msg.me .msg-head-quiet { flex-direction: row-reverse; }
  .msg-hover-time { opacity: 1; }
}
@media (hover: none), (pointer: coarse) {
  .msg-head-quiet { justify-content: flex-end; margin-bottom: -6px; }
  .msg-hover-time { opacity: 1; }
}
.msg-actions { display: flex; align-items: center; gap: 3px; margin-left: auto; }
.msg.me .msg-actions { margin-left: 0; margin-right: auto; }
.msg-actions:has(.message-reaction-menu) { opacity: 1; }
/* Chuột mới ẩn thao tác; màn cảm ứng không có hover thì phải bấm được luôn. */
@media (hover: hover) and (pointer: fine) {
  .msg-actions { opacity: 0; transition: opacity .16s ease; }
  .msg:hover .msg-actions, .msg:focus-within .msg-actions { opacity: 1; }
}
.msg-action { display: grid; place-items: center; width: 27px; height: 25px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--ink-3); }
.msg-action:hover { color: var(--pine); border-color: var(--line); background: rgba(255,255,255,.8); }
.msg-action.danger:hover, .msg-action.danger.confirm { width: auto; min-width: 27px; padding-inline: 7px; color: var(--danger); border-color: rgba(142,50,35,.45); }
.msg-action.danger:hover { background: rgba(142,50,35,.06); }
.reaction-anchor { position: relative; }
.message-reaction-menu { position: absolute; right: 0; bottom: calc(100% + 7px); z-index: 24; display: flex; gap: 2px; padding: 7px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); box-shadow: 0 12px 30px rgba(21,23,26,.15); }
.message-reaction-menu button { width: 30px; height: 30px; border-radius: 7px; font-size: 17px; }
.message-reaction-menu button:hover { background: var(--sunk); }
.msg-reactions { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 4px 0; }
.msg-reaction { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,.62); font-size: 12px; }
.msg-reaction span { color: var(--ink-3); font-size: 10px; font-variant-numeric: tabular-nums; }
.msg-reaction.active { border-color: #8aa697; background: var(--wash); }
/* Mẩu trích dẫn nằm TRONG bubble, ngăn với nội dung bằng một thanh accent dọc
   đúng kiểu Telegram/Messenger — không có đường nối nào giữa hai khối. */
.msg-reply-quote { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; margin: 0 0 7px; padding: 1px 0 1px 9px; border-left: 2px solid #8aa697; font-size: 12px; line-height: 1.35; color: var(--ink-3); }
.msg-reply-quote .avatar { border-radius: 50%; }
.msg-reply-quote > span { min-width: 0; }
.msg-reply-quote strong { display: block; color: var(--ink-2); font-weight: 600; }
.reply-preview { display: block; max-width: 42ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.reply-preview { display: block; max-width: 52ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-mention { color: #315fbc; background: rgba(71,111,211,.1); border-radius: 3px; padding: 0 2px; font-weight: 550; }
.chat-image-link { display: block; margin-top: 7px; max-width: min(420px, 100%); }
.msg-bubble.media-only .chat-image-link { margin-top: 0; }
.msg-bubble.media-only .chat-image { border: 0; border-radius: 12px; }
.chat-image { display: block; max-width: 100%; max-height: 420px; object-fit: contain; border: 1px solid var(--line); border-radius: 5px; }
.chat-image-loading, .chat-image-error { display: inline-block; margin-top: 8px; font-size: 12px; color: var(--ink-3); }
.message-edit { display: grid; gap: 7px; margin: 0; }
.message-edit textarea { width: 100%; min-height: 76px; padding: 9px 11px; resize: vertical; border: 1px solid var(--line-2); border-radius: 10px; background: rgba(255,255,255,.72); color: var(--ink); font: inherit; }
.message-edit > div { display: flex; justify-content: flex-end; gap: 8px; }
.message-read { margin: 5px 4px 0; color: var(--ink-3); font-size: 10px; }

.chat-form {
  flex: none;
  position: relative;
  z-index: 15;
  display: block;
  padding: 7px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(21,23,26,.07), 0 1px 3px rgba(21,23,26,.03);
  margin: 6px 0 10px;
}
/* Một hàng duy nhất, như Telegram/Slack: công cụ trái — ô nhập giữa — gửi phải.
   Hàng hint riêng từng chiếm thêm ~26px và đẩy emoji/quà xuống dòng dưới,
   tạo khoảng chết giữa thẻ. Phím tắt giờ nằm trong title/aria-keyshortcuts. */
.chat-compose-row { display: flex; align-items: center; gap: 6px; }
.chat-tools { display: flex; align-items: center; gap: 2px; flex: none; }
.chat-text-wrap { position: relative; min-width: 0; flex: 1; }
/* Chiều cao ô nhập là CỐ ĐỊNH, text dài thì cuộn bên trong. Nếu cho nó tự giãn
   thì nó là flex sibling nên sẽ hút chiều cao của .chat: gõ 4 dòng từng làm danh
   sách tin co từ 90px xuống 43px và cả khung chat bị đẩy lên 47px. */
.chat-textarea { display: block; width: 100%; height: 38px; min-height: 38px; max-height: 38px; overflow-y: auto; resize: none; border: 0; outline: 0; padding: 8px 10px; background: transparent; color: var(--ink); font: inherit; font-size: 14px; line-height: 1.45; }
.chat-textarea::placeholder { color: var(--ink-3); }
.chat-tool, .chat-send { display: grid; place-items: center; flex: none; width: 36px; height: 36px; border-radius: 11px; color: var(--ink-2); transition: background .15s ease, color .15s ease, transform .15s ease; }
.chat-tool:hover { background: var(--wash); color: var(--pine); }
.chat-tool:disabled { opacity: .45; }
.chat-send { background: var(--pine); color: #f4f6f1; box-shadow: 0 4px 10px rgba(22,72,59,.18); }
.chat-send:hover:not(:disabled) { background: var(--pine-deep); transform: translateY(-1px); }
.chat-send:disabled { opacity: .42; }
.send-dots { font-size: 20px; line-height: 1; color: #f4f6f1; }
.icon { display: block; flex: none; }
.chat-popover-anchor { position: relative; }
.emoji-menu, .gift-menu, .mention-menu { position: absolute; z-index: 35; bottom: calc(100% + 8px); padding: 8px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); box-shadow: 0 12px 35px rgba(21,23,26,.15); }
/* Cụm công cụ đã chuyển sang mép trái của thẻ, nên menu phải mở sang phải.
   Neo right:0 như cũ sẽ khiến anchor bên trái đẩy menu tràn khỏi màn hình
   (đo được x = -95px trên viewport 683px). */
.chat-tools .emoji-menu, .chat-tools .gift-menu { left: 0; right: auto; }
.emoji-menu { right: 0; display: grid; grid-template-columns: repeat(6, 36px); gap: 3px; padding: 9px; border-radius: 14px; }
.emoji-menu button { height: 34px; border-radius: 7px; font-size: 20px; }
.emoji-menu button:hover, .gift-menu button:hover, .mention-option:hover { background: var(--sunk); }
.gift-menu { right: 0; display: grid; gap: 3px; width: 240px; border-radius: 14px; }
.gift-menu button { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; text-align: left; font-size: 12px; }
.gift-menu button span { font-size: 20px; }
.mention-menu { left: 0; display: grid; gap: 2px; width: min(300px, 100%); }
.mention-option { display: flex; align-items: center; gap: 9px; padding: 7px; border-radius: 8px; text-align: left; }
.mention-option:hover, .mention-option[aria-selected='true'] { background: var(--wash); }
.mention-option[aria-selected='true'] { color: var(--pine); box-shadow: inset 0 0 0 1px #a8bcae; }
.mention-option span { display: grid; font-size: 12px; }
.mention-option small { color: var(--ink-3); font-size: 10px; }
.chat-compose-context, .chat-image-preview { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 8px; padding: 9px 11px; color: var(--ink-2); font-size: 12px; background: rgba(230,232,225,.7); border-left: 3px solid var(--pine); border-radius: 0 9px 9px 0; overflow-wrap: anywhere; }
.replying-label { display: grid; min-width: 0; }
.replying-preview { max-width: 60ch; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.context-close { display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 7px; color: var(--ink-3); }
.context-close:hover { background: var(--sunk); color: var(--ink); }
.chat-image-preview img { width: 54px; height: 54px; object-fit: cover; border-radius: 7px; }
.chat-image-preview > span { display: grid; flex: 1; font-size: 11px; }
.chat-image-preview small { color: var(--ink-3); }

/* ---------- Members / friends / notifications ---------- */

.member {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 13px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}
.member .avatar { width: 34px; height: 34px; }
.member-role { font-size: 11.5px; color: var(--ink-3); }
.member-name { font-size: 14.5px; letter-spacing: -.01em; }
.member-sub { margin-top: 2px; font-size: 12px; color: var(--ink-3); overflow-wrap: anywhere; }
.friend-invite-list { display: grid; gap: 7px; margin: 12px 0 18px; }
.friend-invite { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: 11px; padding: 10px 11px; border: 1px solid var(--line); border-radius: 11px; background: rgba(255,255,255,.32); }
.friend-invite > span { display: grid; min-width: 0; font-size: 13px; }
.friend-invite small { overflow: hidden; color: var(--ink-3); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.invite-search-divider { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; color: var(--ink-3); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
.invite-search-divider::before, .invite-search-divider::after { content: ''; height: 1px; flex: 1; background: var(--line); }

.notif {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  width: 100%;
  text-align: left;
}
.notif .dot { width: 5px; height: 5px; border-radius: 50%; background: transparent; margin-top: 8px; }
.notif.unread .dot { background: var(--pine); }
.notif.unread .notif-title { font-weight: 550; }
.notif-title { display: block; font-size: 14px; letter-spacing: -.012em; }
.notif-body { display: block; margin-top: 4px; font-size: 13px; line-height: 1.55; color: var(--ink-2); max-width: 66ch; }
.notif-time { font-size: 11.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; white-space: nowrap; padding-top: 2px; }
.notif:hover .notif-title { text-decoration: underline; text-underline-offset: 3px; }

.search-row { display: flex; gap: 10px; margin: 18px 0 4px; }
.search-row .field { flex: 1; }
.search-result { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--line); }

.rowacts { display: flex; align-items: center; gap: 16px; flex: none; }

.findform { padding: 16px 0 18px; border-bottom: 1px solid var(--line); }
.findform-row { display: flex; gap: 10px; max-width: 560px; }
.findform-row .field { flex: 1; }
.findform-error { color: var(--danger); margin-top: 8px; }
.findform-results { margin-top: 10px; }
.result-person { display: flex; align-items: center; gap: 12px; min-width: 0; }
.result-text { min-width: 0; }

.invite {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.invite-title { font-size: 15px; letter-spacing: -.015em; font-weight: 500; }
.invite-meta { margin-top: 4px; font-size: 12px; color: var(--ink-3); }

/* ---------- Profile ---------- */

.profile-grid { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 48px; align-items: start; }
.profile-side .avatar { width: 64px; height: 64px; font-size: 20px; }
.profile-name { margin-top: 14px; font-size: 18px; letter-spacing: -.02em; }
.profile-email { margin-top: 4px; font-size: 13px; color: var(--ink-2); overflow-wrap: anywhere; }
.profile-since { margin-top: 6px; font-size: 12px; color: var(--ink-3); }
.profile-main { min-width: 0; }
.profile-note { max-width: 54ch; margin-bottom: 16px; }
.form { display: grid; gap: 18px; max-width: 460px; }
.form-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.kv { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 14px; padding: 11px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
.kv-k { color: var(--ink-3); }
.kv-v { overflow-wrap: anywhere; }

/* ---------- States ---------- */

.boot {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
}
.boot .brand .word { font-size: 19px; }

.empty {
  padding: 56px 0 48px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.empty-title { font-size: 16px; letter-spacing: -.015em; }
.empty p { font-size: 13.5px; color: var(--ink-2); max-width: 44ch; }
.empty .btn { margin-top: 10px; }

.sk { background: var(--sunk); border-radius: 3px; animation: skpulse 1.6s ease-in-out infinite; }
@keyframes skpulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
.sk-row { display: grid; grid-template-columns: 26px 1fr 60px; gap: 14px; align-items: center; padding: 17px 0; border-bottom: 1px solid var(--line); }

/* ---------- Sheet ---------- */

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(21, 23, 26, .26);
}
.sheet {
  position: fixed;
  inset: 0 0 0 auto;
  z-index: 80;
  width: min(520px, 100%);
  background: var(--paper);
  border-left: 1px solid var(--line-2);
  padding: 34px clamp(22px, 3.4vw, 44px) 40px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
.sheet-close { font-size: 12.5px; color: var(--ink-3); border-bottom: 1px solid transparent; padding-bottom: 2px; }
.sheet-close:hover { color: var(--ink); border-color: var(--line-2); }
.sheet-body { display: grid; gap: 16px; }
.sheet-title { font-size: 27px; line-height: 1.1; letter-spacing: -.035em; font-weight: 500; }
.sheet-sub { font-size: 13.5px; color: var(--ink-2); margin-top: 8px; max-width: 40ch; line-height: 1.55; }
.sheet-alt { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--line); font-size: 13px; color: var(--ink-2); display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.sheet-foot { margin-top: 32px; font-size: 11.5px; color: var(--ink-3); line-height: 1.5; overflow-wrap: anywhere; }
.auth-provider-separator { display: flex; align-items: center; gap: 12px; color: var(--ink-3); font-size: 11px; }
.auth-provider-separator::before, .auth-provider-separator::after { content: ''; height: 1px; flex: 1; background: var(--line); }
.auth-provider-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.auth-provider { display: flex; align-items: center; justify-content: center; gap: 9px; min-height: 42px; border: 1px solid var(--line-2); border-radius: 7px; color: var(--ink-2); font-size: 13px; transition: background .16s ease, border-color .16s ease; }
.auth-provider:hover:not(:disabled) { background: var(--surface); border-color: var(--ink-2); }
.auth-provider:disabled { opacity: .48; cursor: not-allowed; }
.google-mark, .facebook-mark { display: grid; place-items: center; width: 19px; height: 19px; border-radius: 50%; background: white; font: 700 14px Arial, sans-serif; }
.google-mark { color: #4285f4; }
.facebook-mark { color: white; background: #1877f2; font-size: 17px; }
.oauth-note { margin: -5px 0 0; color: var(--ink-3); font-size: 11px; line-height: 1.45; }

/* ---------- Trung tâm thông báo ---------- */
.rail-brand { margin-bottom: 34px; padding-left: 2px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.mhead-actions { display: flex; align-items: center; gap: 10px; min-width: 0; }
.notif-center { position: relative; }
.notif-bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: transparent;
  color: var(--ink-2);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.notif-bell:hover, .notif-bell.open { color: var(--pine); border-color: #a8bcae; background: var(--wash); }
.notif-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--pine);
  color: #f4f6f1;
  font-size: 9.5px;
  font-weight: 650;
  line-height: 16px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.notif-panel {
  position: fixed;
  z-index: 90;
  display: grid;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--line-2);
  border-radius: 15px;
  background: var(--surface);
  box-shadow: 0 22px 54px rgba(21,23,26,.18), 0 2px 8px rgba(21,23,26,.06);
  overflow: hidden;
}
/* top/left/width/max-height do NotificationCenter tính và đặt inline: panel
   render ở <body> nên không còn neo theo .rail hay .mhead nữa. */
.notif-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 9px 9px; }
.notif-panel-title { font-size: 13px; font-weight: 600; letter-spacing: -.01em; color: var(--ink); }
.notif-markall { font-size: 11px; color: var(--pine); text-decoration: underline; text-underline-offset: 2px; }
.notif-error { margin: 0; padding: 8px 9px; border-radius: 9px; background: rgba(142,50,35,.08); color: var(--danger); font-size: 11.5px; }
.notif-section { padding: 2px 0 6px; border-bottom: 1px solid var(--line); }
.notif-section-label { margin: 4px 9px 6px; color: var(--ink-3); font-size: 9.5px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
.notif-invite { display: grid; gap: 8px; padding: 8px 9px; border-radius: 11px; }
.notif-invite:hover { background: var(--sunk); }
.notif-invite-main { display: grid; gap: 2px; min-width: 0; }
.notif-invite-name { color: var(--ink); font-size: 13px; font-weight: 550; }
.notif-invite-meta { color: var(--ink-3); font-size: 11px; }
.notif-invite-actions { display: flex; gap: 7px; }
.notif-list { max-height: 320px; overflow-y: auto; overscroll-behavior: contain; padding: 2px 0; }
.notif-empty { margin: 0; padding: 22px 12px; color: var(--ink-3); font-size: 12px; text-align: center; }
.notif-row {
  display: grid;
  grid-template-columns: 6px minmax(0, 1fr) auto;
  align-items: start;
  gap: 9px;
  width: 100%;
  padding: 9px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  text-align: left;
}
.notif-row:hover { background: var(--sunk); }
.notif-dot { width: 6px; height: 6px; margin-top: 5px; border-radius: 50%; background: transparent; }
.notif-row.unread .notif-dot { background: var(--pine); }
.notif-row-body { display: grid; gap: 2px; min-width: 0; }
.notif-row-title { color: var(--ink-2); font-size: 12px; font-weight: 550; }
.notif-row.unread .notif-row-title { color: var(--ink); }
.notif-row-text { color: var(--ink-3); font-size: 11.5px; line-height: 1.45; overflow-wrap: anywhere; }
.notif-row-time { color: var(--ink-3); font-size: 10px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.notif-panel-foot { display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; padding: 10px; border-top: 1px solid var(--line); color: var(--pine); font-size: 11.5px; font-weight: 550; }
.notif-panel-foot:hover { background: var(--wash); }

/* ---------- Toast ---------- */

.toast-wrap {
  /* Trước đây giữa đáy màn — đúng chỗ ô soạn thảo chat ngồi, nên mọi toast
     đều che mất input. Đổi sang góc phải dưới, cao hơn tab bar. */
  position: fixed;
  right: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  z-index: 120;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
  width: min(420px, calc(100vw - 32px));
}
@media (max-width: 980px) {
  .toast-wrap { bottom: calc(74px + env(safe-area-inset-bottom, 0px)); right: 14px; }
}
.toast {
  background: var(--ink);
  color: #f3f4ef;
  font-size: 13px;
  line-height: 1.45;
  padding: 10px 15px;
  border-radius: 5px;
  max-width: 100%;
  box-shadow: 0 10px 30px -12px rgba(21, 23, 26, .5);
  animation: toast-in .3s cubic-bezier(.22, 1, .36, 1) both;
}
.toast.bad { background: var(--danger); }
.toast.out { animation: toast-out .32s ease-in both; }
@keyframes toast-in {
  from { opacity: 0; transform: translateY(10px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-4px); }
}

/* ---------- Responsive ---------- */

@media (max-width: 1120px) {
  .hero { grid-template-columns: minmax(0, 1fr) minmax(0, .95fr); gap: 48px; }
  .grow { grid-template-columns: minmax(0, 1fr) 120px 56px; gap: 16px; }
}

@media (max-width: 980px) {
  /* Ba hàng thật: đầu, nội dung cuộn, điều hướng đáy. Thanh dưới không còn là
     overlay nên ô soạn thảo không phải trừ 60px để né nó nữa. */
  .app { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; }
  .rail { display: none; }
  .main { margin-left: 0; }
  .page { padding-bottom: 28px; }

  .mhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    position: static;
    z-index: 35;
    height: 56px;
    padding-inline: var(--pad);
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }
  .mhead .brand .word { font-size: 15.5px; }
  .mhead-user {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 62%;
  }
  .mhead-help {
    width: 30px;
    height: 30px;
    border: 1px solid var(--line-2);
    border-radius: 50%;
    color: var(--ink-2);
    font: 600 14px/1 Onest, sans-serif;
  }
  .mhead-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tabbar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    position: static;
    z-index: 40;
    background: var(--paper);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .tabbar button {
    padding: 13px 0 14px;
    font-size: 12px;
    color: var(--ink-3);
    text-align: center;
    letter-spacing: -.004em;
  }
  .tabbar button[aria-current='true'] { color: var(--ink); }
  .tabbar .tcount { font-variant-numeric: tabular-nums; }

  .hero { grid-template-columns: minmax(0, 1fr); gap: 46px; padding-top: 40px; padding-bottom: 64px; }
  .hero-art { max-width: 480px; }
  .facts { grid-template-columns: minmax(0, 1fr); }
  .fact { padding: 22px 0; }
  .fact + .fact { padding-left: 0; border-left: 0; border-top: 1px solid var(--line); }
  .quote-block { margin-left: 0; }
  .quote-sec { padding: 76px 0 88px; }
  .profile-grid { grid-template-columns: minmax(0, 1fr); gap: 28px; }
  .ledger { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .stat + .stat { padding-left: 16px; }
}

@media (max-width: 640px) {
  body { font-size: 15px; }
  .display { font-size: clamp(40px, 12.4vw, 58px); letter-spacing: -.045em; }
  .topbar-in { height: 60px; }
  .topbar-actions { gap: 16px; }
  .topbar-actions .btn { height: 36px; padding: 0 13px; font-size: 13px; }
  .hero-cta { gap: 20px; margin-top: 30px; }
  .lede { font-size: 15.5px; margin-top: 24px; }
  .stat-num { font-size: 28px; }
  .stat-label { font-size: 11.5px; }
  .grow { grid-template-columns: minmax(0, 1fr) 44px; padding: 15px 0; }
  .grow-prog { display: none; }
  .filters { flex-direction: column; align-items: flex-start; gap: 10px; }
  .filter-set { gap: 16px; }
  .shead { margin-top: 40px; }
  .phead { margin-bottom: 26px; }
  .psub { font-size: 13.5px; }
  .chat-livebar { min-height: 42px; padding-inline: 11px; }
  .chat-live-count { max-width: 46%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chat:has(.msg) { padding: 4px 0 14px; }
  .msg { gap: 7px; margin-bottom: 10px; }
  .msg .avatar { width: 28px; height: 28px; }
  .msg-gutter { width: 28px; }
  .msg-content { max-width: 86%; }
  .msg-bubble { padding: 7px 10px; }
  .msg-body { font-size: 14px; }
  .msg-head { gap: 6px; margin: 0 3px 3px; }
  .msg-actions { gap: 2px; }
  .msg-action { width: 26px; height: 24px; }
  .chat-form { padding: 6px; border-radius: 15px; }
  .chat-tool { width: 34px; height: 34px; }
  .chat-send { width: 36px; height: 36px; }
  .emoji-menu { grid-template-columns: repeat(6, minmax(31px, 1fr)); width: min(252px, calc(100vw - 36px)); }
  .gift-menu { width: min(240px, calc(100vw - 36px)); }
  .chat-image { max-height: 300px; }
  .sheet { padding-top: 26px; }
  .member { grid-template-columns: 34px minmax(0, 1fr); }
  .member > .rowacts, .member > .member-role { grid-column: 2; }
  .invite { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .invite .rowacts { justify-content: flex-start; }
  .groupform-grid { grid-template-columns: minmax(0, 1fr); }
  .form-split { grid-template-columns: minmax(0, 1fr); }
  .findform-row { flex-direction: column; align-items: stretch; }
  .findform-row .btn { width: 100%; }
  .board-wrap::before { inset: 8px -8px -8px 8px; }
  .foot-in { flex-direction: column; align-items: flex-start; gap: 12px; }
  .kv { grid-template-columns: minmax(0, 1fr); gap: 3px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
  .sk { animation: none; opacity: .7; }
}
`;
