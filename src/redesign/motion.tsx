import { useEffect, useRef } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

type MotionViewProps = ViewProps & { routeKey?: string; children?: React.ReactNode };

export function MotionView({ routeKey, children, ...props }: MotionViewProps) {
  const node = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !node.current) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { gsap } = require('gsap') as typeof import('gsap');
    gsap.fromTo(node.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' });
    return undefined;
  }, [routeKey]);
  return <View ref={(value) => { node.current = value as unknown as HTMLElement | null; }} {...props}>{children}</View>;
}

export function useLenis() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Lenis = require('lenis').default as typeof import('lenis').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { gsap } = require('gsap') as typeof import('gsap');
    gsap.fromTo(document.body, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    const lenis = new Lenis({ autoRaf: false, lerp: 0.085, smoothWheel: true, syncTouch: false });
    let frame = 0;
    const tick = (time: number) => { lenis.raf(time); frame = window.requestAnimationFrame(tick); };
    frame = window.requestAnimationFrame(tick);
    return () => { window.cancelAnimationFrame(frame); lenis.destroy(); };
  }, []);
}

export function useScreenMotion(routeKey: string) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { gsap } = require('gsap') as typeof import('gsap');
    gsap.fromTo(document.body, { autoAlpha: 0.72, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.34, ease: 'power3.out', clearProps: 'transform' });
    return undefined;
  }, [routeKey]);
}
