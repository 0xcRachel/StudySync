/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "./api";
import { useLenis, useScreenMotion } from "./motion";
import { useNativeToast } from "./Toast";
import { useGroupRealtime } from "../lib/useGroupRealtime";

type Screen = "home" | "group" | "friends" | "notifications" | "profile";
const C = {
  bg: "#0B1020",
  panel: "#121A2C",
  panel2: "#19233A",
  ink: "#F7F8FC",
  muted: "#9BA7BF",
  line: "#27334D",
  blue: "#7C8CFF",
  cyan: "#67E8F9",
  pink: "#F0ABFC",
  green: "#7BE0B1",
  red: "#FF8C9D",
  white: "#FFFFFF",
};
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
const statusLabel = { todo: "Cần làm", doing: "Đang làm", done: "Hoàn thành" };

function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}
function Button({
  title,
  onPress,
  secondary = false,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        compact && styles.buttonCompact,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.buttonText, secondary && styles.buttonTextSecondary]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function AuthScreen({
  onAuth,
}: {
  onAuth: (data: { token: string; user: api.User }) => void;
}) {
  const toast = useNativeToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      toast("Nhập email và mật khẩu tối thiểu 8 ký tự.", "error");
      return;
    }
    if (mode === "register" && name.trim().length < 2) {
      toast("Nhập tên hiển thị (ít nhất 2 ký tự).", "error");
      return;
    }
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(name, email, password);
      onAuth(result);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Không thể kết nối máy chủ.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.authScreen}>
      <View style={styles.authGlow} />
      <View style={styles.authBrand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.brand}>StudySync</Text>
        <Text style={styles.brandTag}>LEARN TOGETHER</Text>
      </View>
      <View style={styles.authCard}>
        <Text style={styles.kicker}>KHÔNG GIAN HỌC TẬP</Text>
        <Text style={styles.authTitle}>
          {mode === "login" ? "Chào mừng trở lại." : "Tạo không gian của bạn."}
        </Text>
        <Text style={styles.authSub}>
          {mode === "login"
            ? "Đăng nhập để tiếp tục đồng bộ cùng nhóm."
            : "Kết nối bạn bè và học tập hiệu quả hơn."}
        </Text>
        {mode === "register" && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tên hiển thị"
            placeholderTextColor={C.muted}
            style={styles.input}
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={C.muted}
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          placeholderTextColor={C.muted}
          style={styles.input}
        />
        <Button
          title={
            loading
              ? "Đang xử lý…"
              : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"
          }
          onPress={() => void submit()}
        />
        <Pressable
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        >
          <Text style={styles.switchText}>
            {mode === "login"
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.authFoot}>DỮ LIỆU ĐƯỢC ĐỒNG BỘ QUA MYSQL</Text>
    </SafeAreaView>
  );
}

function HomeScreen({
  user,
  groups,
  onRefresh,
  onOpenGroup,
  onCreate,
}: {
  user: api.User;
  groups: api.Group[];
  onRefresh: () => void;
  onOpenGroup: (group: api.Group) => void;
  onCreate: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const totalTasks = groups.reduce(
    (sum, group) => sum + Number(group.task_count || 0),
    0,
  );
  const doneTasks = groups.reduce(
    (sum, group) => sum + Number(group.completed_count || 0),
    0,
  );
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, wide && styles.contentWide]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.mutedUpper}>THỨ BẢY · 24 THÁNG 10</Text>
          <Text style={styles.greeting}>
            Xin chào, {user.name.split(" ")[0]}{" "}
            <Text style={{ color: C.pink }}>✦</Text>
          </Text>
        </View>
        <Avatar name={user.name} />
      </View>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroKicker}>STUDYSYNC SPACE</Text>
          <Text style={styles.heroTitle}>Học cùng nhau,{"\n"}tiến xa hơn.</Text>
          <Text style={styles.heroDesc}>
            Một nơi cho nhóm của bạn tập trung, chia sẻ và hoàn thành mục tiêu.
          </Text>
        </View>
        <Text style={styles.heroOrb}>◒</Text>
      </View>
      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{groups.length}</Text>
          <Text style={styles.statLabel}>Nhóm học tập</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalTasks}</Text>
          <Text style={styles.statLabel}>Công việc</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: C.green }]}>
            {doneTasks}
          </Text>
          <Text style={styles.statLabel}>Đã xong</Text>
        </View>
      </View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Không gian của bạn</Text>
        <Pressable onPress={onCreate}>
          <Text style={styles.link}>+ Tạo nhóm</Text>
        </Pressable>
      </View>
      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⌁</Text>
          <Text style={styles.emptyTitle}>Bắt đầu không gian đầu tiên</Text>
          <Text style={styles.pageSubtitle}>
            Tạo nhóm để mời bạn bè cùng học.
          </Text>
          <Button title="Tạo nhóm mới" onPress={onCreate} compact />
        </View>
      ) : (
        groups.map((group, index) => (
          <Pressable
            key={group.id}
            onPress={() => onOpenGroup(group)}
            style={({ pressed }) => [
              styles.groupCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.groupIcon,
                { backgroundColor: index % 2 ? "#2D2546" : "#202A53" },
              ]}
            >
              <Text style={styles.groupIconText}>
                {String(group.id).padStart(2, "0")}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.pageSubtitle}>
                {group.task_count || 0} công việc · {group.completed_count || 0}{" "}
                hoàn thành
              </Text>
              <View style={styles.progress}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${group.task_count ? Math.min(100, ((group.completed_count || 0) / group.task_count) * 100) : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      )}
      <Pressable onPress={onRefresh} style={styles.refresh}>
        <Text style={styles.pageSubtitle}>↻ Làm mới dữ liệu</Text>
      </Pressable>
    </ScrollView>
  );
}

function GroupScreen({
  group,
  token,
  user,
  onBack,
}: {
  group: api.Group;
  token: string;
  user: api.User;
  onBack: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const toast = useNativeToast();
  const [tab, setTab] = useState<"tasks" | "chat" | "members">("tasks");
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [messages, setMessages] = useState<api.Message[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteCandidates, setInviteCandidates] = useState<
    (api.User & { invited: boolean })[]
  >([]);
  const [text, setText] = useState("");
  const [newTask, setNewTask] = useState("");
  const [taskAssignees, setTaskAssignees] = useState<number[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [showTask, setShowTask] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);
  const lastMessageId = useRef(0);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtime = useGroupRealtime({
    enabled: true,
    trackMessages: tab === "chat" && chatLoaded,
    groupId: group.id,
    token,
    userId: user.id,
    lastMessageId,
    onMessage: (message) =>
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message].slice(-100),
      ),
    onMessageUpdated: (message) =>
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? message : item)),
      ),
    onMessageDeleted: (messageId) =>
      setMessages((current) => current.filter((item) => item.id !== messageId)),
    onTasks: setTasks,
    onMembers: setMembers,
  });
  const realtimeStatus = realtime.status;
  const sendTyping = realtime.sendTyping;
  const sendRead = realtime.sendRead;
  const load = useCallback(async () => {
    try {
      if (tab === "tasks") {
        const [nextTasks, nextMembers] = await Promise.all([
          api.getTasks(group.id, token),
          api.getMembers(group.id, token),
        ]);
        setTasks(nextTasks);
        setMembers(nextMembers);
      }
      if (tab === "chat") {
        const next = await api.getMessages(group.id, token);
        setMessages(next);
        lastMessageId.current = next.reduce(
          (latest, message) => Math.max(latest, message.id),
          0,
        );
        setChatLoaded(true);
      }
      if (tab === "members") {
        const [nextMembers, candidates] = await Promise.all([
          api.getMembers(group.id, token),
          api.getInviteCandidates(group.id, token).catch(() => []),
        ]);
        setMembers(nextMembers);
        setInviteCandidates(candidates);
      }
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Không tải được dữ liệu.",
        "error",
      );
    }
  }, [group.id, tab, token, toast]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (tab === "chat") return undefined;
    const interval = setInterval(
      () => {
        const refresh =
          tab === "tasks"
            ? api.getTasks(group.id, token).then(setTasks)
            : api.getMembers(group.id, token).then(setMembers);
        void refresh.catch(() => undefined);
      },
      tab === "tasks" ? 3500 : 10000,
    );
    return () => clearInterval(interval);
  }, [tab, group.id, token]);
  useEffect(() => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (tab === "chat" && text.trim()) {
      sendTyping(true);
      typingTimeout.current = setTimeout(() => sendTyping(false), 1200);
    } else sendTyping(false);
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [text, tab, sendTyping]);
  useEffect(() => {
    if (tab !== "chat") return undefined;
    const interval = setInterval(
      () => {
        void api
          .getMessages(group.id, token)
          .then((next) => {
            setMessages((current) => {
              const merged = new Map(
                current.map((message) => [message.id, message]),
              );
              next.forEach((message) =>
                merged.set(message.id, {
                  ...merged.get(message.id),
                  ...message,
                }),
              );
              return [...merged.values()]
                .sort((a, b) => a.id - b.id)
                .slice(-100);
            });
            lastMessageId.current = Math.max(
              lastMessageId.current,
              ...next.map((message) => message.id),
            );
          })
          .catch(() => undefined);
      },
      realtimeStatus === "connected" ? 8000 : 1800,
    );
    return () => clearInterval(interval);
  }, [tab, group.id, token, realtimeStatus]);
  useEffect(() => {
    if (tab === "chat" && realtimeStatus === "connected" && messages.length)
      sendRead(messages[messages.length - 1].id);
  }, [tab, realtimeStatus, messages, sendRead]);
  const addTask = async () => {
    if (!newTask.trim()) {
      toast("Nhập tên công việc trước khi tạo.", "error");
      return;
    }
    try {
      await api.createTask(group.id, newTask.trim(), token, taskAssignees);
      setNewTask("");
      setTaskAssignees([]);
      setShowTask(false);
      await load();
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Không thể tạo công việc.",
        "error",
      );
    }
  };
  const send = async () => {
    if (!text.trim()) return;
    try {
      if (editingMessageId) {
        await api.editMessage(editingMessageId, text.trim(), token);
        setMessages((current) =>
          current.map((item) =>
            item.id === editingMessageId
              ? {
                  ...item,
                  body: text.trim(),
                  edited_at: new Date().toISOString(),
                }
              : item,
          ),
        );
        setEditingMessageId(null);
      } else {
        const created = await api.sendMessage(group.id, text.trim(), token);
        lastMessageId.current = Math.max(lastMessageId.current, created.id);
        setMessages((current) =>
          current.some((item) => item.id === created.id)
            ? current
            : [...current, created].slice(-100),
        );
      }
      setText("");
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Không thể gửi tin nhắn.",
        "error",
      );
    }
  };
  const react = async (message: api.Message) => {
    try {
      const result = await api.reactMessage(message.id, "❤️", token);
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, reactions: result.reactions }
            : item,
        ),
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Không thể thả cảm xúc.", "error");
    }
  };
  const removeMessage = async (message: api.Message) => {
    try {
      await api.deleteMessage(message.id, token);
      setMessages((current) =>
        current.filter((item) => item.id !== message.id),
      );
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Không thể xoá tin nhắn.",
        "error",
      );
    }
  };
  const inviteFriend = async (person: api.User & { invited: boolean }) => {
    try {
      await api.inviteMember(group.id, person.id, token);
      setInviteCandidates((current) =>
        current.map((item) =>
          item.id === person.id ? { ...item, invited: true } : item,
        ),
      );
      toast(`Đã mời ${person.name}.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Không thể gửi lời mời.", "error");
    }
  };
  const cycle = async (task: api.Task) => {
    const next =
      task.status === "todo"
        ? "doing"
        : task.status === "doing"
          ? "done"
          : "todo";
    try {
      const updated = await api.updateTask(task, next, token);
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? updated : item)),
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Không thể cập nhật.", "error");
    }
  };
  return (
    <SafeAreaView style={styles.appScreen}>
      <View style={styles.innerHeader}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.mutedUpper}>STUDY SPACE</Text>
          <Text style={styles.headerTitle}>{group.name}</Text>
        </View>
        <Avatar name={user.name} size={36} />
      </View>
      <View style={styles.groupHero}>
        <View style={styles.groupIconLarge}>
          <Text style={styles.groupIconText}>
            {String(group.id).padStart(2, "0")}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.groupHeroTitle}>{group.name}</Text>
          <Text style={styles.pageSubtitle}>
            {group.task_count || 0} công việc · Không gian riêng của nhóm
          </Text>
        </View>
      </View>
      <View style={styles.tabs}>
        {(["tasks", "chat", "members"] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {key === "tasks"
                ? "Công việc"
                : key === "chat"
                  ? "Phòng chat"
                  : "Thành viên"}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "tasks" && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, wide && styles.contentWide]}
        >
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Bảng tiến độ</Text>
            <Button
              title="+ Công việc"
              compact
              onPress={() => setShowTask(true)}
            />
          </View>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View
                style={[
                  styles.taskDot,
                  {
                    backgroundColor:
                      task.status === "done"
                        ? C.green
                        : task.status === "doing"
                          ? C.blue
                          : C.pink,
                  },
                ]}
              />
              <View style={styles.flex}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.pageSubtitle}>
                  {statusLabel[task.status]}
                  {task.assignees?.length
                    ? ` · ${task.assignees.map((person) => person.name).join(", ")}`
                    : " · Chưa phân công"}
                </Text>
              </View>
              <Pressable onPress={() => void cycle(task)}>
                <Text style={styles.taskAction}>Đổi ›</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      {tab === "chat" && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Text style={styles.pageSubtitle}>
            {realtime.status === "connected"
              ? `● Đang kết nối · ${Math.max(0, realtime.onlineUserIds.length - (realtime.onlineUserIds.includes(user.id) ? 1 : 0))} thành viên khác trực tuyến`
              : realtime.status === "offline"
                ? "Đang đồng bộ dự phòng"
                : "Đang kết nối chat…"}
          </Text>
          {Object.keys(realtime.typingUsers).length > 0 && (
            <Text style={styles.pageSubtitle}>
              {Object.values(realtime.typingUsers).join(", ")} đang nhập…
            </Text>
          )}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.chatList}
          >
            {messages.length === 0 ? (
              <Text style={styles.pageSubtitle}>
                Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.
              </Text>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.message,
                    message.sender_id === user.id && styles.messageMine,
                  ]}
                >
                  <Text style={styles.messageSender}>
                    {message.sender_id === user.id
                      ? "Bạn"
                      : message.sender_name}
                    {message.edited_at ? " · đã sửa" : ""}
                  </Text>
                  <Text style={styles.messageBody}>{message.body}</Text>
                  {message.reactions?.length ? (
                    <Text style={styles.messageReaction}>
                      {message.reactions
                        .map((item) => `${item.emoji} ${item.count}`)
                        .join("  ")}
                    </Text>
                  ) : null}
                  <View style={styles.messageActions}>
                    <Pressable onPress={() => void react(message)}>
                      <Text style={styles.messageAction}>♡ Cảm xúc</Text>
                    </Pressable>
                    {message.sender_id === user.id ? (
                      <Pressable
                        onPress={() => {
                          setEditingMessageId(message.id);
                          setText(message.body);
                        }}
                      >
                        <Text style={styles.messageAction}>Sửa</Text>
                      </Pressable>
                    ) : null}
                    {message.sender_id === user.id ? (
                      <Pressable onPress={() => void removeMessage(message)}>
                        <Text style={[styles.messageAction, { color: C.red }]}>
                          Xoá
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={
                editingMessageId ? "Sửa tin nhắn…" : "Viết tin nhắn cho nhóm…"
              }
              placeholderTextColor={C.muted}
              style={styles.composerInput}
            />
            <Pressable onPress={() => void send()} style={styles.send}>
              <Text style={styles.sendText}>
                {editingMessageId ? "✓" : "↑"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
      {tab === "members" && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, wide && styles.contentWide]}
        >
          {inviteCandidates.length > 0 ? (
            <View style={styles.inviteCard}>
              <Text style={styles.sectionTitle}>Mời bạn bè vào nhóm</Text>
              {inviteCandidates.map((person) => (
                <View key={person.id} style={styles.member}>
                  <Avatar name={person.name} size={38} />
                  <View style={styles.flex}>
                    <Text style={styles.taskTitle}>{person.name}</Text>
                    <Text style={styles.pageSubtitle}>{person.email}</Text>
                  </View>
                  <Button
                    title={person.invited ? "Đã mời" : "Mời"}
                    secondary={person.invited}
                    compact
                    onPress={() => {
                      if (!person.invited) void inviteFriend(person);
                    }}
                  />
                </View>
              ))}
            </View>
          ) : null}
          {members.map((member) => (
            <View key={member.id} style={styles.member}>
              <Avatar name={member.name} size={38} />
              <View style={styles.flex}>
                <Text style={styles.taskTitle}>{member.name}</Text>
                <Text style={styles.pageSubtitle}>
                  {member.role} · {member.email}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <Modal visible={showTask} transparent animationType="fade">
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm công việc</Text>
            <TextInput
              value={newTask}
              onChangeText={setNewTask}
              placeholder="Ví dụ: Ôn chương 4"
              placeholderTextColor={C.muted}
              style={styles.input}
              autoFocus
            />
            <Text style={styles.pageSubtitle}>Giao cho thành viên</Text>
            <View style={styles.assigneeWrap}>
              {members.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() =>
                    setTaskAssignees((current) =>
                      current.includes(member.id)
                        ? current.filter((id) => id !== member.id)
                        : [...current, member.id],
                    )
                  }
                  style={[
                    styles.assigneeChip,
                    taskAssignees.includes(member.id) &&
                      styles.assigneeChipActive,
                  ]}
                >
                  <Text style={styles.assigneeText}>
                    {member.id === user.id ? "Tôi" : member.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalRow}>
              <Button
                title="Huỷ"
                secondary
                compact
                onPress={() => {
                  setShowTask(false);
                  setTaskAssignees([]);
                }}
              />
              <Button title="Tạo" compact onPress={() => void addTask()} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SimpleScreen({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  onBack?: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return (
    <SafeAreaView style={styles.appScreen}>
      <View style={styles.innerHeader}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.mutedUpper}>STUDYSYNC</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, wide && styles.contentWide]}
      >
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppShell() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  useLenis();
  useScreenMotion("app");
  const toast = useNativeToast();
  const [session, setSession] = useState<{
    token: string;
    user: api.User;
  } | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [activeGroup, setActiveGroup] = useState<api.Group | null>(null);
  const [groups, setGroups] = useState<api.Group[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [friends, setFriends] = useState<any>({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      setGroups(await api.getGroups(session.token));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Không tải được nhóm.", "error");
    }
  }, [session, toast]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const openFriends = async () => {
    if (!session) return;
    try {
      setFriends(await api.getFriends(session.token));
      setScreen("friends");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Không tải được bạn bè.", "error");
    }
  };
  const openNotifications = async () => {
    if (!session) return;
    try {
      setNotifications(await api.getNotifications(session.token));
      setScreen("notifications");
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Không tải được thông báo.",
        "error",
      );
    }
  };
  if (!session) return <AuthScreen onAuth={setSession} />;
  if (activeGroup && screen === "group")
    return (
      <GroupScreen
        group={activeGroup}
        token={session.token}
        user={session.user}
        onBack={() => {
          setActiveGroup(null);
          setScreen("home");
          void refresh();
        }}
      />
    );
  let content: React.ReactNode = (
    <HomeScreen
      user={session.user}
      groups={groups}
      onRefresh={() => void refresh()}
      onOpenGroup={(group) => {
        setActiveGroup(group);
        setScreen("group");
      }}
      onCreate={() => setShowCreate(true)}
    />
  );
  if (screen === "friends")
    content = (
      <SimpleScreen
        title="Bạn bè"
        subtitle="Kết nối những người cùng mục tiêu học tập."
        onBack={() => setScreen("home")}
      >
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>◎</Text>
          <Text style={styles.emptyTitle}>
            {friends.friends?.length || 0} người bạn
          </Text>
          <Text style={styles.pageSubtitle}>
            Tìm kiếm và gửi lời mời kết bạn sẽ được hiển thị tại đây.
          </Text>
        </View>
        {friends.friends?.map((friend: any) => (
          <View key={friend.id} style={styles.member}>
            <Avatar name={friend.name} />
            <View style={styles.flex}>
              <Text style={styles.taskTitle}>{friend.name}</Text>
              <Text style={styles.pageSubtitle}>{friend.email}</Text>
            </View>
          </View>
        ))}
      </SimpleScreen>
    );
  if (screen === "notifications")
    content = (
      <SimpleScreen
        title="Thông báo"
        subtitle="Mọi cập nhật quan trọng của bạn và nhóm."
      >
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>
            {notifications.length
              ? `${notifications.length} thông báo`
              : "Bạn đã cập nhật hết"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {notifications.length
              ? "Các lời mời và hoạt động mới nhất."
              : "Không có thông báo mới."}
          </Text>
        </View>
        {notifications.map((item) => (
          <View key={item.id} style={styles.notification}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.pageSubtitle}>{item.body}</Text>
          </View>
        ))}
      </SimpleScreen>
    );
  if (screen === "profile")
    content = (
      <SimpleScreen title="Hồ sơ" subtitle="Không gian cá nhân của bạn.">
        <View style={styles.profileHero}>
          <Avatar name={session.user.name} size={76} />
          <Text style={styles.profileName}>{session.user.name}</Text>
          <Text style={styles.pageSubtitle}>{session.user.email}</Text>
        </View>
        <Button
          title="Đăng xuất"
          secondary
          onPress={() => {
            setSession(null);
            setScreen("home");
          }}
        />
      </SimpleScreen>
    );
  const create = async () => {
    if (!groupName.trim()) {
      toast("Nhập tên nhóm trước khi tạo.", "error");
      return;
    }
    try {
      await api.createGroup(
        groupName.trim(),
        groupDescription.trim(),
        session.token,
      );
      setShowCreate(false);
      setGroupName("");
      setGroupDescription("");
      await refresh();
      toast("Đã tạo nhóm.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Không thể tạo nhóm.", "error");
    }
  };
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.shellRow}>
        {wide && (
          <View style={styles.sidebar}>
            <View style={styles.sideBrand}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>S</Text>
              </View>
              <Text style={styles.sideBrandText}>StudySync</Text>
            </View>
            <Pressable
              onPress={() => setScreen("home")}
              style={styles.sideItem}
            >
              <Text style={styles.sideItemText}>⌂ Tổng quan</Text>
            </Pressable>
            <Pressable
              onPress={() => void openFriends()}
              style={styles.sideItem}
            >
              <Text style={styles.sideItemText}>◌ Bạn bè</Text>
            </Pressable>
            <Pressable
              onPress={() => void openNotifications()}
              style={styles.sideItem}
            >
              <Text style={styles.sideItemText}>♢ Thông báo</Text>
            </Pressable>
            <Pressable
              onPress={() => setScreen("profile")}
              style={styles.sideItem}
            >
              <Text style={styles.sideItemText}>◉ Hồ sơ</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.flex}>
          {content}
          {!wide && (
            <View style={styles.bottomNav}>
              <Pressable onPress={() => setScreen("home")}>
                <Text
                  style={[
                    styles.navIcon,
                    screen === "home" && styles.navActive,
                  ]}
                >
                  ⌂
                </Text>
                <Text
                  style={[
                    styles.navLabel,
                    screen === "home" && styles.navActive,
                  ]}
                >
                  Tổng quan
                </Text>
              </Pressable>
              <Pressable onPress={() => void openFriends()}>
                <Text
                  style={[
                    styles.navIcon,
                    screen === "friends" && styles.navActive,
                  ]}
                >
                  ◌
                </Text>
                <Text
                  style={[
                    styles.navLabel,
                    screen === "friends" && styles.navActive,
                  ]}
                >
                  Bạn bè
                </Text>
              </Pressable>
              <Pressable onPress={() => void openNotifications()}>
                <Text
                  style={[
                    styles.navIcon,
                    screen === "notifications" && styles.navActive,
                  ]}
                >
                  ♢
                </Text>
                <Text
                  style={[
                    styles.navLabel,
                    screen === "notifications" && styles.navActive,
                  ]}
                >
                  Thông báo
                </Text>
              </Pressable>
              <Pressable onPress={() => setScreen("profile")}>
                <Text
                  style={[
                    styles.navIcon,
                    screen === "profile" && styles.navActive,
                  ]}
                >
                  ◉
                </Text>
                <Text
                  style={[
                    styles.navLabel,
                    screen === "profile" && styles.navActive,
                  ]}
                >
                  Tôi
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo không gian học tập</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Tên nhóm"
              placeholderTextColor={C.muted}
              style={styles.input}
              autoFocus
            />
            <TextInput
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholder="Mục tiêu của nhóm (tuỳ chọn)"
              placeholderTextColor={C.muted}
              style={styles.input}
            />
            <View style={styles.modalRow}>
              <Button
                title="Huỷ"
                secondary
                compact
                onPress={() => setShowCreate(false)}
              />
              <Button title="Tạo nhóm" compact onPress={() => void create()} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shellRow: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 248,
    backgroundColor: "#0F1628",
    borderRightWidth: 1,
    borderRightColor: C.line,
    padding: 24,
    gap: 10,
  },
  sideBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 34,
  },
  sideBrandText: { color: C.ink, fontSize: 20, fontWeight: "800" },
  sideItem: { paddingVertical: 15, paddingHorizontal: 14, borderRadius: 12 },
  sideItemText: { color: C.muted, fontSize: 14, fontWeight: "700" },
  contentWide: {
    maxWidth: 1120,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 38,
  },
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 22, paddingBottom: 40, gap: 16 },
  authScreen: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 24,
    justifyContent: "center",
    overflow: "hidden",
  },
  authGlow: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#242E69",
    top: -190,
    right: -120,
    opacity: 0.65,
  },
  authBrand: { alignItems: "center", marginBottom: 30 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: { color: C.white, fontSize: 28, fontWeight: "900" },
  brand: { color: C.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.8 },
  brandTag: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 6,
  },
  authCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: C.panel,
    borderRadius: 28,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  kicker: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  authTitle: {
    color: C.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
  },
  authSub: { color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 6 },
  input: {
    backgroundColor: C.panel2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    minHeight: 52,
    paddingHorizontal: 16,
    color: C.ink,
    fontSize: 15,
  },
  button: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonSecondary: {
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.line,
  },
  buttonCompact: { minHeight: 38, borderRadius: 11, paddingHorizontal: 14 },
  buttonText: { color: C.white, fontWeight: "800", fontSize: 14 },
  buttonTextSecondary: { color: C.ink },
  switchText: {
    color: C.cyan,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  authFoot: {
    color: "#63708E",
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 22,
  },
  error: { color: C.red, fontSize: 13 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mutedUpper: {
    color: C.muted,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "800",
  },
  greeting: { color: C.ink, fontSize: 27, fontWeight: "800", marginTop: 5 },
  avatar: {
    backgroundColor: "#273568",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5365B5",
  },
  avatarText: { color: C.cyan, fontWeight: "900" },
  heroCard: {
    backgroundColor: "#1D2752",
    borderRadius: 24,
    padding: 22,
    minHeight: 180,
    overflow: "hidden",
    flexDirection: "row",
  },
  heroKicker: {
    color: C.pink,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  heroTitle: {
    color: C.ink,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    marginTop: 8,
  },
  heroDesc: {
    color: "#BCC6E2",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 240,
    marginTop: 10,
  },
  heroOrb: {
    color: "#7C8CFF",
    fontSize: 110,
    position: "absolute",
    right: -4,
    bottom: -18,
    opacity: 0.5,
  },
  statRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: C.panel,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  statValue: { color: C.ink, fontSize: 24, fontWeight: "800" },
  statLabel: { color: C.muted, fontSize: 11, marginTop: 3 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sectionTitle: { color: C.ink, fontSize: 18, fontWeight: "800" },
  link: { color: C.cyan, fontSize: 13, fontWeight: "800" },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: C.panel,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: C.line,
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  groupIconLarge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#2D315F",
    alignItems: "center",
    justifyContent: "center",
  },
  groupIconText: { color: C.cyan, fontSize: 16, fontWeight: "900" },
  groupName: { color: C.ink, fontSize: 16, fontWeight: "800" },
  groupHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  groupHeroTitle: { color: C.ink, fontSize: 20, fontWeight: "800" },
  progress: {
    backgroundColor: C.panel2,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: 5, backgroundColor: C.green, borderRadius: 3 },
  chevron: { color: C.muted, fontSize: 28 },
  refresh: { alignItems: "center", padding: 8 },
  empty: {
    backgroundColor: C.panel,
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyIcon: { color: C.blue, fontSize: 40 },
  emptyTitle: { color: C.ink, fontSize: 17, fontWeight: "800" },
  appScreen: { flex: 1, backgroundColor: C.bg },
  innerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  back: { color: C.ink, fontSize: 36, lineHeight: 36 },
  headerTitle: { color: C.ink, fontSize: 18, fontWeight: "800", marginTop: 2 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: C.panel,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: C.panel2 },
  tabText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: C.ink },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  taskDot: { width: 9, height: 9, borderRadius: 5 },
  taskTitle: { color: C.ink, fontSize: 14, fontWeight: "700" },
  taskAction: { color: C.cyan, fontSize: 12, fontWeight: "800" },
  errorInline: { color: C.red, paddingHorizontal: 22, paddingBottom: 8 },
  chatList: { padding: 20, gap: 11 },
  message: {
    backgroundColor: C.panel,
    padding: 12,
    borderRadius: 16,
    maxWidth: "84%",
    borderWidth: 1,
    borderColor: C.line,
  },
  messageMine: { alignSelf: "flex-end", backgroundColor: "#26336E" },
  messageSender: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
  },
  messageBody: { color: C.ink, fontSize: 14, lineHeight: 20 },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  composerInput: {
    flex: 1,
    backgroundColor: C.panel,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: C.ink,
    minHeight: 46,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: C.white, fontSize: 22, fontWeight: "800" },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.panel,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  pageSubtitle: { color: C.muted, fontSize: 14, lineHeight: 21 },
  notification: {
    backgroundColor: C.panel,
    padding: 16,
    borderRadius: 16,
    gap: 5,
  },
  profileHero: { alignItems: "center", gap: 8, paddingVertical: 20 },
  profileName: { color: C.ink, fontSize: 22, fontWeight: "800" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#0F1628",
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 10,
    paddingBottom: 8,
  },
  navIcon: { color: C.muted, fontSize: 21, textAlign: "center" },
  navLabel: { color: C.muted, fontSize: 10, marginTop: 2 },
  navActive: { color: C.cyan },
  modalBack: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.65)",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    backgroundColor: C.panel,
    borderRadius: 24,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  modalTitle: { color: C.ink, fontSize: 20, fontWeight: "800" },
  modalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  messageActions: { flexDirection: "row", gap: 14, marginTop: 8 },
  messageAction: { color: C.cyan, fontSize: 11, fontWeight: "700" },
  messageReaction: { color: C.ink, fontSize: 12, marginTop: 6 },
  inviteCard: {
    backgroundColor: "#172139",
    borderRadius: 18,
    padding: 14,
    gap: 9,
    borderWidth: 1,
    borderColor: C.line,
  },
  assigneeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  assigneeChip: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.panel2,
  },
  assigneeChipActive: { borderColor: C.cyan, backgroundColor: "#26336E" },
  assigneeText: { color: C.ink, fontSize: 12, fontWeight: "700" },
  pressed: { opacity: 0.78 },
});
