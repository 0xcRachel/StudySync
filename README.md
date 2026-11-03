# StudySync — Mobile Study Project Management

Ứng dụng quản lý nhóm học tập dành cho sinh viên. Frontend React Native (Expo + TypeScript), backend PHP + PDO và MySQL trên Laragon/phpMyAdmin.

Người dùng tải nhóm từ MySQL → xem thống kê → tạo/xoá nhóm → quản lý công việc → lọc theo trạng thái → đổi trạng thái hoặc xoá công việc. Mọi thay đổi đều được lưu thật vào database.

---

## 1. Kiến trúc

```text
Ứng dụng React Native (Expo)
        │  fetch + JSON
        ▼
PHP API (backend/)
  get_tasks.php · create_task.php · update_task_status.php · health.php
        │  PDO prepared statements
        ▼
SQLite (mặc định) hoặc MySQL (XAMPP/Laragon)
```

| Thành phần | Công nghệ |
| --- | --- |
| Mobile app | React Native 0.88, Expo SDK 58, TypeScript |
| Điều hướng | React Navigation 7 — Native Stack |
| Hướng dẫn web | Driver.js — tour tương tác, có thể mở lại |
| Danh sách | `FlatList`, `RefreshControl` |
| Backend | PHP 8.1+, PDO |
| Database | SQLite 3 (mặc định) hoặc MySQL 5.7+/8.x |
| Kiểm thử API | Node.js script gọi HTTP thật |

---

## 2. Yêu cầu môi trường

- **Node.js >= 22.13** (Expo SDK 58 không hỗ trợ Node 22.12 trở xuống). Khuyến nghị Node 22 LTS mới nhất hoặc Node 24 LTS.
- **PHP >= 8.1** với extension `pdo_sqlite` (mặc định) hoặc `pdo_mysql` (khi dùng MySQL).
- npm.
- Expo Go trên điện thoại, Android Emulator, iOS Simulator hoặc trình duyệt.

Kiểm tra nhanh:

```bash
node -v
php -v
php -m
```

> Máy hiện tại đang dùng Node 22.12.0. Hãy nâng cấp Node trước khi chạy Expo CLI. `.nvmrc` đã ghim `22.13.0`.

---

## 3. Chạy nhanh (SQLite — không cần cài MySQL)

```bash
cd D:\StudySync
npm install
```

Mở **hai terminal** tại thư mục dự án:

```bash
# Terminal 1 — backend tại http://localhost:8080
npm run api

# Terminal 2 — Web (http://localhost:19006)
npm run web
```

Sau đó chọn:

```bash
npm run android   # Android Emulator / thiết bị Android
npm run ios       # iOS Simulator (macOS)
npm run web       # trình duyệt tại http://localhost:19006
```

Không cần tạo `.env` nếu chạy Android Emulator hoặc Web: frontend mặc định gọi:

- Android Emulator: `http://10.0.2.2:8080`
- iOS Simulator / Web: `http://localhost:8080`

Kiểm tra backend:

```bash
curl http://localhost:8080/health.php
```

Kết quả mong đợi:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "driver": "sqlite",
    "php_version": "8.4.0",
    "server_time": "..."
  }
}
```

Lần chạy đầu tiên, backend tự tạo `backend/storage/data/studysync.sqlite`. Tài khoản mới bắt đầu với danh sách nhóm trống; hãy tự tạo nhóm hoặc nhận lời mời để tham gia.

### Chạy trên điện thoại thật

Điện thoại và máy tính phải cùng Wi-Fi/LAN. Tạo `.env` từ mẫu:

```powershell
copy .env.example .env
```

Sửa:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8080
```

Thay `192.168.1.20` bằng IP LAN của máy chạy PHP (`ipconfig` trên Windows). Khởi động lại Expo sau khi sửa `.env`.

Đảm bảo firewall cho phép cổng 8080 và 8090, backend lắng nghe trên `0.0.0.0` (lệnh `npm run api` đã cấu hình sẵn).

---

## 4. Cấu hình frontend — một nơi duy nhất

File: `src/config/api.ts`, đọc từ `.env` ở thư mục gốc.

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `http://10.0.2.2:8080` (Android), `http://localhost:8080` (iOS/Web) | URL gốc của PHP API |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | `15000` | Timeout mỗi request |
| `EXPO_PUBLIC_API_REQUEST_FORMAT` | `json` | `json` hoặc `form` nếu backend cũ chỉ đọc `$_POST` |

Không có IP server rải rác trong component. Sau khi đổi `.env`, phải khởi động lại Expo vì `EXPO_PUBLIC_*` được đọc lúc khởi động.

---

## 5. Backend và database

### 5.1 SQLite (mặc định)

- File: `backend/storage/data/studysync.sqlite`.
- Tự tạo bảng và dữ liệu mẫu ở request đầu tiên.
- Reset dữ liệu: dừng API, xoá file SQLite, chạy lại `npm run api`.
- Phù hợp nộp bài/demo vì không cần cài MySQL.

### 5.2 MySQL / XAMPP

1. Trong Laragon, bật **Apache** và **MySQL**; tạo database `studysync` bằng phpMyAdmin.
2. Import `backend/database/schema.mysql.sql` nếu đây là database mới. Nếu đang dùng database có dữ liệu thì không import lại; backend tự chạy migration idempotent.
3. Kiểm tra `backend/.env` (file có sẵn được giữ nguyên) có cấu hình:

```dotenv
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=studysync
DB_USER=root
DB_PASSWORD=
DB_CHARSET=utf8mb4
CORS_ALLOWED_ORIGINS=*
```

4. Chạy `npm run api` ở terminal riêng. Lệnh này khởi động PHP API tại `http://localhost:8080` và WebSocket real-time tại cổng `8090`, tự đọc `backend/.env`. Real-time push yêu cầu `DB_DRIVER=mysql`; SQLite vẫn dùng cơ chế đồng bộ dự phòng.
5. Chạy frontend web ở terminal khác bằng `npm run web`, rồi mở `http://localhost:19006`.
6. Trỏ frontend vào backend nếu chạy trên điện thoại thật:

```dotenv
# Android Emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2/studysync_api

# Điện thoại thật
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20/studysync_api
```

Ghi chú:

- Nếu Apache báo 403 với `.htaccess`, bật `AllowOverride All` cho thư mục `htdocs` trong `httpd.conf`.
- Không commit `backend/.env` hoặc file database.

### 5.3 Cấu hình backend

Xem `backend/.env.example`. Biến môi trường hệ thống được ưu tiên hơn file `.env`.

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `DB_DRIVER` | `sqlite` | `sqlite` hoặc `mysql` |
| `DB_SQLITE_PATH` | `backend/storage/data/studysync.sqlite` | Vị trí file SQLite |
| `SEED_DEMO_DATA` | không còn sử dụng | Không tạo nhóm/task demo toàn cục |
| `CORS_ALLOWED_ORIGINS` | `*` | `*` hoặc danh sách origin, phân tách bằng dấu phẩy |

---

## 6. API contract đã triển khai và kiểm thử

Base URL mặc định: `http://localhost:8080`.

### 6.1 Lấy danh sách task

```http
GET /get_tasks.php?group_id=1
Accept: application/json
Authorization: Bearer <token>
```

Nhóm mới không có dữ liệu mẫu toàn cục. Hãy đăng nhập, tạo nhóm hoặc chấp nhận lời mời trước khi lấy task; tài khoản chỉ truy cập nhóm mà mình là thành viên.

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "group_id": 1,
      "title": "Khảo sát yêu cầu người dùng",
      "status": "done",
      "created_at": "2026-10-24 08:00:00",
      "updated_at": "2026-10-24 08:00:00"
    }
  ],
  "meta": { "group_id": 1, "total": 1 }
}
```

Lỗi: `401` khi chưa đăng nhập, `403` khi không thuộc nhóm, `422` khi thiếu/sai `group_id`, `405` khi sai method.

### 6.2 Tạo task

```http
POST /create_task.php
Content-Type: application/json
Authorization: Bearer <token>

{ "group_id": 1, "title": "Ôn tập chương 4" }
```

Response `201`:

```json
{
  "success": true,
  "message": "Tạo công việc thành công.",
  "data": {
    "id": 4,
    "group_id": 1,
    "title": "Ôn tập chương 4",
    "status": "todo",
    "created_at": "2026-10-24 08:05:00",
    "updated_at": "2026-10-24 08:05:00"
  }
}
```

Backend cũng nhận `application/x-www-form-urlencoded`. Lỗi: `400` JSON sai, `404` nhóm không tồn tại, `422` title rỗng/quá 120 ký tự, `405` sai method.

### 6.3 Cập nhật trạng thái

```http
POST /update_task_status.php
Content-Type: application/json
Authorization: Bearer <token>

{ "id": 4, "group_id": 1, "status": "doing" }
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công.",
  "data": {
    "id": 4,
    "group_id": 1,
    "title": "Ôn tập chương 4",
    "status": "doing",
    "created_at": "2026-10-24 08:05:00",
    "updated_at": "2026-10-24 08:10:00"
  }
}
```

Chỉ nhận `todo`, `doing`, `done`. Lỗi `404` nếu task không tồn tại hoặc không thuộc nhóm; `422` nếu trạng thái không hợp lệ. Hỗ trợ cả `PATCH`.

### 6.4 Health check

```http
GET /health.php
```

Trả trạng thái kết nối database, driver đang dùng và phiên bản PHP.

### 6.5 Quy ước lỗi

Mọi lỗi đều là JSON, không trả HTML/PHP warning:

```json
{ "success": false, "message": "Thông báo tiếng Việt an toàn." }
```

Frontend phân loại lỗi mạng, timeout, HTTP, JSON không hợp lệ và hiển thị thông báo tiếng Việt tương ứng.

---

## 7. Hành vi frontend

### 7.1 Màn hình chọn nhóm

- App mở tại `GroupScreen`, không yêu cầu đăng nhập.
- Danh sách nhóm được tải từ `list_groups.php`, kèm số lượng công việc và số việc đã hoàn thành.
- Nút `+ Tạo nhóm` ghi nhóm mới vào MySQL; nhấn giữ card để xoá nhóm và dữ liệu liên quan.
- Chạm card → `TaskBoardScreen` với ID và tên nhóm nhận từ API.

### 7.2 Bảng công việc

- Lấy `group_id` từ route params, không hardcode trong API call.
- `useFocusEffect` tải lại mỗi khi màn hình được focus, gồm lần đầu và sau khi đóng modal.
- Request cũ bị abort khi rời màn hình; response cũ không ghi đè state mới.
- Loading lần đầu, lỗi + `Thử lại`, empty state, pull-to-refresh.
- Lỗi refresh không xoá danh sách đang có.
- `FlatList` với key ổn định theo `task.id`.
- Chip lọc `Tất cả / Cần làm / Đang làm / Hoàn thành` lọc local, không gọi API.
- FAB `+` mở modal, truyền đúng `group_id`, có safe area và padding tránh bị che.

### 7.3 Đổi trạng thái — lưu thật lên server

Vòng trạng thái: `Cần làm → Đang làm → Hoàn thành → Cần làm`.

1. UI đổi ngay (optimistic).
2. Gọi `POST /update_task_status.php` với `id`, `group_id`, `status`.
3. Nút của task đang gửi bị khoá, hiện “Đang lưu…”.
4. Thành công: giữ trạng thái mới, đồng bộ lại object task từ response.
5. Thất bại: **rollback** trạng thái trước đó, hiện banner lỗi tiếng Việt.
6. Khi tải lại màn hình, trạng thái được đọc lại từ database.

Không còn thông báo “chỉ lưu tạm trên thiết bị” vì trạng thái đã được persist thật.

### 7.4 Tạo công việc

- Modal `presentation: 'modal'`.
- `title.trim()` trước khi gửi; rỗng/chỉ khoảng trắng bị chặn, không gọi API.
- Nút submit bị khoá và hiện “Đang tạo…” khi đang gửi.
- Thành công: đóng modal; Task Board tự GET lại khi focus.
- Thất bại: giữ modal, giữ nguyên input, mở khoá nút, hiện lỗi để thử lại.
- Backend chỉ được coi là thành công khi HTTP 2xx, body JSON hợp lệ và không có `success: false`.

---

## 8. Cấu trúc thư mục

```text
D:\StudySync
├── App.tsx
├── index.ts
├── .env.example
├── src/
│   ├── config/api.ts                 # URL, timeout, định dạng body
│   ├── navigation/                   # Native Stack 3 route + typed params
│   ├── screens/
│   │   ├── GroupScreen.tsx
│   │   ├── TaskBoardScreen.tsx
│   │   └── CreateTaskModal.tsx
│   ├── components/                   # TaskItem, GroupCard, FAB, banner, states…
│   ├── services/
│   │   ├── httpClient.ts             # fetch + timeout + phân loại lỗi
│   │   └── taskService.ts            # getTasks, createTask, updateTaskStatus
│   ├── domain/taskStatus.ts          # nhãn + vòng trạng thái
│   ├── data/groups.ts                # mock nhóm ID 1
│   ├── theme/                        # màu, spacing, typography
│   ├── types/task.ts
│   └── utils/errorMessages.ts        # thông báo tiếng Việt an toàn
└── backend/
    ├── api/                          # auth, chat, groups, tasks, social, ...
    ├── core/                         # bootstrap, auth, config, PDO, helpers
    ├── database/schema.mysql.sql     # schema import bằng phpMyAdmin
    ├── migrations/                   # migration bổ sung
    ├── storage/                      # SQLite và ảnh chat runtime
    ├── tests/api_test.mjs
    ├── router.php                    # giữ URL API cũ, route vào api/<domain>
    ├── .env.example
    └── README.md
```

---

## 9. Kiểm tra

```bash
# API: 22 test HTTP với database tạm, gồm kiểm tra tách quyền giữa hai tài khoản
npm run test:api

# Frontend
npm run typecheck
npm run lint

# Bundle web
npx expo export --platform web

# Kiểm tra Expo
npx expo-doctor
```

Kết quả đã chạy:

- `npm run test:api`: **22/22 đạt** — đăng ký, nhóm mới rỗng, quyền riêng tư giữa hai tài khoản, tạo nhóm trùng tên độc lập, task, validation, CORS và chặn file nội bộ.
- `npm run typecheck`: không lỗi TypeScript.
- `npm run lint`: không lỗi/warning ESLint.
- `npx expo export --platform web`: bundle thành công.
- `npx expo-doctor`: 20/20 check đạt.
- Kiểm thử thủ công trên Expo Web kích thước mobile với backend thật: tải danh sách, tạo task, đóng modal, task mới xuất hiện; đổi trạng thái, tải lại trang vẫn giữ trạng thái; ngắt backend để kiểm tra lỗi/rollback.

### Kiểm tra thủ công đề nghị

1. Chạy `npm run api` và `npm start`, mở app.
2. Chọn nhóm mặc định → thấy danh sách task.
3. Tắt API → tải lại → thấy lỗi kết nối + `Thử lại`; bật API → tải lại thành công.
4. FAB → submit rỗng/khoảng trắng → không có request, lỗi inline.
5. Tạo task hợp lệ → modal đóng → task xuất hiện.
6. Đổi trạng thái → nút hiện “Đang lưu…” → trạng thái đổi; tải lại trang vẫn giữ.
7. Tắt API rồi đổi trạng thái → trạng thái rollback + banner lỗi.
8. Thử màn hình nhỏ 320×568 và khi bàn phím mở.

---

## 10. Đối chiếu tiêu chí nghiệm thu

- [x] App khởi động vào `GroupScreen`, không đăng nhập.
- [x] Nhóm được tải theo membership của tài khoản hiện tại.
- [x] Tài khoản mới bắt đầu không có nhóm; chủ động tạo nhóm hoặc nhận lời mời.
- [x] Task Board lấy `group_id` từ params khi gọi GET.
- [x] Loading, empty, error/retry, `FlatList`.
- [x] Task item hiển thị title + status; bấm đổi đúng item tức thời và lưu server.
- [x] FAB mở modal, truyền đúng group ID.
- [x] Title rỗng/khoảng trắng không gọi API.
- [x] Submit hợp lệ gửi đúng `group_id`, `title`, JSON.
- [x] POST thành công đóng modal; board GET lại khi focus.
- [x] POST thất bại giữ modal + input + cho thử lại.
- [x] IP API cấu hình một nơi, có hướng dẫn LAN.
- [x] Không còn endpoint update giả định; endpoint thật đã kiểm thử.
- [x] Không còn tuyên bố “chỉ lưu local” sai sự thật.
- [x] Không lỗi TypeScript/lint/build.

---

## 11. Xử lý sự cố

| Hiện tượng | Cách xử lý |
| --- | --- |
| `php` không nhận diện | Cài PHP 8.1+, thêm vào `PATH`, mở terminal mới |
| `could not find driver` | Bật `extension=pdo_sqlite` hoặc `extension=pdo_mysql` trong `php.ini` |
| API 500 khi dùng MySQL | Kiểm tra `backend/.env`, database đã tạo, user có quyền |
| Điện thoại không kết nối | Cùng Wi-Fi, dùng IP LAN, mở firewall cổng 8080 |
| Expo Web bị CORS | `CORS_ALLOWED_ORIGINS=*` hoặc thêm origin web |
| XAMPP 404 | Đúng thư mục `htdocs/studysync_api`, Apache đang chạy |
| Cổng 8080 bận | Chạy `php -S 0.0.0.0:8081 -t backend backend/router.php` và đổi `.env` |
| Android dev build chặn HTTP | Expo Go thường cho phép; dev build cần cleartext traffic cho mạng nội bộ |
| Node 22.12 cảnh báo | Nâng Node lên >= 22.13 |

---

## 12. Phạm vi hiện tại và giới hạn

- Không có đăng nhập, phân quyền, chat hay quản lý thành viên (đúng phạm vi đề bài).
- Đã có tạo/xoá nhóm, tạo/xoá công việc và sửa tiêu đề/trạng thái công việc.
- Chưa có đăng nhập, phân quyền thành viên, kéo thả, phân trang, thông báo đẩy hoặc offline sync.
- Không hỗ trợ offline; cần backend để tải và lưu dữ liệu.
- SQLite phù hợp demo/nộp bài; MySQL phù hợp nếu cần nhiều người dùng đồng thời.
- API chưa có xác thực/rate limit; không nên deploy công khai nguyên trạng.
