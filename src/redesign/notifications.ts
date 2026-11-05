import * as Notifications from 'expo-notifications';

let configured = false;

/**
 * Expo Go cảnh báo "not fully supported" trên iOS vì push REMOTE bị bỏ, còn
 * thông báo cục bộ vẫn hoạt động. Không có Apple Developer account + EAS build
 * thì đây là cách duy nhất để máy chạy được thông báo.
 */
export function configureNotifications(): void {
  if (configured) return;
  configured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    void Notifications.requestPermissionsAsync().catch(() => undefined);
  } catch {
    /* quyền bị từ chối hoặc bản Expo Go cũ: app vẫn phải chạy được */
  }
}

export function notifyIncomingMessage(senderName: string, groupName: string, body: string): void {
  try {
    void Notifications.scheduleNotificationAsync({
      content: {
        title: `${senderName} · ${groupName}`,
        body: body.trim() === '' ? 'Một hình ảnh' : body,
        sound: true,
      },
      trigger: null,
    }).catch(() => undefined);
  } catch {
    /* bỏ qua: thông báo không được hỗ trợ trên thiết bị này */
  }
}
