import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Member, Message, Task } from '../web/lib/api';
import { REALTIME_URL } from '../config/api';

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export function useGroupRealtime({
  enabled,
  trackMessages,
  groupId,
  token,
  userId,
  lastMessageId,
  onMessage,
  onMessageUpdated,
  onMessageDeleted,
  onTasks,
  onMembers,
}: {
  enabled: boolean;
  trackMessages: boolean;
  groupId: number;
  token: string;
  userId: number;
  lastMessageId: MutableRefObject<number>;
  onMessage: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: number) => void;
  onTasks?: (tasks: Task[]) => void;
  onMembers?: (members: Member[]) => void;
}) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const [readByUser, setReadByUser] = useState<Record<number, { messageId: number; name: string }>>({});
  const socketRef = useRef<WebSocket | null>(null);
  // The server only reads trackMessages during the auth handshake, so it must
  // not be an effect dependency: doing so tore the socket down on every
  // Tasks/Chat/Members switch and reset presence, typing and read state.
  const trackMessagesRef = useRef(trackMessages);
  useEffect(() => { trackMessagesRef.current = trackMessages; }, [trackMessages]);
  const onMessageRef = useRef(onMessage);
  const onMessageUpdatedRef = useRef(onMessageUpdated);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onTasksRef = useRef(onTasks);
  const onMembersRef = useRef(onMembers);
  const typingTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onMessageUpdatedRef.current = onMessageUpdated; }, [onMessageUpdated]);
  useEffect(() => { onMessageDeletedRef.current = onMessageDeleted; }, [onMessageDeleted]);
  useEffect(() => { onTasksRef.current = onTasks; }, [onTasks]);
  useEffect(() => { onMembersRef.current = onMembers; }, [onMembers]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let socket: WebSocket | null = null;
    const activeTypingTimers = typingTimers.current;

    const connect = () => {
      if (disposed) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      const currentSocket = new WebSocket(REALTIME_URL);
      socket = currentSocket;
      socketRef.current = currentSocket;
      currentSocket.onopen = () => {
        if (disposed) return currentSocket.close();
        currentSocket.send(JSON.stringify({ type: 'auth', token, groupId, trackMessages: trackMessagesRef.current, lastMessageId: lastMessageId.current }));
      };
      currentSocket.onmessage = (event) => {
        let packet: { type?: string; data?: unknown; userId?: number; name?: string; online?: boolean; onlineUserIds?: number[]; active?: boolean; messageId?: number; reads?: { userId: number; messageId: number; name: string }[] };
        try { packet = JSON.parse(String(event.data)); } catch { return; }
        if (packet.type === 'ready') {
          attempt = 0;
          setStatus('connected');
          setOnlineUserIds(packet.onlineUserIds ?? []);
          setReadByUser(Object.fromEntries((packet.reads ?? []).map((item) => [item.userId, { messageId: item.messageId, name: item.name }])));
        } else if (packet.type === 'message' && packet.data && typeof packet.data === 'object' && !Array.isArray(packet.data)) {
          const message = packet.data as Message;
          lastMessageId.current = Math.max(lastMessageId.current, message.id);
          onMessageRef.current(message);
        } else if (packet.type === 'message_updated' && packet.data && typeof packet.data === 'object' && !Array.isArray(packet.data)) {
          onMessageUpdatedRef.current?.(packet.data as Message);
        } else if (packet.type === 'message_deleted' && packet.messageId) {
          onMessageDeletedRef.current?.(packet.messageId);
        } else if (packet.type === 'tasks' && Array.isArray(packet.data)) {
          onTasksRef.current?.(packet.data as Task[]);
        } else if (packet.type === 'members' && Array.isArray(packet.data)) {
          onMembersRef.current?.(packet.data as Member[]);
        } else if (packet.type === 'presence' && packet.userId) {
          setOnlineUserIds((current) => packet.online
            ? current.includes(packet.userId!) ? current : [...current, packet.userId!]
            : current.filter((id) => id !== packet.userId));
        } else if (packet.type === 'typing' && packet.userId && packet.userId !== userId) {
          const id = packet.userId;
          const timer = activeTypingTimers.get(id);
          if (timer) clearTimeout(timer);
          if (packet.active) {
            setTypingUsers((current) => ({ ...current, [id]: packet.name ?? 'Thành viên' }));
            activeTypingTimers.set(id, setTimeout(() => {
              setTypingUsers((current) => { const next = { ...current }; delete next[id]; return next; });
              activeTypingTimers.delete(id);
            }, 3000));
          } else {
            setTypingUsers((current) => { const next = { ...current }; delete next[id]; return next; });
            activeTypingTimers.delete(id);
          }
        } else if (packet.type === 'read' && packet.userId && packet.messageId) {
          setReadByUser((current) => ({ ...current, [packet.userId!]: { messageId: packet.messageId!, name: packet.name ?? 'Thành viên' } }));
        }
      };
      currentSocket.onerror = () => currentSocket.close();
      currentSocket.onclose = (event) => {
        if (socketRef.current === currentSocket) socketRef.current = null;
        setOnlineUserIds([]);
        if (disposed) return;
        if (event.code === 4401) { setStatus('offline'); return; }
        setStatus('reconnecting');
        attempt += 1;
        retryTimer = setTimeout(connect, Math.min(1000 * (2 ** Math.min(attempt, 4)), 12000));
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      for (const timer of activeTypingTimers.values()) clearTimeout(timer);
      activeTypingTimers.clear();
      socketRef.current = null;
      socket?.close();
      setOnlineUserIds([]);
      setTypingUsers({});
      setReadByUser({});
    };
  }, [enabled, groupId, token, userId, lastMessageId]);

  const sendTyping = useCallback((active: boolean) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'typing', active }));
  }, []);

  const sendRead = useCallback((messageId: number) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && messageId > 0) socket.send(JSON.stringify({ type: 'read', messageId }));
  }, []);

  return { status, onlineUserIds, typingUsers, readByUser, sendTyping, sendRead };
}
