/**
 * StudySync Web — Architectural Design System (OS 2.4).
 *
 * Aesthetic: "$5B Obsidian & Titanium Workspace" (Linear / Raycast / Vercel / Mercury).
 * Precision 1px hairlines, subtle top-edge specular highlights, tabular JetBrains Mono
 * telemetry, and zero visual bloat. Supports both Obsidian Dark (default) and Alabaster Light.
 */
export const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@1,6..72,300..500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';

export const CSS = `
:root,
[data-theme="dark"] {
  --paper: #08090c;
  --surface: #0e1015;
  --surface-2: #14171f;
  --sunk: #050608;
  --glass: rgba(14, 16, 21, 0.82);
  --ink: #f3f5f8;
  --ink-2: #9ba3b0;
  --ink-3: #5f6775;
  --line: rgba(255, 255, 255, 0.075);
  --line-2: rgba(255, 255, 255, 0.13);
  --line-3: rgba(255, 255, 255, 0.24);
  --pine: #10b981;
  --pine-deep: #059669;
  --accent: #10b981;
  --accent-ink: #04130d;
  --wash: rgba(16, 185, 129, 0.12);
  --wash-strong: rgba(16, 185, 129, 0.22);
  --warn: #f59e0b;
  --danger: #ef4444;
  --danger-wash: rgba(239, 68, 68, 0.12);
  --specular: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.36);
  --shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.65), 0 4px 16px rgba(0, 0, 0, 0.4);
  --rail: 192px;
  --rail-collapsed: 64px;
  --pad: clamp(28px, 3.6vw, 56px);
  --sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --quote: 'Newsreader', Georgia, serif;
  color-scheme: dark;
}

[data-theme="light"] {
  --paper: #f5f6f8;
  --surface: #ffffff;
  --surface-2: #f0f2f6;
  --sunk: #ebedf2;
  --glass: rgba(255, 255, 255, 0.86);
  --ink: #0c0e12;
  --ink-2: #4b5260;
  --ink-3: #7f8796;
  --line: #e3e6ee;
  --line-2: #cfd4e0;
  --line-3: #9ea6b8;
  --pine: #0d9468;
  --pine-deep: #087a54;
  --accent: #0d9468;
  --accent-ink: #ffffff;
  --wash: rgba(13, 148, 104, 0.1);
  --wash-strong: rgba(13, 148, 104, 0.18);
  --warn: #d97706;
  --danger: #dc2626;
  --danger-wash: rgba(220, 38, 38, 0.09);
  --specular: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  --shadow-sm: 0 2px 6px rgba(12, 14, 18, 0.05);
  --shadow-lg: 0 24px 60px rgba(12, 14, 18, 0.14), 0 2px 10px rgba(12, 14, 18, 0.06);
  color-scheme: light;
}

/* ---------- Driver.js Tour ---------- */
.studysync-tour-popover.driver-popover {
  max-width: 360px;
  border: 1px solid var(--line-2);
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink);
  font-family: var(--sans);
  box-shadow: var(--shadow-lg), var(--specular);
  padding: 18px;
}
.studysync-tour-popover .driver-popover-title { color: var(--ink); font: 600 15px/1.35 var(--sans); letter-spacing: -0.02em; }
.studysync-tour-popover .driver-popover-description { color: var(--ink-2); font: 400 13px/1.6 var(--sans); margin-top: 6px; }
.studysync-tour-popover .driver-popover-progress-text { color: var(--ink-3); font: 500 11px/1.4 var(--mono); }
.studysync-tour-popover .driver-popover-navigation-btns button { border-radius: 7px; font: 600 12px/1.2 var(--sans); padding: 7px 12px; text-shadow: none; }
.studysync-tour-popover .driver-popover-next-btn { background: var(--ink) !important; color: var(--paper) !important; border: 1px solid var(--ink) !important; }
.studysync-tour-popover .driver-popover-prev-btn { background: var(--surface-2) !important; color: var(--ink-2) !important; border: 1px solid var(--line-2) !important; }
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
  font-size: 14.5px;
  line-height: 1.55;
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

/* Architectural subtle ambient radial glow */
body::before {
  content: '';
  position: fixed;
  top: -28vh;
  left: 50%;
  width: 90vw;
  height: 56vh;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.065) 0%, transparent 70%);
}

::selection { background: var(--wash-strong); color: var(--ink); }

:focus-visible {
  outline: 2px solid var(--pine);
  outline-offset: 2px;
  border-radius: 4px;
}

html { scrollbar-width: thin; scrollbar-color: var(--line-2) transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line-2); border: 2px solid transparent; background-clip: content-box; border-radius: 999px; }

html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden !important; }
html.sheet-open, html.sheet-open body { overflow: hidden !important; }

.skip {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 200;
  padding: 8px 14px;
  border-radius: 6px;
  background: var(--ink);
  color: var(--paper);
  font-size: 12.5px;
  font-weight: 600;
  transform: translateY(-200%);
  transition: transform .18s ease;
}
.skip:focus, .skip:focus-visible { transform: none; }

h1, h2, h3, h4, p, blockquote, figure { margin: 0; }
ul, ol { margin: 0; padding: 0; list-style: none; }
button, input, textarea, select { font: inherit; color: inherit; }
button { cursor: pointer; background: none; border: 0; padding: 0; text-align: inherit; }
a { color: inherit; text-decoration: none; }
svg { display: block; }

/* ---------- Typography ---------- */

.display {
  font-size: clamp(50px, 5.6vw, 82px);
  line-height: 1.03;
  letter-spacing: -0.045em;
  font-weight: 650;
  color: var(--ink);
}

.h1 {
  font-size: clamp(24px, 2.2vw, 32px);
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 650;
}

.h2 {
  font-size: 17px;
  line-height: 1.3;
  letter-spacing: -0.02em;
  font-weight: 600;
}

.h3 {
  font-size: 15.5px;
  line-height: 1.35;
  letter-spacing: -0.015em;
  font-weight: 600;
}

.lede {
  font-size: 16px;
  line-height: 1.65;
  letter-spacing: -0.008em;
  color: var(--ink-2);
  max-width: 52ch;
}

.small { font-size: 13px; line-height: 1.5; }
.micro { font-size: 11.5px; line-height: 1.45; }
.muted { color: var(--ink-2); }
.faint { color: var(--ink-3); }
.ink { color: var(--ink); }
.num {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1, 'zero' 1;
  letter-spacing: -0.02em;
}
.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  border: 1px solid var(--line-2);
  background: var(--sunk);
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1;
}
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
  height: 36px;
  padding: 0 15px;
  border-radius: 7px;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--ink);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  transition: transform .14s ease, opacity .14s ease, background-color .14s ease, border-color .14s ease;
}
.btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn:active:not(:disabled) { transform: translateY(0); }
.btn:disabled { opacity: 0.42; cursor: not-allowed; transform: none; }

.btn-lg { height: 42px; padding: 0 20px; font-size: 14px; border-radius: 8px; }
.btn-sm { height: 30px; padding: 0 11px; font-size: 12px; border-radius: 6px; }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border-radius: 7px;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line-2);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--specular);
  transition: background-color .15s ease, border-color .15s ease, color .15s ease;
}
.btn-ghost:hover:not(:disabled) { background: var(--surface-2); border-color: var(--line-3); }
.btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-ghost.btn-sm { height: 30px; padding: 0 11px; font-size: 12px; border-radius: 6px; }
.btn-ghost.btn-lg { height: 42px; padding: 0 20px; font-size: 14px; border-radius: 8px; }

.btn-quiet {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--ink-2);
  padding: 4px 8px;
  height: auto;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  transition: color .15s ease, background-color .15s ease;
}
.btn-quiet:hover:not(:disabled) { color: var(--ink); background: var(--surface-2); }
.btn-quiet:disabled { opacity: 0.4; cursor: not-allowed; }

.linkish {
  color: var(--ink);
  border-bottom: 1px solid var(--line-2);
  padding-bottom: 1px;
  font-weight: 500;
  transition: border-color .16s ease, color .16s ease;
}
.linkish:hover { border-color: var(--pine); color: var(--pine); }

.field {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: 7px;
  border: 1px solid var(--line-2);
  background: var(--sunk);
  color: var(--ink);
  font-size: 13.5px;
  transition: border-color .15s ease, background-color .15s ease, box-shadow .15s ease;
}
.field::placeholder { color: var(--ink-3); }
.field:hover { border-color: var(--line-3); }
.field:focus {
  outline: none;
  border-color: var(--pine);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--wash);
}
textarea.field {
  height: auto;
  min-height: 92px;
  padding: 10px 12px;
  line-height: 1.55;
  resize: vertical;
}
.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
  margin-bottom: 6px;
}
.field-hint { font-size: 11.5px; color: var(--ink-3); margin-top: 5px; }

.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px;
  color: var(--danger);
  background: var(--danger-wash);
  font-size: 13px;
}
.bar-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--danger); flex: none; }

/* ---------- Brand & Avatar ---------- */

.brand { display: inline-flex; align-items: center; gap: 10px; }
.brand .mark {
  width: 24px;
  height: 24px;
  border: 1px solid var(--line-3);
  border-radius: 50%;
  background: var(--surface-2);
  box-shadow: var(--specular);
  display: grid;
  place-items: center;
  flex: none;
}
.brand .mark i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--pine);
  box-shadow: 0 0 10px var(--pine);
  display: block;
}
.brand-text { display: flex; align-items: baseline; gap: 7px; }
.brand .word {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ink);
}
.brand-tag {
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--surface-2);
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  user-select: none;
  overflow: hidden;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.avatar.on-pine { background: var(--wash); color: var(--pine); border-color: var(--pine); }

/* ---------- Landing Page ---------- */

.land {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-image:
    linear-gradient(to right, var(--line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--line) 1px, transparent 1px);
  background-size: 72px 72px;
  background-position: center top;
}
.wrap { width: 100%; max-width: 1340px; margin: 0 auto; padding-inline: var(--pad); }

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line);
}
.topbar.is-stuck { border-bottom-color: var(--line-2); }
.topbar-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 64px;
}
.topbar-nav { display: flex; align-items: center; gap: 28px; }
.topbar-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  transition: color .15s ease;
}
.topbar-link:hover { color: var(--ink); }
.topbar-actions { display: flex; align-items: center; gap: 12px; }

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
  gap: clamp(40px, 5vw, 72px);
  align-items: center;
  padding-top: clamp(56px, 7vw, 104px);
  padding-bottom: clamp(64px, 8vw, 116px);
}
.hero-copy { display: flex; flex-direction: column; align-items: flex-start; }
.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 11px;
  margin-bottom: 22px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}
.hero-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pine);
  box-shadow: 0 0 8px var(--pine);
}
.line {
  display: block;
  overflow: hidden;
  padding: .06em 0 .1em;
  margin: -.06em 0 0;
}
.line > span { display: block; will-change: transform; }
.hero .lede { margin-top: 22px; }
.hero-cta { display: flex; align-items: center; gap: 14px; margin-top: 32px; }

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  width: 100%;
  margin-top: 44px;
  padding-top: 24px;
  border-top: 1px solid var(--line-2);
}
.hero-metric { display: grid; gap: 4px; }
.hero-metric-val { font-size: 20px; font-weight: 600; color: var(--ink); }
.hero-metric-lbl { font-size: 12px; color: var(--ink-3); }

/* Interactive App Frame on Hero */
.hero-art { position: relative; }
.board-wrap {
  position: relative;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid var(--line-2);
  background: var(--surface-2);
  box-shadow: var(--shadow-lg), var(--specular);
}
.board {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 11px;
  overflow: hidden;
}
.board-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 38px;
  padding: 0 16px;
  background: var(--sunk);
  border-bottom: 1px solid var(--line);
}
.board-dots { display: flex; gap: 6px; }
.board-dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--line-2); display: block; }
.board-path { font-size: 11px; color: var(--ink-3); }
.board-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--pine);
}
.board-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 14px;
}
.board-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--pine);
  margin-bottom: 4px;
}
.board-name { font-size: 17px; font-weight: 650; letter-spacing: -0.02em; }
.board-meta { font-size: 12px; color: var(--ink-3); margin-top: 3px; }
.board-pct-box { text-align: right; }
.board-pct { display: block; font-size: 24px; font-weight: 600; color: var(--ink); line-height: 1; }
.board-pct-sub { font-family: var(--mono); font-size: 9.5px; color: var(--ink-3); letter-spacing: 0.08em; }
.meter { height: 3px; background: var(--line); margin: 0 22px; border-radius: 999px; position: relative; overflow: hidden; }
.meter > i { position: absolute; inset: 0 auto 0 0; background: var(--pine); width: 0; transition: width .45s cubic-bezier(.22, 1, .36, 1); }

.board-list { padding: 8px 12px; }
.brow {
  display: grid;
  grid-template-columns: 24px 58px minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 11px 10px;
  border-radius: 7px;
  border-bottom: 1px solid var(--line);
  width: 100%;
  transition: background-color .14s ease;
}
.board-list .brow:last-child { border-bottom: 0; }
.brow:hover { background: var(--surface-2); }
.brow-mark { width: 22px; height: 22px; display: grid; place-items: center; }
.brow-code { font-size: 11px; color: var(--ink-3); }
.brow-title { font-size: 13.5px; color: var(--ink); font-weight: 500; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.brow.done .brow-title { color: var(--ink-3); text-decoration: line-through; }
.brow-assignee { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--ink-2); }
.board-foot {
  padding: 12px 22px;
  background: var(--sunk);
  border-top: 1px solid var(--line);
  font-size: 11.5px;
  color: var(--ink-3);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding-top: 24px;
}
.fact {
  padding: 26px;
  border-radius: 12px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
}
.fact-idx {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--pine);
  margin-bottom: 12px;
}
.fact h3 { font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 8px; }
.fact p { font-size: 13.5px; line-height: 1.6; color: var(--ink-2); }

.quote-sec { padding: clamp(64px, 8vw, 112px) 0; }
.quote-block {
  padding: 40px 48px;
  border-radius: 14px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
}
.quote-block p {
  font-family: var(--quote);
  font-style: italic;
  font-weight: 300;
  font-size: clamp(24px, 2.6vw, 34px);
  line-height: 1.32;
  color: var(--ink);
  max-width: 48ch;
}
.quote-block cite {
  display: block;
  margin-top: 18px;
  font-family: var(--mono);
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}

.foot { border-top: 1px solid var(--line); background: var(--surface); margin-top: auto; }
.foot-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 68px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.foot-left { display: flex; align-items: center; gap: 18px; }
.status { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 11.5px; }
.sdot { width: 7px; height: 7px; border-radius: 50%; background: var(--ink-3); flex: none; }
.sdot.ok { background: var(--pine); box-shadow: 0 0 8px var(--pine); }
.sdot.bad { background: var(--danger); }

/* ---------- Desktop App Shell ---------- */

.app {
  height: 100dvh;
  display: grid;
  grid-template-columns: var(--rail) minmax(0, 1fr);
  overflow: hidden;
  background: var(--paper);
  transition: grid-template-columns .18s cubic-bezier(.22, 1, .36, 1);
}
.app.rail-collapsed {
  grid-template-columns: var(--rail-collapsed) minmax(0, 1fr);
}

.rail {
  position: relative;
  align-self: stretch;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100dvh;
  border-right: 1px solid var(--line);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 30;
  background: var(--surface);
}
.rail.collapsed {
  padding: 10px 6px;
  align-items: center;
}
.rail.collapsed .rail-hide-collapsed {
  display: none !important;
}

.rail-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 2px 4px;
  min-height: 28px;
}
.rail-brand-btn { display: inline-flex; align-items: center; min-width: 0; }
.rail .brand { gap: 8px; }
.rail .brand .mark { width: 24px; height: 24px; border-radius: 50%; }
.rail .brand .word { font-size: 13.5px; }
.rail-brand-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.rail.collapsed .rail-brand {
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 0;
  width: 100%;
}
.rail.collapsed .rail .brand .mark,
.rail.collapsed .brand .mark {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}
.rail.collapsed .brand-text { display: none; }

.rail-cmd {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 0;
  background: var(--surface-2);
  color: var(--ink-2);
  font-size: 12px;
  transition: color .15s ease, background-color .15s ease, transform .15s ease;
}
.rail-cmd:hover { color: var(--ink); background: var(--wash-strong); }
.rail-cmd span { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail.collapsed .rail-cmd {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  justify-content: center;
}

.rail-label {
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 600;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  padding: 0 6px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rail-label-right { display: flex; align-items: center; gap: 4px; }
.rail-plus {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--ink-2);
  transition: background-color .14s ease, color .14s ease;
}
.rail-plus:hover { background: var(--pine); color: var(--accent-ink); }

.rail-nav { display: grid; gap: 2px; flex: none; width: 100%; }
.rail-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-2);
  transition: background-color .14s ease, color .14s ease;
}
.rail-item > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-item .icon { color: var(--ink-3); transition: color .14s ease; flex: none; }
.rail-item:hover { background: var(--surface-2); color: var(--ink); }
.rail-item:hover .icon { color: var(--ink-2); }
.rail-item.active {
  color: var(--pine);
  background: var(--wash);
  font-weight: 600;
}
.rail-item.active .icon { color: var(--pine); }
.rail.collapsed .rail-nav {
  justify-items: center;
  gap: 6px;
}
.rail.collapsed .rail-item {
  width: 40px;
  height: 40px;
  margin-inline: auto;
  padding: 0;
  border-radius: 50%;
  background: var(--surface-2);
  justify-content: center;
}
.rail.collapsed .rail-item:hover {
  background: var(--wash-strong);
  color: var(--pine);
}
.rail.collapsed .rail-item.active {
  background: var(--pine);
  color: var(--accent-ink);
}
.rail.collapsed .rail-item.active .icon {
  color: var(--accent-ink);
}
.rail.collapsed .rail-item .rail-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 15px;
  height: 15px;
  line-height: 15px;
  font-size: 9px;
  padding: 0 3px;
}
.rail-kbd {
  font-family: var(--mono);
  font-size: 9.5px;
  color: var(--ink-3);
  opacity: 0;
  transition: opacity .14s ease;
}
.rail-item:hover .rail-kbd { opacity: 0.8; }

.rail-groups {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--line);
  padding-top: 8px;
}
.rail-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rail.collapsed .rail-scroll {
  align-items: center;
  gap: 8px;
  padding-top: 2px;
}
.rail-empty { padding: 6px; font-size: 11.5px; color: var(--ink-3); }

.rail-group {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px 0 5px;
  border-radius: 999px;
  color: var(--ink-2);
  font-size: 12.5px;
  transition: background-color .15s ease, color .15s ease, transform .15s ease;
}
.rail-group-mono {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--ink);
  display: grid;
  place-items: center;
  flex: none;
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
  overflow: hidden;
  transition: background-color .15s ease, color .15s ease;
}
.rail-group-mono img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
.rail-group:hover { background: var(--surface-2); color: var(--ink); }
.rail-group:hover .rail-group-mono { background: var(--wash-strong); color: var(--pine); }
.rail-group.active {
  background: var(--wash);
  color: var(--pine);
  font-weight: 600;
}
.rail-group.active .rail-group-mono {
  background: var(--pine);
  color: var(--accent-ink);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
}
.rail-group.unread { color: var(--ink); font-weight: 600; }
.rail.collapsed .rail-group {
  width: 42px;
  height: 42px;
  padding: 0;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  background: var(--surface-2);
}
.rail.collapsed .rail-group .rail-group-mono {
  width: 100%;
  height: 100%;
  background: transparent;
  color: inherit;
  font-size: 11.5px;
}
.rail.collapsed .rail-group:hover {
  background: var(--wash-strong);
  color: var(--pine);
}
.rail.collapsed .rail-group.active {
  background: var(--pine);
  color: var(--accent-ink);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}
.rail.collapsed .rail-group .rail-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 15px;
  height: 15px;
  line-height: 15px;
  font-size: 9px;
  padding: 0 3px;
}
.rail-pill {
  position: absolute;
  left: -4px;
  top: 50%;
  width: 4px;
  height: 10px;
  border-radius: 0 4px 4px 0;
  background: var(--pine);
  transform: translateY(-50%);
}
.rail-group .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-count { font-family: var(--mono); font-size: 10.5px; color: var(--ink-3); flex: none; }
.rail-badge {
  flex: none;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--wash);
  color: var(--pine);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
}
.rail-badge.mention { background: var(--danger); color: #fff; }
.rail-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--ink-3);
  transition: color .14s ease, background-color .14s ease;
}
.rail-add:hover { color: var(--pine); background: var(--wash); }
.rail.collapsed .rail-add {
  width: 42px;
  height: 42px;
  padding: 0;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  background: var(--surface-2);
  color: var(--pine);
}
.rail.collapsed .rail-add:hover {
  background: var(--pine);
  color: var(--accent-ink);
}

.rail-foot {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--line);
  width: 100%;
}
.rail-user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px 6px 4px 4px;
  border-radius: 999px;
  border: 0;
  background: var(--surface-2);
}
.rail.collapsed .rail-user-card {
  flex-direction: column;
  padding: 0;
  gap: 6px;
  background: transparent;
}
.rail-user {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
}
.rail.collapsed .rail-user {
  justify-content: center;
  flex: none;
}
.rail.collapsed .rail-user .avatar {
  width: 36px !important;
  height: 36px !important;
  font-size: 12px !important;
}
.rail-user-meta { display: grid; min-width: 0; }
.rail-user-name { font-size: 11.5px; font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-foot-tools { display: flex; align-items: center; gap: 2px; flex: none; }
.rail.collapsed .rail-foot-tools {
  flex-direction: column;
  gap: 4px;
}
.rail-icon-btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: var(--ink-3);
  transition: background-color .14s ease, color .14s ease;
}
.rail.collapsed .rail-icon-btn {
  width: 34px;
  height: 34px;
  background: var(--surface-2);
}
.rail-icon-btn:hover { background: var(--surface-2); color: var(--ink); }
.rail.collapsed .rail-icon-btn:hover { background: var(--wash-strong); color: var(--pine); }
.rail-icon-btn.danger:hover { background: var(--danger-wash); color: var(--danger); }

/* ---------- Workspace Top Bar & Main Viewport ---------- */

.main {
  min-width: 0;
  height: 100dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  background: var(--paper);
}

.wbar {
  position: sticky;
  top: 0;
  z-index: 25;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 52px;
  padding: 0 var(--pad);
  background: var(--glass);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
}
.wbar-crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  min-width: 0;
}
.wbar-root { color: var(--ink-3); font-weight: 500; transition: color .14s ease; }
.wbar-root:hover { color: var(--ink); }
.wbar-sep { color: var(--ink-3); opacity: 0.5; }
.wbar-current { color: var(--ink); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wbar-actions { display: flex; align-items: center; gap: 10px; }
.wbar-telemetry {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-2);
}

.page {
  width: 100%;
  max-width: 1440px;
  margin-inline: auto;
  padding: 32px var(--pad) 72px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* When inside a Group, let the 3-pane workspace span edge-to-edge inside .main */
.page:has(.group-layout) {
  max-width: none;
  padding: 0;
  overflow: hidden;
}

/* ---------- Command Palette (⌘K) ---------- */

.cmd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(4, 6, 9, 0.65);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: start center;
  padding-top: 13vh;
}
.cmd-dialog {
  width: min(580px, calc(100vw - 32px));
  border-radius: 13px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--shadow-lg), var(--specular);
  overflow: hidden;
}
.cmd-head {
  display: flex;
  align-items: center;
  gap: 11px;
  height: 50px;
  padding: 0 16px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-3);
}
.cmd-input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: 14.5px;
}
.cmd-input::placeholder { color: var(--ink-3); }
.cmd-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 6px;
  display: grid;
  gap: 2px;
}
.cmd-empty { padding: 28px 16px; text-align: center; color: var(--ink-3); font-size: 13px; }
.cmd-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 11px;
  border-radius: 8px;
  color: var(--ink-2);
  font-size: 13.5px;
  transition: background-color .1s ease, color .1s ease;
}
.cmd-item.active {
  background: var(--surface-2);
  color: var(--ink);
}
.cmd-item.active .icon { color: var(--pine); }
.cmd-item-label { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-item-meta { font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
.cmd-foot {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 9px 16px;
  border-top: 1px solid var(--line);
  background: var(--sunk);
  font-size: 11.5px;
  color: var(--ink-3);
}

/* ---------- Create Group & Invite Wizard Modal ---------- */

.cgm-dialog {
  width: min(510px, calc(100vw - 32px));
  border-radius: 18px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--shadow-lg), var(--specular);
  overflow: hidden;
  animation: toast-in .22s cubic-bezier(.22, 1, .36, 1) both;
}
.cgm-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: var(--sunk);
  border-bottom: 1px solid var(--line);
}
.cgm-steps {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cgm-step {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-3);
}
.cgm-step i {
  font-style: normal;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  color: var(--ink-3);
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 600;
}
.cgm-step.active {
  color: var(--ink);
  font-weight: 600;
}
.cgm-step.active i {
  background: var(--pine);
  border-color: var(--pine);
  color: var(--accent-ink);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
}
.cgm-step.done {
  color: var(--pine);
}
.cgm-step.done i {
  background: var(--wash);
  border-color: var(--pine);
  color: var(--pine);
}
.cgm-step-line {
  width: 22px;
  height: 1px;
  background: var(--line-2);
}
.cgm-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--ink-3);
  display: grid;
  place-items: center;
  transition: background-color .14s ease, color .14s ease;
}
.cgm-close:hover {
  background: var(--wash-strong);
  color: var(--ink);
}

.cgm-body {
  padding: 22px 24px 20px;
  display: grid;
  gap: 18px;
}
.cgm-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 16px 16px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.14), transparent 70%),
    var(--sunk);
}
.cgm-avatar-picker {
  position: relative;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1.5px dashed var(--line-3);
  color: var(--ink-2);
  display: grid;
  place-items: center;
  flex: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  transition: border-color .16s ease, background-color .16s ease, color .16s ease, transform .16s ease;
}
.cgm-avatar-picker.has-image {
  border-style: solid;
  border-color: var(--pine);
}
.cgm-avatar-picker:hover {
  border-color: var(--pine);
  background: var(--wash);
  color: var(--pine);
  transform: translateY(-2px);
}
.cgm-avatar-picker img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
.cgm-avatar-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.cgm-avatar-initials {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--pine);
}
.cgm-avatar-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--pine);
  color: var(--accent-ink);
  border: 2.5px solid var(--sunk);
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.cgm-title {
  margin-top: 12px;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--ink);
  max-width: 36ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cgm-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ink-3);
  max-width: 42ch;
}
.cgm-avatar-pills {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.cgm-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 27px;
  padding: 0 11px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  color: var(--ink-2);
  font-size: 11.5px;
  font-weight: 500;
  transition: background-color .14s ease, color .14s ease, border-color .14s ease;
}
.cgm-pill-btn:hover,
.cgm-pill-btn.active {
  background: var(--wash);
  border-color: var(--pine);
  color: var(--pine);
}
.cgm-pill-btn.danger:hover {
  background: var(--danger-wash);
  border-color: var(--danger);
  color: var(--danger);
}
.cgm-url-input {
  margin-top: 10px;
  height: 32px !important;
  font-size: 12px !important;
  padding: 0 12px !important;
  border-radius: 999px !important;
}

.cgm-fields {
  display: grid;
  gap: 14px;
}
.cgm-field-group {
  display: grid;
  gap: 6px;
}
.cgm-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.cgm-label-row .field-label {
  margin: 0;
}
.cgm-char {
  font-size: 10.5px;
  color: var(--ink-3);
}

.cgm-created-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(16, 185, 129, 0.32);
  background:
    radial-gradient(circle at 0% 50%, rgba(16, 185, 129, 0.14), transparent 65%),
    var(--sunk);
}
.cgm-created-meta {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 3px;
}
.cgm-created-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cgm-created-badge {
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--wash);
  color: var(--pine);
}
.cgm-created-name {
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cgm-created-desc {
  font-size: 12px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cgm-invite-box {
  display: grid;
  gap: 10px;
}
.cgm-invited-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--pine);
}
.cgm-search-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--sunk);
  color: var(--ink-3);
  transition: border-color .15s ease;
}
.cgm-search-wrap:focus-within {
  border-color: var(--pine);
  color: var(--pine);
}
.cgm-search-wrap input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: 13px;
}
.cgm-search-wrap input::placeholder {
  color: var(--ink-3);
}
.cgm-search-clear {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--ink-3);
  display: grid;
  place-items: center;
}
.cgm-search-clear:hover {
  color: var(--ink);
}

.cgm-invite-list {
  max-height: 230px;
  overflow-y: auto;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--sunk);
  display: grid;
  gap: 3px;
}
.cgm-invite-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 12.5px;
  color: var(--ink-3);
}
.cgm-person {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 9px;
  border-radius: 9px;
  transition: background-color .14s ease;
}
.cgm-person:hover {
  background: var(--surface-2);
}
.cgm-person-info {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 1px;
}
.cgm-person-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cgm-person-sub {
  font-size: 11.5px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cgm-invite-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  transition: background-color .14s ease, border-color .14s ease, color .14s ease;
}
.cgm-invite-btn:hover:not(:disabled) {
  background: var(--pine);
  border-color: var(--pine);
  color: var(--accent-ink);
}
.cgm-invite-btn.invited {
  background: var(--wash);
  border-color: rgba(16, 185, 129, 0.35);
  color: var(--pine);
  cursor: default;
}

.cgm-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 2px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

/* ---------- Page Headers & Bento Ledger ---------- */

.phead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.date {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--pine);
  margin-bottom: 8px;
}
.psub { margin-top: 7px; font-size: 14px; line-height: 1.55; color: var(--ink-2); max-width: 62ch; }
.actions { display: flex; align-items: center; gap: 12px; }

.back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--ink-3);
  margin-bottom: 18px;
  transition: color .14s ease;
}
.back:hover { color: var(--ink); }

.ledger {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.stat {
  padding: 18px 20px;
  border-radius: 11px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}
.stat-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.stat-label { font-family: var(--mono); font-size: 10.5px; font-weight: 600; color: var(--ink-3); letter-spacing: 0.06em; }
.stat-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--ink-2);
}
.stat-num {
  font-size: 32px;
  line-height: 1;
  font-weight: 600;
  color: var(--ink);
}
.stat-meter-row { display: flex; align-items: center; gap: 14px; }
.stat-bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--sunk);
  border: 1px solid var(--line);
  overflow: hidden;
  position: relative;
}
.stat-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--pine);
  border-radius: 999px;
  transition: width .35s ease;
}

.shead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 34px 0 14px;
}
.shead.tight { margin-top: 12px; }
.shead-left { display: flex; align-items: center; gap: 10px; }
.shead-badge {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  font-size: 11.5px;
  color: var(--ink-2);
}
.inline-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 11px;
  border-radius: 7px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  color: var(--ink-3);
  width: 240px;
  transition: border-color .15s ease, width .18s ease;
}
.inline-search:focus-within { border-color: var(--pine); width: 280px; color: var(--ink); }
.inline-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: 12.5px;
}
.inline-search input::placeholder { color: var(--ink-3); }

/* ---------- Group Creation Form & Group Ledger Cards ---------- */

.groupform {
  overflow: hidden;
  margin-top: 16px;
  padding: 20px 22px;
  border-radius: 12px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
}
.groupform-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.groupform-title { font-size: 14.5px; font-weight: 600; color: var(--ink); }
.groupform-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }

.grow-grid { display: grid; gap: 8px; }
.grow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px 24px;
  gap: 20px;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--specular);
  transition: border-color .15s ease, background-color .15s ease, transform .15s ease;
}
.grow:hover {
  background: var(--surface-2);
  border-color: var(--line-2);
  transform: translateY(-1px);
}
.grow-main { min-width: 0; display: grid; gap: 5px; }
.grow-top { display: flex; align-items: center; gap: 10px; }
.grow-code {
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--line-2);
  background: var(--sunk);
  font-size: 10.5px;
  color: var(--ink-3);
}
.grow-name { font-size: 15.5px; font-weight: 600; letter-spacing: -0.015em; color: var(--ink); }
.grow.unread { border-color: rgba(16, 185, 129, 0.35); }
.grow-unread, .grow-mention {
  padding: 2px 8px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
}
.grow-unread { background: var(--wash); color: var(--pine); }
.grow-mention { background: var(--danger); color: #fff; }
.grow-meta {
  font-size: 12.5px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.grow-side { display: grid; gap: 7px; min-width: 0; }
.grow-side-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.grow-tasks { font-size: 11.5px; color: var(--ink-3); }
.grow-pct { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.grow-prog { height: 5px; border-radius: 999px; background: var(--sunk); border: 1px solid var(--line); position: relative; overflow: hidden; }
.grow-prog i { position: absolute; inset: 0 auto 0 0; background: var(--pine); border-radius: 999px; transition: width .3s ease; }
.grow-arrow {
  color: var(--ink-3);
  display: grid;
  place-items: center;
  transition: transform .15s ease, color .15s ease;
}
.grow:hover .grow-arrow { color: var(--ink); transform: translateX(3px); }

/* ---------- Group 3-Pane Desktop Architecture ---------- */

.group-layout,
.group-layout.wide {
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr) 276px;
  grid-template-rows: minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  height: calc(100dvh - 52px);
}

.channel-list {
  display: flex;
  flex-direction: column;
  grid-column: 1;
  grid-row: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 9px;
  border-right: 1px solid var(--line);
  background: var(--surface);
}
.channel-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 8px;
  margin-bottom: 8px;
  border-radius: 6px;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 500;
  transition: background-color .14s ease, color .14s ease;
}
.channel-back:hover { background: var(--surface-2); color: var(--ink); }
.channel-back-arrow { font-size: 15px; line-height: .8; }

.channel-server {
  padding: 10px 11px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid var(--line-2);
  background: var(--sunk);
  display: grid;
  gap: 6px;
}
.channel-server-head {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.channel-server-titles {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.channel-server-tag {
  font-size: 9.5px;
  color: var(--pine);
  letter-spacing: 0.06em;
  font-weight: 600;
}
.channel-server-name {
  font-size: 13.5px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--ink);
  overflow-wrap: anywhere;
}
.channel-server-desc {
  font-size: 11.5px;
  color: var(--ink-2);
  line-height: 1.4;
}
.channel-server-prog { margin-top: 4px; display: grid; gap: 4px; }
.channel-server-prog-row { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
.channel-server-meta { font-size: 11px; color: var(--ink-3); }
.channel-server-pct { font-size: 11px; font-weight: 600; color: var(--pine); }
.channel-server .meter { margin: 0; height: 3.5px; }

.channel-section {
  margin: 6px 6px 4px;
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.channel-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 500;
  transition: background-color .14s ease, color .14s ease;
}
.channel-row:hover { background: var(--surface-2); color: var(--ink); }
.channel-row.active {
  background: var(--wash);
  color: var(--pine);
  font-weight: 600;
}
.channel-hash { flex: none; width: 15px; text-align: center; color: var(--ink-3); font-family: var(--mono); font-size: 14px; }
.channel-row:hover .channel-hash, .channel-row.active .channel-hash { color: inherit; }
.channel-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.channel-count { margin-left: auto; flex: none; font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
.channel-unread { margin-left: auto; flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--pine); }

.group-main {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: 20px 28px 24px;
  overflow-y: auto;
}
.group-main:has(#panel-chat) {
  overflow: hidden;
  padding-bottom: 12px;
}

.channel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 14px;
  margin: 0 0 14px;
  border-bottom: 1px solid var(--line);
  flex: none;
}
.channel-hash.large { font-size: 18px; color: var(--pine); }
.channel-title {
  flex: none;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.channel-topic {
  flex: 0 1 auto;
  min-width: 0;
  margin-left: 4px;
  padding-left: 12px;
  border-left: 1px solid var(--line-2);
  font-size: 12.5px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.channel-search {
  flex: none;
  width: 210px;
  margin-left: auto;
  height: 32px;
  padding: 0 11px;
  border: 1px solid var(--line-2);
  border-radius: 7px;
  background: var(--surface);
  color: var(--ink);
  font-size: 12.5px;
  outline: 0;
  transition: border-color .16s ease, width .18s ease;
}
.channel-search:focus { border-color: var(--pine); width: 260px; }
.channel-badge {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--wash);
  color: var(--pine);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
}

#panel-members {
  grid-column: 3;
  grid-row: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 16px 28px;
  border-left: 1px solid var(--line);
  background: var(--surface);
}

/* ---------- Tasks & Filters ---------- */

.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0 14px;
  border-bottom: 1px solid var(--line);
}
.filter-set {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.filter {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-3);
  transition: color .14s ease, background-color .14s ease;
}
.filter:hover { color: var(--ink-2); }
.filter[aria-pressed='true'] {
  color: var(--ink);
  background: var(--surface-2);
  box-shadow: var(--specular);
}

.composer {
  overflow: hidden;
  margin: 12px 0;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
}
.composer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
.composer input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 4px 0;
  font-size: 14.5px;
  color: var(--ink);
}
.composer input::placeholder { color: var(--ink-3); }
.composer input:focus { outline: none; }
.task-assignee-picker { margin: 0; padding: 12px 0 0; border: 0; }
.task-assignee-picker legend { margin-bottom: 8px; color: var(--ink-3); font-family: var(--mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; }
.task-assignee-picker > div { display: flex; flex-wrap: wrap; gap: 6px; }
.task-assignee-picker label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px 4px 5px;
  border: 1px solid var(--line-2);
  border-radius: 999px;
  background: var(--sunk);
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  transition: border-color .14s ease, background-color .14s ease;
}
.task-assignee-picker label.selected {
  border-color: var(--pine);
  background: var(--wash);
  color: var(--pine);
}
.task-assignee-picker input { position: absolute; opacity: 0; pointer-events: none; }

.task {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 13px 12px;
  margin-inline: -12px;
  border-radius: 9px;
  border-bottom: 1px solid var(--line);
  transition: background-color .14s ease;
}
.task:hover { background: var(--surface); }
.task-mark {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  transition: background-color .14s ease;
}
.task-mark:hover { background: var(--surface-2); }
.task-body {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px 12px;
}
.task-primary-line {
  flex: 0 0 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding-right: 68px;
}
.task-code {
  flex: none;
  font-size: 11px;
  color: var(--ink-3);
}
.task-title {
  position: relative;
  display: inline-block;
  font-size: 14.5px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--ink);
  transition: color .2s ease;
  min-width: 0;
}
.task-title .hl,
.brow-title .hl {
  position: absolute;
  left: 0;
  right: 0;
  top: 15%;
  bottom: 12%;
  background: var(--wash);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: left center;
  z-index: 0;
}
.task-title .tt { position: relative; z-index: 1; }
.marked { position: relative; display: inline-block; max-width: 100%; }
.task.is-done .hl, .brow.done .hl { transform: scaleX(1); }
.task.is-done .task-title { color: var(--ink-3); text-decoration: line-through; }

.task-meta { display: contents; font-size: 11.5px; color: var(--ink-3); }
.task-status {
  padding: 2px 8px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
}
.task-status.s-todo { background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--line-2); }
.task-status.s-doing { background: rgba(245, 158, 11, 0.14); color: var(--warn); border: 1px solid rgba(245, 158, 11, 0.3); }
.task-status.s-done { background: var(--wash); color: var(--pine); border: 1px solid rgba(16, 185, 129, 0.28); }
.task-when { color: var(--ink-3); font-size: 11px; }
.task-people { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-2); font-size: 12px; }
.task-people .avatar { flex: none; margin-right: -5px; }
.task-people .avatar:last-of-type { margin-right: 0; }
.task-people-more { font-size: 10.5px; color: var(--ink-3); }
.task-people.none { color: var(--ink-3); }

.task-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 23px;
  padding: 0 9px;
  border-radius: 6px;
  border: 1px solid var(--line-2);
  background: var(--sunk);
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-2);
  cursor: pointer;
  transition: border-color .14s ease, color .14s ease, background-color .14s ease;
}
.task-chip:hover,
details[open] > .task-chip {
  color: var(--pine);
  border-color: var(--pine);
  background: var(--wash);
}
details[open] > .task-chip .icon { transform: rotate(180deg); }

.task-drawers { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-left: auto; }
.task-assign { position: relative; margin: 0; }
.task-assign summary, .task-comments summary { cursor: pointer; list-style: none; }
.task-assign summary::-webkit-details-marker, .task-comments summary::-webkit-details-marker { display: none; }
.task-assign-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 25;
  display: grid;
  gap: 4px;
  width: 240px;
  padding: 10px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}
.task-assign-menu label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--ink-2);
  font-size: 12.5px;
  cursor: pointer;
}
.task-assign-menu label:hover { background: var(--surface-2); color: var(--ink); }
.task-assign-menu .btn { margin-top: 6px; width: 100%; }

.task-tools {
  position: absolute;
  top: 11px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity .14s ease;
}
.task:hover .task-tools, .task:focus-within .task-tools { opacity: 1; }
.task-tool {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--ink-3);
  font-size: 11px;
}
.task-tool:hover { color: var(--ink); border-color: var(--line-2); background: var(--surface-2); }
.task-tool.danger:hover, .task-tool.danger.confirm { color: var(--danger); border-color: rgba(239, 68, 68, 0.35); background: var(--danger-wash); }

.task-rename { flex: 1; }
.task-rename input {
  width: 100%;
  max-width: 540px;
  padding: 4px 10px;
  border: 1px solid var(--pine);
  border-radius: 6px;
  background: var(--sunk);
  color: var(--ink);
  font-size: 14px;
  outline: 0;
}

.task-comments { margin: 0; }
.task-comment-list {
  display: grid;
  gap: 8px;
  width: min(440px, 70vw);
  margin-top: 8px;
  padding: 12px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  background: var(--sunk);
}
.task-comment-empty { margin: 0; color: var(--ink-3); font-size: 12px; }
.task-comment { display: grid; gap: 2px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
.task-comment-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--ink-3); }
.task-comment-head strong { color: var(--ink-2); font-weight: 600; }
.task-comment.me .task-comment-head strong { color: var(--pine); }
.task-comment-body { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ink); white-space: pre-wrap; overflow-wrap: anywhere; }
.task-comment-form { display: flex; gap: 8px; margin-top: 4px; }
.task-comment-form input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink);
  font-size: 12.5px;
  outline: 0;
}
.task-comment-form input:focus { border-color: var(--pine); }

/* ---------- Chat Panel (Discord Channel Architecture) ---------- */

#panel-chat {
  position: relative;
  isolation: isolate;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.chat-livebar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 30px;
  margin: 0 0 4px;
  padding: 0 4px 8px;
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 11px;
  border-bottom: 1px solid var(--line);
}
.chat-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--warn); }
.chat-live-dot.connected { background: var(--pine); box-shadow: 0 0 8px var(--pine); }
.chat-live-count { margin-left: auto; color: var(--ink-3); font-size: 11px; }
.chat-typing { min-height: 18px; margin: 0 0 4px; padding-left: 8px; color: var(--pine); font-size: 11.5px; }

.chat {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 0 18px;
}

.chat-welcome {
  padding: 20px 14px 22px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
.chat-welcome-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  color: var(--pine);
  font-family: var(--mono);
  font-size: 30px;
  font-weight: 600;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  box-shadow: var(--specular);
}
.chat-welcome-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--ink);
}
.chat-welcome-sub {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--ink-2);
  max-width: 60ch;
}

.chat-unit { display: grid; }
.chat-day {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 14px 10px;
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.chat-day::before, .chat-day::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.chat-day span { padding: 2px 10px; border: 1px solid var(--line-2); border-radius: 999px; background: var(--surface); }
.chat-older { display: grid; justify-content: center; margin: 0 0 12px; }

/* Discord-style full-width left-aligned message row */
.msg {
  position: relative;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  column-gap: 14px;
  align-items: start;
  padding: 6px 16px;
  margin-top: 10px;
  border-radius: 8px;
  transition: background-color .1s ease;
}
.msg[data-continuation="true"] {
  margin-top: 0;
  padding-top: 2px;
  padding-bottom: 2px;
}
.msg:hover, .msg:focus-within {
  background: var(--surface);
}
.msg:has(.message-reaction-menu) { z-index: 25; background: var(--surface); }

.msg .avatar {
  grid-column: 1;
  width: 38px;
  height: 38px;
  margin-top: 2px;
  border-radius: 50%;
}
.msg-gutter {
  grid-column: 1;
  width: 38px;
  display: grid;
  place-items: center;
  padding-top: 3px;
}
.msg-hover-time {
  font-family: var(--mono);
  color: var(--ink-3);
  font-size: 9.5px;
  opacity: 0;
  transition: opacity .12s ease;
}
.msg[data-continuation="true"]:hover .msg-hover-time { opacity: 1; }

/* Discord Reply Spine above message */
.msg-reply-spine {
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 54px;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--ink-3);
  min-width: 0;
}
.msg-reply-elbow {
  position: absolute;
  left: 19px;
  top: 50%;
  width: 27px;
  height: 12px;
  border-left: 2px solid var(--line-3);
  border-top: 2px solid var(--line-3);
  border-top-left-radius: 6px;
}
.msg-reply-spine .avatar {
  width: 16px !important;
  height: 16px !important;
  margin-top: 0;
  border-radius: 50%;
}
.msg-reply-author {
  color: var(--ink-2);
  font-weight: 600;
  white-space: nowrap;
}
.reply-preview {
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60ch;
}

.msg-content {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  max-width: 100%;
}
.msg-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.msg-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.msg.me .msg-name { color: var(--pine); }
.msg-self-tag {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--wash);
  color: var(--pine);
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.msg-time {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-3);
}
.msg-edited-inline {
  font-size: 11px;
  color: var(--ink-3);
}

.msg-body {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.52;
  color: var(--ink);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-width: 78ch;
}

/* Discord floating action toolbar on top-right of message row */
.msg-actions {
  position: absolute;
  top: -14px;
  right: 16px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--line-2);
  background: var(--surface-2);
  box-shadow: var(--shadow-sm);
  opacity: 0;
  pointer-events: none;
  transition: opacity .12s ease, transform .12s ease;
  transform: translateY(2px);
}
.msg:hover .msg-actions,
.msg:focus-within .msg-actions,
.msg-actions:has(.message-reaction-menu) {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
.msg-action {
  display: grid;
  place-items: center;
  width: 28px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--ink-2);
  transition: background-color .12s ease, color .12s ease;
}
.msg-action:hover { color: var(--ink); background: var(--surface); }
.msg-action.danger:hover, .msg-action.danger.confirm {
  width: auto;
  min-width: 28px;
  padding-inline: 7px;
  color: var(--danger);
  background: var(--danger-wash);
}

.reaction-anchor { position: relative; }
.message-reaction-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 28;
  display: flex;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}
.message-reaction-menu button { width: 28px; height: 28px; border-radius: 6px; font-size: 16px; }
.message-reaction-menu button:hover { background: var(--surface-2); }
.msg-reactions { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0 2px; }
.msg-reaction {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: var(--surface);
  font-size: 12.5px;
  transition: border-color .12s ease, background-color .12s ease;
}
.msg-reaction:hover { border-color: var(--line-3); }
.msg-reaction span { font-family: var(--mono); color: var(--ink-2); font-size: 11px; }
.msg-reaction.active { border-color: var(--pine); background: var(--wash); }

.chat-mention { color: var(--pine); background: var(--wash); border-radius: 4px; padding: 0 4px; font-weight: 600; }

/* Clickable image preview button inside chat (no new tab!) */
.chat-image-btn {
  position: relative;
  display: inline-block;
  margin-top: 8px;
  max-width: min(460px, 100%);
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid var(--line-2);
  background: var(--sunk);
  cursor: zoom-in;
  transition: border-color .15s ease, transform .15s ease;
}
.chat-image-btn:hover {
  border-color: var(--pine);
}
.chat-image {
  display: block;
  max-width: 100%;
  max-height: 350px;
  object-fit: contain;
}
.chat-image-zoom-hint {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(8, 9, 12, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f3f5f8;
  font-family: var(--mono);
  font-size: 10px;
  opacity: 0;
  transition: opacity .15s ease;
  pointer-events: none;
}
.chat-image-btn:hover .chat-image-zoom-hint { opacity: 1; }

.chat-image-loading, .chat-image-error { display: inline-block; margin-top: 6px; font-size: 12px; color: var(--ink-3); }
.message-edit { display: grid; gap: 7px; width: min(620px, 100%); margin-top: 4px; }
.message-edit textarea { width: 100%; min-height: 72px; padding: 8px 10px; border: 1px solid var(--pine); border-radius: 8px; background: var(--sunk); color: var(--ink); outline: 0; }
.message-edit > div { display: flex; justify-content: flex-end; gap: 8px; }
.message-read { margin: 4px 0 0; color: var(--ink-3); font-size: 10.5px; }

/* Discord-style bottom message bar */
.chat-form {
  flex: none;
  position: relative;
  z-index: 15;
  padding: 6px 10px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  box-shadow: var(--specular);
  margin: 6px 0 0;
}
.chat-compose-row { display: flex; align-items: center; gap: 6px; }
.chat-tools { display: flex; align-items: center; gap: 2px; flex: none; }
.chat-text-wrap { position: relative; min-width: 0; flex: 1; }
.chat-textarea {
  display: block;
  width: 100%;
  height: 36px;
  min-height: 36px;
  max-height: 36px;
  overflow-y: auto;
  resize: none;
  border: 0;
  outline: 0;
  padding: 7px 10px;
  background: transparent;
  color: var(--ink);
  font-size: 14px;
  line-height: 1.45;
}
.chat-textarea::placeholder { color: var(--ink-3); }
.chat-tool, .chat-send {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  color: var(--ink-2);
  transition: background-color .14s ease, color .14s ease;
}
.chat-tool:hover { background: var(--surface); color: var(--ink); }
.chat-send { background: var(--pine); color: var(--accent-ink); }
.chat-send:hover:not(:disabled) { background: var(--pine-deep); }
.chat-send:disabled { opacity: 0.35; }
.send-dots { font-size: 18px; line-height: 1; }

.chat-popover-anchor { position: relative; }
.emoji-menu, .gift-menu, .mention-menu {
  position: absolute;
  z-index: 35;
  bottom: calc(100% + 10px);
  right: 0;
  padding: 8px;
  border: 1px solid var(--line-2);
  border-radius: 11px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}
.emoji-menu { display: grid; grid-template-columns: repeat(6, 34px); gap: 3px; }
.emoji-menu button { height: 32px; border-radius: 6px; font-size: 18px; }
.emoji-menu button:hover, .gift-menu button:hover, .mention-option:hover { background: var(--surface-2); }
.gift-menu { display: grid; gap: 3px; width: 236px; }
.gift-menu button { display: flex; align-items: center; gap: 10px; padding: 7px 9px; border-radius: 7px; font-size: 12.5px; }
.gift-menu button span { font-size: 18px; }
.mention-menu { left: 0; right: auto; display: grid; gap: 2px; width: min(280px, 100%); }
.mention-option { display: flex; align-items: center; gap: 9px; padding: 7px; border-radius: 7px; }
.mention-option[aria-selected='true'] { background: var(--wash); color: var(--pine); }
.mention-option span { display: grid; font-size: 12.5px; }
.mention-option small { color: var(--ink-3); font-size: 10.5px; }
.chat-compose-context, .chat-image-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 7px;
  padding: 7px 10px;
  color: var(--ink-2);
  font-size: 12px;
  background: var(--sunk);
  border-left: 2.5px solid var(--pine);
  border-radius: 0 7px 7px 0;
}
.replying-label { display: grid; min-width: 0; }
.replying-preview { max-width: 60ch; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.context-close { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 6px; color: var(--ink-3); }
.context-close:hover { background: var(--surface-2); color: var(--ink); }
.chat-image-preview-thumb {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--line-2);
  cursor: zoom-in;
}
.chat-image-preview img { width: 48px; height: 48px; object-fit: cover; display: block; }
.chat-image-preview > span { display: grid; flex: 1; font-size: 11.5px; }
.chat-image-preview small { color: var(--ink-3); }

/* ---------- Discord-Style In-App Image Lightbox Modal ---------- */

.lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 220;
  background: rgba(5, 6, 9, 0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  animation: lb-fade .18s ease-out;
}
@keyframes lb-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.lightbox-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 58px;
  padding: 0 24px;
  background: rgba(14, 16, 21, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.lightbox-author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lightbox-sender {
  font-size: 13.5px;
  font-weight: 600;
  color: #f3f5f8;
}
.lightbox-time {
  font-size: 11px;
  color: #9ba3b0;
}
.lightbox-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lightbox-stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  place-items: center;
  padding: 28px;
  cursor: zoom-out;
}
.lightbox-img {
  max-width: min(92vw, 1280px);
  max-height: calc(100dvh - 120px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.75);
  cursor: zoom-in;
  transition: transform .22s cubic-bezier(.22, 1, .36, 1);
}
.lightbox-img.zoomed {
  transform: scale(1.65);
  cursor: zoom-out;
}

/* ---------- Members, Friends & Notifications ---------- */

.member {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 13px 14px;
  border-radius: 9px;
  border-bottom: 1px solid var(--line);
  transition: background-color .14s ease;
}
.member:hover { background: var(--surface); }
.member-role {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-3);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--sunk);
}
.member-name { font-size: 14px; font-weight: 600; color: var(--ink); }
.member-sub { margin-top: 2px; font-size: 12px; color: var(--ink-3); overflow-wrap: anywhere; }

#panel-members .member {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border: 0;
  border-radius: 7px;
}
#panel-members .member:hover { background: var(--surface-2); }
#panel-members .member.offline { opacity: 0.52; }
.member-avatar { position: relative; flex: none; }
.presence {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink-3);
  border: 2px solid var(--surface);
}
.presence.online { background: var(--pine); }
.member-text { display: grid; min-width: 0; }
#panel-members .member-name { font-size: 13px; font-weight: 500; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#panel-members .member.role-owner .member-name { color: var(--pine); font-weight: 600; }
#panel-members .member-sub { font-size: 11px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.member-group { margin-bottom: 10px; }
.member-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin: 14px 6px 6px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.member-search {
  width: 100%;
  height: 32px;
  margin: 4px 0 8px;
  padding: 0 10px;
  border: 1px solid var(--line-2);
  border-radius: 7px;
  background: var(--sunk);
  color: var(--ink);
  font-size: 12.5px;
  outline: 0;
}
.member-search:focus { border-color: var(--pine); }
.member-none { margin: 10px 6px; color: var(--ink-3); font-size: 12px; }
.directory-search { max-width: 380px; }

.side-fold { margin-top: 18px; border-top: 1px solid var(--line); padding-top: 12px; }
.side-fold > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  list-style: none;
  padding: 4px 0;
}
.side-fold > summary::-webkit-details-marker { display: none; }
.side-fold-title { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }
.side-fold-count { font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
.side-fold[open] > summary { margin-bottom: 10px; }
.friend-invite-list { display: grid; gap: 6px; margin: 10px 0 14px; }
.friend-invite {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--sunk);
}
.friend-invite > span { display: grid; min-width: 0; font-size: 12.5px; }
.friend-invite small { overflow: hidden; color: var(--ink-3); font-size: 10.5px; text-overflow: ellipsis; white-space: nowrap; }
.invite-search-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.invite-search-divider::before, .invite-search-divider::after { content: ''; height: 1px; flex: 1; background: var(--line); }

.danger-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
.danger-title { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.danger-hint { margin-top: 3px; font-size: 11px; line-height: 1.45; color: var(--ink-3); }
.btn-danger-quiet {
  border: 1px solid var(--line-2);
  background: transparent;
  color: var(--ink-2);
}
.btn-danger-quiet:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-wash); }
.btn-danger { border: 1px solid var(--danger); background: var(--danger); color: #fff; }

.notif {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
  padding: 15px 14px;
  border-radius: 9px;
  border-bottom: 1px solid var(--line);
  width: 100%;
  text-align: left;
  transition: background-color .14s ease;
}
.notif:hover { background: var(--surface); }
.notif .dot { width: 6px; height: 6px; border-radius: 50%; background: transparent; margin-top: 7px; }
.notif.unread .dot { background: var(--pine); box-shadow: 0 0 6px var(--pine); }
.notif.unread .notif-title { font-weight: 600; color: var(--ink); }
.notif-title { display: block; font-size: 14px; color: var(--ink-2); }
.notif-body { display: block; margin-top: 3px; font-size: 13px; color: var(--ink-3); }
.notif-time { font-family: var(--mono); font-size: 11px; color: var(--ink-3); white-space: nowrap; }

.search-row { display: flex; gap: 8px; margin: 10px 0 4px; }
.search-row .field { flex: 1; }
.search-result { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.rowacts { display: flex; align-items: center; gap: 12px; flex: none; }

.findform {
  padding: 18px 20px;
  margin-bottom: 18px;
  border-radius: 11px;
  border: 1px solid var(--line-2);
  background: var(--surface);
}
.findform-row { display: flex; gap: 10px; max-width: 540px; }
.findform-row .field { flex: 1; }
.findform-results { margin-top: 12px; }
.result-person { display: flex; align-items: center; gap: 12px; min-width: 0; }
.result-text { min-width: 0; }

.invite {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 15px 16px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  margin-bottom: 8px;
}
.invite-title { font-size: 14.5px; font-weight: 600; }
.invite-meta { margin-top: 3px; font-size: 12px; color: var(--ink-3); }

/* ---------- Profile ---------- */

.profile-grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 36px;
  align-items: start;
}
.profile-side {
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
}
.profile-side .avatar { width: 64px; height: 64px; font-size: 20px; border-radius: 50%; }
.profile-name { margin-top: 14px; font-size: 17px; font-weight: 650; }
.profile-email { margin-top: 4px; font-size: 12.5px; color: var(--ink-2); overflow-wrap: anywhere; }
.profile-since { margin-top: 8px; font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
.profile-main {
  min-width: 0;
  padding: 26px 30px;
  border-radius: 12px;
  border: 1px solid var(--line-2);
  background: var(--surface);
  box-shadow: var(--specular);
}
.profile-note { max-width: 54ch; margin-bottom: 16px; }
.form { display: grid; gap: 16px; max-width: 520px; }
.form-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }

/* ---------- Empty State, Skeletons & Boot ---------- */

.boot {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
}

.empty {
  padding: 28px 26px;
  margin-top: 8px;
  border-radius: 12px;
  border: 1px dashed var(--line-2);
  background: var(--surface);
}
.empty-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
}
.empty-title { font-size: 15px; font-weight: 600; color: var(--ink); }
.empty-copy { margin-top: 5px; font-size: 13px; color: var(--ink-2); max-width: 56ch; }

.sk { background: var(--surface-2); border-radius: 4px; animation: skpulse 1.5s ease-in-out infinite; }
.sk-msg { display: flex; align-items: flex-start; gap: 9px; margin: 0 0 12px; }
.sk-msg.right { justify-content: flex-end; }
.sk-avatar { flex: none; width: 30px; height: 30px; border-radius: 7px; }
.sk-bubble { height: 38px; border-radius: 11px; max-width: 78%; }
@keyframes skpulse { 0%, 100% { opacity: .45; } 50% { opacity: .9; } }
.sk-row { display: grid; grid-template-columns: 22px 1fr 60px; gap: 14px; align-items: center; padding: 15px 0; border-bottom: 1px solid var(--line); }

/* ---------- Sheet (Auth Drawer) ---------- */

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(4, 6, 9, 0.65);
  backdrop-filter: blur(5px);
}
.sheet {
  position: fixed;
  inset: 0 0 0 auto;
  z-index: 80;
  width: min(480px, 100%);
  background: var(--surface);
  border-left: 1px solid var(--line-2);
  padding: 36px 38px;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: var(--shadow-lg);
}
.sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.sheet-close {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--line-2);
  font-size: 12px;
  color: var(--ink-2);
}
.sheet-close:hover { color: var(--ink); background: var(--surface-2); }
.sheet-body { display: grid; gap: 16px; }
.sheet-title { font-size: 24px; line-height: 1.15; letter-spacing: -0.03em; font-weight: 650; }
.sheet-sub { font-size: 13.5px; color: var(--ink-2); margin-top: 6px; line-height: 1.55; }
.sheet-alt {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--ink-2);
  display: flex;
  justify-content: space-between;
  gap: 14px;
}
.sheet-foot { margin-top: 28px; font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
.auth-provider-separator { display: flex; align-items: center; gap: 12px; color: var(--ink-3); font-size: 11px; }
.auth-provider-separator::before, .auth-provider-separator::after { content: ''; height: 1px; flex: 1; background: var(--line); }
.auth-provider-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.auth-provider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 38px;
  border: 1px solid var(--line-2);
  border-radius: 7px;
  background: var(--sunk);
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
  transition: background-color .15s ease, border-color .15s ease;
}
.auth-provider:hover:not(:disabled) { background: var(--surface-2); border-color: var(--line-3); }
.auth-provider:disabled { opacity: 0.42; cursor: not-allowed; }
.google-mark, .facebook-mark { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: #fff; font: 700 13px Arial, sans-serif; }
.google-mark { color: #4285f4; }
.facebook-mark { color: #fff; background: #1877f2; font-size: 15px; }
.oauth-note { margin: -4px 0 0; color: var(--ink-3); font-size: 11px; line-height: 1.45; }

/* ---------- Notification Center Popover ---------- */

.notif-center { position: relative; }
.notif-bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--ink-2);
  transition: background-color .14s ease, color .14s ease;
}
.notif-bell:hover, .notif-bell.open { color: var(--pine); background: var(--wash); }
.notif-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--pine);
  color: var(--accent-ink);
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
.notif-panel {
  position: fixed;
  z-index: 95;
  display: grid;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--line-2);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-lg), var(--specular);
  overflow: hidden;
}
.notif-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border-bottom: 1px solid var(--line); }
.notif-panel-title { font-size: 13px; font-weight: 600; color: var(--ink); }
.notif-markall { font-size: 11.5px; color: var(--pine); font-weight: 500; }
.notif-error { margin: 0; padding: 8px 9px; border-radius: 7px; background: var(--danger-wash); color: var(--danger); font-size: 11.5px; }
.notif-section { padding: 4px 0 6px; border-bottom: 1px solid var(--line); }
.notif-section-label { margin: 4px 10px 6px; color: var(--ink-3); font-family: var(--mono); font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.notif-invite { display: grid; gap: 8px; padding: 8px 10px; border-radius: 8px; }
.notif-invite:hover { background: var(--surface-2); }
.notif-invite-main { display: grid; gap: 2px; min-width: 0; }
.notif-invite-name { color: var(--ink); font-size: 13px; font-weight: 600; }
.notif-invite-meta { color: var(--ink-3); font-size: 11px; }
.notif-invite-actions { display: flex; gap: 7px; }
.notif-list { max-height: 320px; overflow-y: auto; overscroll-behavior: contain; padding: 4px 0; }
.notif-empty { margin: 0; padding: 24px 12px; color: var(--ink-3); font-size: 12.5px; text-align: center; }
.notif-row {
  display: grid;
  grid-template-columns: 6px minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 8px;
  text-align: left;
}
.notif-row:hover { background: var(--surface-2); }
.notif-dot { width: 6px; height: 6px; margin-top: 5px; border-radius: 50%; background: transparent; }
.notif-row.unread .notif-dot { background: var(--pine); }
.notif-row-body { display: grid; gap: 2px; min-width: 0; }
.notif-row-title { color: var(--ink-2); font-size: 12.5px; font-weight: 500; }
.notif-row.unread .notif-row-title { color: var(--ink); font-weight: 600; }
.notif-row-text { color: var(--ink-3); font-size: 11.5px; line-height: 1.45; overflow-wrap: anywhere; }
.notif-row-time { font-family: var(--mono); color: var(--ink-3); font-size: 10px; white-space: nowrap; }
.notif-panel-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 9px;
  border-top: 1px solid var(--line);
  color: var(--pine);
  font-size: 12px;
  font-weight: 600;
}
.notif-panel-foot:hover { background: var(--wash); }

/* ---------- Toast ---------- */

.toast-wrap {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 130;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
  width: min(400px, calc(100vw - 32px));
}
.toast {
  background: var(--surface-2);
  color: var(--ink);
  border: 1px solid var(--line-2);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: var(--shadow-lg), var(--specular);
  animation: toast-in .26s cubic-bezier(.22, 1, .36, 1) both;
}
.toast.bad { background: var(--danger); border-color: var(--danger); color: #fff; }
.toast.out { animation: toast-out .26s ease-in both; }
@keyframes toast-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-4px); }
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
