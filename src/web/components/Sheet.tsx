import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion, startScroll, stopScroll } from '../lib/motion';

function trapFocus(event: KeyboardEvent<HTMLDivElement>, root: HTMLElement | null): void {
  if (event.key !== 'Tab' || !root) return;
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((node) => node.offsetParent !== null);
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  // Mở sheet: render ngay để kịp chạy animation vào.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return undefined;
    document.documentElement.classList.add('sheet-open');
    return () => {
      document.documentElement.classList.remove('sheet-open');
      startScroll();
    };
  }, [mounted]);

  useLayoutEffect(() => {
    if (!mounted) return undefined;
    const sheet = sheetRef.current;
    const backdrop = backRef.current;
    if (!sheet || !backdrop) return undefined;

    if (open) {
      restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      stopScroll();
      if (prefersReducedMotion()) {
        gsap.set(backdrop, { opacity: 1 });
        gsap.set(sheet, { xPercent: 0 });
      } else {
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power1.out', overwrite: true });
        gsap.fromTo(sheet, { xPercent: 100 }, { xPercent: 0, duration: 0.46, ease: 'power3.out', overwrite: true });
      }
      const first =
        sheet.querySelector<HTMLElement>('[data-autofocus]') ??
        sheet.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select') ??
        sheet.querySelector<HTMLElement>('a[href], button:not([disabled])');
      const timer = window.setTimeout(() => first?.focus(), 80);
      return () => window.clearTimeout(timer);
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        setMounted(false);
        startScroll();
        restoreFocus.current?.focus();
      },
    });
    timeline
      .to(backdrop, { opacity: 0, duration: 0.16, ease: 'power1.in' }, 0)
      .to(sheet, { xPercent: 100, duration: 0.3, ease: 'power2.in' }, 0);

    return () => {
      timeline.kill();
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div className="backdrop" ref={backRef} onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        data-lenis-prevent
        onKeyDown={(event) => trapFocus(event, sheetRef.current)}
      >
        <div className="sheet-head">
          <div>
            <h2 className="sheet-title" id="sheet-title">
              {title}
            </h2>
            {subtitle ? <p className="sheet-sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="sheet-close" onClick={onClose}>
            Đóng
          </button>
        </div>
        {children}
        {footer ? <div className="sheet-foot">{footer}</div> : null}
      </div>
    </>
  );
}
