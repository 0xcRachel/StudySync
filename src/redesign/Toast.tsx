import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Tone = 'info' | 'error';
type ToastItem = { id: number; message: string; tone: Tone };
type ShowToast = (message: string, tone?: Tone) => void;
const ToastContext = createContext<ShowToast>(() => undefined);

export const useNativeToast = () => useContext(ToastContext);

export function NativeToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback<ShowToast>((message, tone = 'info') => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3600);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return <ToastContext.Provider value={showToast}><View style={styles.root}>{children}{toast ? <View pointerEvents="none" style={styles.layer} accessibilityLiveRegion="polite"><View key={toast.id} style={[styles.toast, toast.tone === 'error' && styles.error]}><Text style={styles.message}>{toast.message}</Text></View></View> : null}</View></ToastContext.Provider>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layer: { ...StyleSheet.absoluteFill, zIndex: 1000, alignItems: 'center', paddingTop: 18 },
  toast: { maxWidth: '92%', backgroundColor: '#26336E', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 18, borderWidth: 1, borderColor: '#5868C2', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  error: { backgroundColor: '#4A202E', borderColor: '#A84D63' },
  message: { color: '#F7F8FC', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
