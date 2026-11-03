import { useEffect, useRef } from 'react';
import { REALTIME_URL } from '../config/api';
import type { Notification } from '../web/lib/api';

/** Keeps account-scoped notifications live even when the user is outside a group chat. */
export function useUserRealtime({
  enabled,
  token,
  onNotification,
}: {
  enabled: boolean;
  token: string;
  onNotification: (notification: Notification) => void;
}): void {
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled || !token) return undefined;

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | null = null;
    let attempt = 0;

    const connect = () => {
      if (disposed) return;
      const currentSocket = new WebSocket(REALTIME_URL);
      socket = currentSocket;
      currentSocket.onopen = () => {
        if (disposed) return currentSocket.close();
        currentSocket.send(JSON.stringify({ type: 'auth', scope: 'user', token }));
      };
      currentSocket.onmessage = (event) => {
        let packet: { type?: string; data?: Notification };
        try {
          packet = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (packet.type === 'ready') {
          attempt = 0;
          return;
        }
        if (packet.type === 'notification' && packet.data) {
          onNotificationRef.current(packet.data);
        }
      };
      currentSocket.onerror = () => currentSocket.close();
      currentSocket.onclose = (event) => {
        if (disposed) return;
        if (event.code === 4401) return;
        attempt += 1;
        retryTimer = setTimeout(connect, Math.min(1000 * (2 ** Math.min(attempt, 4)), 12000));
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [enabled, token]);
}
