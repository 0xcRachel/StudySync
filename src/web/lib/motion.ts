import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export const getLenis = (): Lenis | null => lenis;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Một vòng raf duy nhất: gsap.ticker điều khiển Lenis, Lenis báo lại ScrollTrigger.
 * Không dùng autoRaf để tránh hai loop tranh nhau.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion()) return undefined;

    const instance = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      anchors: false,
    });
    lenis = instance;

    const onScroll = () => ScrollTrigger.update();
    instance.on('scroll', onScroll);

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      if (lenis === instance) lenis = null;
    };
  }, []);
}

export function stopScroll(): void {
  lenis?.stop();
}

export function startScroll(): void {
  lenis?.start();
}

export function scrollToTop(immediate = true): void {
  if (typeof window === 'undefined') return;
  if (lenis) {
    lenis.scrollTo(0, { immediate, force: true });
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
  }
}

/**
 * Nhảy tới toạ độ tuyệt đối. Với cú nhảy tức thời phải dùng scroll gốc:
 * Lenis giữ bộ đệm max-scroll cũ nên sẽ kẹp lệnh cuộn về giữa trang, và nó
 * vẫn theo dõi scroll do trình duyệt điều khiển nên không bị lệch trạng thái.
 */
export function scrollToOffset(top: number, immediate = true): void {
  if (typeof window === 'undefined') return;
  if (lenis && !immediate) {
    lenis.scrollTo(top, { force: true });
    return;
  }
  if (immediate && lenis) lenis.resize();
  window.scrollTo({ top, behavior: 'auto' });
}

export function scrollToBottom(immediate = true): void {
  if (typeof window === 'undefined') return;
  scrollToOffset(document.documentElement.scrollHeight, immediate);
}

let refreshHandle = 0;

export function refreshScrollTriggers(): void {
  if (typeof window === 'undefined') return;
  window.clearTimeout(refreshHandle);
  refreshHandle = window.setTimeout(() => ScrollTrigger.refresh(), 140);
}

/** Chuyển trang: đưa về đầu trang, fade nhẹ 8px. Không scroll-reveal từng dòng. */
export function usePageMotion(key: string, ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    scrollToTop();
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      gsap.set(el, { clearProps: 'all' });
      return undefined;
    }
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out', clearProps: 'transform,opacity' },
    );
    return () => {
      tween.kill();
    };
  }, [key, ref]);

  useEffect(() => {
    refreshScrollTriggers();
  }, [key]);
}

/** Landing: một chuỗi load duy nhất + hai lần reveal khi cuộn. */
export function useLandingMotion(root: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return;

      const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line] > span', el);
      const fades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]', el);
      const board = el.querySelector<HTMLElement>('[data-hero-board]');
      const rows = gsap.utils.toArray<HTMLElement>('[data-board-row]', el);

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(lines, { yPercent: 108 }, { yPercent: 0, duration: 0.92, stagger: 0.09 }, 0);

      if (fades.length) {
        tl.fromTo(fades, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.66, stagger: 0.07 }, 0.26);
      }
      if (board) {
        tl.fromTo(board, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.82 }, 0.2);
      }
      if (rows.length) {
        tl.fromTo(rows, { opacity: 0, x: -7 }, { opacity: 1, x: 0, duration: 0.46, stagger: 0.055 }, 0.46);
      }

      gsap.utils.toArray<HTMLElement>('[data-reveal]', el).forEach((node) => {
        gsap.from(node, {
          opacity: 0,
          y: 16,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [root]);
}

export function useCountUp(value: number): RefObject<HTMLSpanElement | null> {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      el.textContent = String(value);
      return undefined;
    }
    const state = { v: Number(el.dataset.value ?? 0) };
    const tween = gsap.to(state, {
      v: value,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = String(Math.round(state.v));
      },
    });
    el.dataset.value = String(value);
    return () => {
      tween.kill();
    };
  }, [value]);

  return ref;
}

/** Gạch chân tab: đo phần tử đang chọn và trượt thanh ink tới đó. */
export function useTabsInk(
  container: RefObject<HTMLElement | null>,
  activeKey: string,
): void {
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return undefined;
    const bar = el.querySelector<HTMLElement>('.tab-ink');
    const setBar = (animate: boolean) => {
      const active = el.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!bar || !active) return;
      const x = active.offsetLeft;
      const width = active.offsetWidth;
      if (animate && !prefersReducedMotion()) {
        gsap.to(bar, { x, width, duration: 0.32, ease: 'power2.out' });
      } else {
        gsap.set(bar, { x, width });
      }
    };
    setBar(true);
    const observer = new ResizeObserver(() => setBar(false));
    observer.observe(el);
    // Badge counts appear after the data lands, which changes the active tab's
    // width without changing the container's — watch both or the ink drifts.
    const active = el.querySelector<HTMLElement>('[aria-selected="true"]');
    if (active) observer.observe(active);
    return () => observer.disconnect();
  }, [container, activeKey]);
}

/** Nét highlight quét qua tên việc khi trạng thái đổi. Màu chữ và dấu check do CSS lo. */
export function animateTaskCompletion(row: HTMLElement, done: boolean): void {
  const highlight = row.querySelector<HTMLElement>('.hl');
  if (!highlight) return;

  if (prefersReducedMotion()) {
    gsap.set(highlight, { scaleX: done ? 1 : 0 });
    return;
  }

  if (done) {
    // Lớp is-done đã bật scaleX(1) trong CSS: chạy lại từ 0 để thấy nét quét.
    gsap.fromTo(
      highlight,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.42, ease: 'power2.out', overwrite: true },
    );
  } else {
    gsap.to(highlight, { scaleX: 0, duration: 0.22, ease: 'power1.in', overwrite: true });
  }
}
