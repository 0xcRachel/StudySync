import { Platform } from 'react-native';

/**
 * Cấu hình API duy nhất của frontend.
 *
 * Ưu tiên biến môi trường EXPO_PUBLIC_API_BASE_URL (xem .env.example).
 * Khi không có biến môi trường, dùng địa chỉ của PHP built-in server
 * (npm run api, cổng 8080):
 * - Android Emulator: 10.0.2.2 (địa chỉ máy host)
 * - iOS Simulator / Web: localhost
 *
 * Điện thoại thật BẮT BUỘC đặt EXPO_PUBLIC_API_BASE_URL thành IP LAN của
 * máy chạy PHP, ví dụ http://192.168.1.20:8080.
 * Nếu dùng XAMPP, URL thường có dạng http://192.168.1.20/studysync_api.
 */
const DEFAULT_DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEFAULT_DEV_PORT = '8080';

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const configuredWebBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL_WEB?.trim();

/**
 * EXPO_PUBLIC_API_BASE_URL là địa chỉ cho ĐIỆN THOẠI thật, nên nó thường mang
 * IP LAN. Trình duyệt chạy trên chính máy đó và luôn gọi được localhost, còn IP
 * LAN thì đổi mỗi lần chuyển mạng — một file .env cũ sẽ làm web app timeout âm
 * thầm. Vì vậy web bỏ qua IP LAN trừ khi được khai báo rõ ràng.
 */
export const API_BASE_URL = normalizeBaseUrl(
  Platform.OS === 'web'
    ? configuredWebBaseUrl || `http://localhost:${DEFAULT_DEV_PORT}`
    : configuredBaseUrl || `http://${DEFAULT_DEV_HOST}:${DEFAULT_DEV_PORT}`,
);

const realtimeUrl = new URL(API_BASE_URL);
realtimeUrl.protocol = realtimeUrl.protocol === 'https:' ? 'wss:' : 'ws:';
realtimeUrl.port = process.env.EXPO_PUBLIC_REALTIME_PORT?.trim() || '8090';
realtimeUrl.pathname = '/';
realtimeUrl.search = '';
realtimeUrl.hash = '';
export const REALTIME_URL = realtimeUrl.toString().replace(/\/$/, '');

export const API_BASE_URL_IS_CONFIGURED = Boolean(
  Platform.OS === 'web' ? configuredWebBaseUrl : configuredBaseUrl,
);

const configuredTimeout = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);

export const API_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout >= 1000
    ? configuredTimeout
    : 15000;

/**
 * Backend hỗ trợ cả JSON và form-urlencoded. Mặc định dùng JSON.
 * Chỉ đổi sang "form" khi phải gọi một backend cũ chỉ đọc $_POST.
 * Hỗ trợ cả tên biến mới và tên cũ để không phá cấu hình đang có.
 */
const configuredBodyFormat =
  process.env.EXPO_PUBLIC_API_REQUEST_FORMAT ??
  process.env.EXPO_PUBLIC_API_CREATE_TASK_FORMAT;

export const API_REQUEST_BODY_FORMAT: 'json' | 'form' =
  configuredBodyFormat === 'form' ? 'form' : 'json';
