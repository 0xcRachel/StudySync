import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type Tone = 'ink' | 'bad';
type ToastItem = { id: number; message: string; tone: Tone; leaving: boolean };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const push = useCallback((message: string, tone: Tone = 'ink') => {
    const id = counter.current + 1;
    counter.current = id;
    setItems((current) => [...current.slice(-2), { id, message, tone, leaving: false }]);

    const leave = window.setTimeout(() => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
      );
    }, 3900);
    const remove = window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4250);
    timers.current.push(leave, remove);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {items.map((item) => {
          const classes = ['toast'];
          if (item.tone === 'bad') classes.push('bad');
          if (item.leaving) classes.push('out');
          return (
            <div className={classes.join(' ')} key={item.id}>
              {item.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
