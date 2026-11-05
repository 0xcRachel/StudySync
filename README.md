# StudySync — Ứng dụng quản lý nhóm học tập

Sản phẩm gồm **một backend PHP + MySQL** và **hai frontend dùng chung một codebase Expo/React Native**:

- `src/web` — bản trình duyệt (react-native-web): chat bong bóng hai bên, cảm xúc, trả lời, nhắc tên, ảnh, bình luận công việc.
- `src/redesign` — bản điện thoại (Expo Go, React Navigation): đăng nhập, công việc, chat, ảnh, thông báo cục bộ.

Mọi thao tác đều ghi thật vào database ở cả hai bản; không có chế độ "lưu tạm trên thiết bị".

---

## 1. Kiến trúc

```text
Trình duyệt (src/web)              Điện thoại (src/redesign, Expo Go)
        │  fetch + Bearer token            │  fetch + Bearer token
        ├──────────────┬───────────────────┤
        │              ▼                   │
        │      PHP API :8080               │  35 endpoint trong backend/api/
        │      PDO · prepared statement    │  auth · groups · tasks · chat · social
        │              │                   │  notifications · profile · system
        │              ▼                   ▼
        │        MySQL (Laragon)    WebSocket :8090
        │              ▲                   │  typing · presence · read · tin nhắn
        └──────────────┴───────────────────┘
```

| Thành phần | Công nghệ | Ghi chú |
| --- | --- | --- |
| Mobile app | React Native 0.88, Expo SDK 58, TypeScript | React Navigation 7: bottom tabs + native stack |
| Web app | react-native-web 0.21, routing theo hash (`#/group/26`) | CSS nạp một lần vào `<style>`, design system dùng chung |
| Thời gian thực | `ws` — `backend/realtime/server.mjs` | xác thực bằng đúng token PHP; SQLite không có realtime, client tự fallback polling |
| Ảnh chat | `expo-image-picker` + `message_image.php` | ảnh chỉ đọc được bởi thành viên nhóm |
| Thông báo điện thoại | `expo-notifications` (cục bộ) | xem §12 về push remote |
| Lưu phiên | `@react-native-async-storage/async-storage` | app tái khám phiên bằng `/me.php` |
| Hướng dẫn web | Driver.js — tour tương tác, mở lại được | |
| Chuyển động web | GSAP + Lenis | |
| Backend | PHP 8.1+ (đang chạy 8.4), PDO | |
| Database | MySQL 5.7+/8.x (khuyến nghị) hoặc SQLite 3 (demo) | |
| Kiểm thử API | `backend/tests/api_test.mjs` — 25 ca HTTP thật | |

---

## 2. Yêu cầu môi trường

- **Node.js** phải nằm trong dải React Native 0.88 nhận: `^22.13.0 || ^24.3.0 || >=26.0.0`. **Node 25 không được hỗ trợ.** `package.json` khai báo `engines.node >= 22.13.0`, `.nvmrc` ghim `22.13.0`; kiểm tra bằng `node -v`.
- **PHP >= 8.1** với `pdo_mysql` (khuyến nghị) hoặc `pdo_sqlite`, kèm extension `fileinfo` để kiểm tra MIME của ảnh.
- npm.
- Expo Go trên iPhone/Android, iOS Simulator, Android Emulator hoặc trình duyệt.

```bash
node -v
php -v
php -m
```

---

## 3. Chạy nhanh

```bash
cd D:\StudySync
npm install
```

Mở **hai terminal** tại thư mục dự án:

```bash
# Terminal 1 — PHP API :8080 + WebSocket :8090, Ctrl+C tắt cả hai cùng lúc
npm run api

# Terminal 2 — Metro; nhấn w để mở web, hoặc dùng npm run web
npm start
```

Kiểm tra backend:

```bash
curl http://localhost:8080/health.php
```

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "driver": "mysql",
    "php_version": "8.4.0",
    "server_time": "2026-11-05T02:47:08+00:00"
  }
}
```

Tài khoản mới bắt đầu với danh sách nhóm trống — hãy tự tạo nhóm hoặc chấp nhận lời mời. Backend tự tạo schema ở request đầu tiên.

### Chạy trên điện thoại thật

Điện thoại và máy tính phải cùng Wi-Fi. IP của máy đổi khi chuyển mạng hoặc DHCP cấp lại, nên giá trị này nằm trong `.env` (đã gitignore) chứ không hardcode trong code:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.2.8:8080
```

Lấy IP bằng `ipconfig` và chọn đúng adapter "Wi-Fi" (bỏ IP của VMware/Hyper-V/Radmin). Khởi động lại Expo sau khi sửa vì `EXPO_PUBLIC_*` chỉ được đọc lúc khởi động. Firewall phải mở cổng 8080 **và 8090**; `npm run api` đã bind `0.0.0.0`.

Trình duyệt **bỏ qua** IP LAN này và luôn dùng `http://localhost:8080` — xem `src/config/api.ts`. Đây là cố ý: một IP cũ trong `.env` từng làm web app treo âm thầm.

---

## 4. Cấu hình frontend — một nơi duy nhất

`src/config/api.ts` đọc từ `.env` ở thư mục gốc.

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `http://<ip-lan>:8080` (điện thoại), `http://localhost:8080` (web) | URL gốc PHP API |
| `EXPO_PUBLIC_REALTIME_PORT` | `8090` | Cổng WebSocket, suy ra từ URL gốc |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | `15000` | Timeout mỗi request |
| `EXPO_PUBLIC_API_REQUEST_FORMAT` | `json` | `json` hoặc `form` nếu backend cũ chỉ đọc `$_POST` |
| `EXPO_PUBLIC_API_BASE_URL_WEB` | không đặt | Chỉ dùng khi muốn trình duyệt gọi một backend khác |

---

## 5. Backend và database

### 5.1 MySQL (khuyến nghị — bắt buộc cho realtime)

1. Bật **Apache** và **MySQL** trong Laragon, tạo database `studysync`.
2. Import `backend/database/schema.mysql.sql` nếu là database mới. Database đã có dữ liệu thì **không** import lại: backend tự chạy migration idempotent, có chặn bằng `schema_revision` để không quét lại ~25 câu DDL ở mỗi request.
3. `backend/.env` (không commit):

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

4. Chạy `npm run api`; frontend chạy ở terminal khác. Lệnh này khởi động PHP API tại `http://localhost:8080` và WebSocket tại cổng `8090`, tự đọc `backend/.env`.

Ghi chú:

- Nếu Apache báo 403 với `.htaccess`, bật `AllowOverride All` cho thư mục `htdocs` trong `httpd.conf`.
- Không commit `backend/.env` hoặc file database.

### 5.2 SQLite (demo, khỏi cài MySQL)

- File `backend/storage/data/studysync.sqlite`, tự tạo ở request đầu tiên.
- Reset dữ liệu: dừng API, xoá file, chạy lại `npm run api`.
- **Không có thời gian thực**: client tự chuyển sang polling, độ trễ cao hơn.

### 5.3 Cấu hình backend

Xem `backend/.env.example`. Biến môi trường hệ thống được ưu tiên hơn file `.env`.

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `DB_DRIVER` | `sqlite` | `sqlite` hoặc `mysql` |
| `DB_SQLITE_PATH` | `backend/storage/data/studysync.sqlite` | Vị trí file SQLite |
| `CORS_ALLOWED_ORIGINS` | `*` | `*` hoặc danh sách origin, phân tách bằng dấu phẩy |

---

## 6. API contract

Base URL mặc định: `http://localhost:8080`. `router.php` giữ URL phẳng (`/get_tasks.php`) dù file đã chuyển vào `backend/api/<domain>/`.

Endpoint có nội dung (task, tin nhắn, bình luận) đều cần `Authorization: Bearer <token>`; token là session lưu trong bảng `sessions`.

### 6.1 Danh sách task

```http
GET /get_tasks.php?group_id=1
Authorization: Bearer <token>
```

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

Nhóm mới không có dữ liệu mẫu toàn cục; tài khoản chỉ truy cập nhóm mà mình là thành viên. Lỗi: `401` khi chưa đăng nhập, `403` khi không thuộc nhóm, `422` khi thiếu/sai `group_id`, `405` khi sai method.

### 6.2 Tạo task

```http
POST /create_task.php
Content-Type: application/json

{ "group_id": 1, "title": "Ôn tập chương 4", "assignee_ids": [12] }
```

Nhận cả `application/x-www-form-urlencoded`. Trả `201` kèm object task. Lỗi: `400` JSON sai, `404` nhóm không tồn tại, `422` title rỗng/quá 120 ký tự, `405` sai method.

### 6.3 Đổi trạng thái · sửa tiêu đề · xoá

```http
POST  /update_task_status.php   { "id": 4, "group_id": 1, "status": "doing" }
PATCH /update_task.php          { "id": 4, "group_id": 1, "title": "Tiêu đề mới" }
POST  /delete_task.php          { "id": 4 }
POST  /assign_task.php          { "task_id": 4, "user_ids": [12, 58] }
```

`/update_task.php` **không** đổi trạng thái khi body thiếu `status`: mặc định lấy trạng thái đang có, nên đổi tên một việc đang làm không kéo nó về "Cần làm". Cả nhóm endpoint đều kiểm tra task thuộc đúng nhóm và trả `404` nếu không — nếu không, một UPDATE không khớp hàng nào vẫn báo thành công.

### 6.4 Bình luận công việc

```http
GET  /task_comments.php?task_id=4
POST /task_comments.php?task_id=4    { "body": "Chương 4 cần thêm bài tập" }
```

`task_id` nằm ở query string ở cả hai chiều. Bình luận mất theo cascade khi xoá việc hoặc xoá nhóm.

### 6.5 Chat

```http
GET  /messages.php?group_id=1&limit=100[&before_id=<id>]   # phân trang tin cũ
POST /messages.php                                          # JSON, hoặc multipart có trường `image`
POST /message_reactions.php   { "message_id": 4, "emoji": "❤️" }
POST /message_actions.php     { "message_id": 4, "action": "edit" | "delete" }
GET  /message_image.php?id=4                                 # chỉ thành viên nhóm
```

Tin chỉ có ảnh được lưu với `body` rỗng — backend không tự điền chữ "Ảnh đính kèm". Cột `emoji` dùng collation `utf8mb4_bin`, vì `utf8mb4_unicode_ci` coi mọi emoji là giống nhau và làm reaction gộp nhầm.

### 6.6 Health check và quy ước lỗi

`GET /health.php` trả driver đang dùng, trạng thái kết nối và phiên bản PHP.

Mọi lỗi đều là JSON, không trả HTML/PHP warning:

```json
{ "success": false, "message": "Thông báo tiếng Việt an toàn." }
```

Frontend phân loại lỗi mạng, timeout, HTTP, JSON sai cú pháp và hiển thị thông báo tiếng Việt tương ứng.

---

## 7. Hai giao diện

### 7.1 Bản web (`src/web`)

- **Landing**: đăng nhập/đăng ký trong `AuthSheet`; phiên lưu ở `sessionStorage`, tour Driver.js mở lại được.
- **Home**: danh sách nhóm kèm số việc đã xong, tạo nhóm, **trung tâm thông báo** (chuông + popover) gộp thông báo và lời mời nhóm; chấp nhận/từ chối ngay trong popover.
- **Màn nhóm**, ba tab:
  - *Công việc*: lọc theo trạng thái, tạo + giao việc, bấm tròn trạng thái để quay vòng `Cần làm → Đang làm → Xong`, **đổi tên inline** (Enter lưu, Esc huỷ), **xoá** bằng hai lần bấm kèm rollback khi API lỗi, **bình luận** tải về khi mở ngăn kéo.
  - *Chat*: bong bóng hai bên (tin của mình bên phải), phân cách theo ngày, gom tin liên tiếp cùng người gửi, cảm xúc, trả lời, nhắc tên `@`, sửa/xoá, gửi ảnh (tin chỉ-ảnh không kèm chữ), chỉ báo "đang nhập", xác nhận đã đọc, nút tải thêm tin cũ mà không nhảy cuộn. Danh sách tin là vùng cuộn duy nhất; ô soạn thảo cao cố định, không trôi khi gõ.
  - *Thành viên*: vai trò (Chủ nhóm/Quản trị/Thành viên), trạng thái hoạt động, mời nhanh bạn bè, và **Xoá nhóm** chỉ hiện với owner/admin.
- **Bạn bè / Thông báo / Hồ sơ**: kết bạn, chấp nhận lời mời, đánh dấu đã đọc, sửa hồ sơ, đổi mật khẩu.

Vòng trạng thái và tính nhất quán: UI đổi ngay (optimistic) → gọi API → khoá nút của item đang gửi → thành công thì đồng bộ object từ response, thất bại thì **rollback** và hiện toast tiếng Việt. Tải lại màn hình sẽ đọc trạng thái thật từ database.

### 7.2 Bản điện thoại (`src/redesign`)

- React Navigation: bottom tabs *Nhóm / Bạn bè / Thông báo / Hồ sơ* + native stack cho màn hình nhóm.
- Phiên lưu trong AsyncStorage và được tái khám bằng `/me.php` khi mở app; tắt app không mất đăng nhập.
- Tab nhóm có *Công việc / Chat / Thành viên*: tạo và giao việc, đổi trạng thái, nhắn tin, cảm xúc, sửa/xoá tin, **chọn và xem ảnh** (chạm ảnh để mở toàn màn hình), chỉ báo kết nối, "đang nhập".
- **Thông báo cục bộ** khi tin nhắn tới lúc đang ở tab khác hoặc app chạy nền.
- Banner "Không có kết nối" khi mất Wi-Fi (NetInfo); dữ liệu đã tải vẫn hiển thị.
- Pull-to-refresh ở mọi danh sách; lỗi refresh không xoá dữ liệu đang có.

Chat bản điện thoại còn đơn giản hơn bản web: chưa có trả lời, nhắc tên, bảng cảm xúc đầy đủ và bình luận công việc (xem §12).

---

## 8. Cấu trúc thư mục

```text
D:\StudySync
├── App.tsx                    # nhánh web/native, mỗi bên nạp module riêng
├── index.ts                   # registerRootComponent
├── .env.example / .env        # .env đã gitignore, chứa IP LAN
├── src/
│   ├── config/api.ts          # URL gốc, timeout, định dạng body
│   ├── lib/                   # useGroupRealtime, useUserRealtime
│   ├── web/                   # WebApp.tsx, styles.ts, screens/, components/, lib/
│   │   ├── screens/           # Landing, Home, Group, Friends, Notifications, Profile
│   │   ├── components/        # TaskRow, NotificationCenter, AuthSheet, ui (bộ icon SVG), Toast…
│   │   └── lib/               # api.ts, format.ts, motion.ts, routing.ts, session.ts, useNotifications.ts
│   └── redesign/              # AppShell.tsx (React Navigation), api.ts, session.ts,
│                              # notifications.ts, motion.tsx, Toast.tsx
└── backend/
    ├── api/<domain>/          # 35 endpoint: auth, chat, groups, tasks, social,
    │                          # notifications, profile, system
    ├── core/                  # bootstrap, auth, config, database.php (schema + revision gate), helpers
    ├── realtime/server.mjs    # WebSocket :8090
    ├── database/schema.mysql.sql
    ├── migrations/            # 001..007, idempotent
    ├── storage/chat/          # ảnh đã upload
    ├── storage/data/          # file SQLite khi DB_DRIVER=sqlite
    ├── router.php             # URL phẳng → api/<domain>/*.php
    ├── dev-server.mjs         # khởi động PHP + realtime, tắt cả hai cùng lúc
    ├── .env.example
    └── tests/                 # api_test.mjs, live_realtime_test.mjs
```

---

## 9. Kiểm tra

```bash
npm run test:api        # 25 ca HTTP thật trên database tạm
npm run test:realtime   # WebSocket: auth, typing, presence, read, đẩy tin nhắn
npm run typecheck
npm run lint
npx expo export --platform web
npx expo-doctor
```

Kết quả đạt gần nhất (2026-11-05):

- `npm run test:api`: **25/25** — đăng ký, quyền riêng tư giữa hai tài khoản, tạo nhóm trùng tên độc lập, validation task, task khác nhóm phải 404, reaction/sửa/xoá tin nhắn, CORS và chặn file nội bộ.
- `npm run typecheck` và `npm run lint`: không lỗi, không cảnh báo.
- Bundle iOS build qua Metro thành công (`index.bundle?platform=ios`, không lỗi module).
- Kiểm chứng thủ công trên trình duyệt với backend MySQL thật: gửi tin không giật cuộn; ảnh chỉ-ảnh không kèm chữ; reaction không gộp emoji; đổi tên task giữ nguyên trạng thái; xoá task có rollback; bình luận tải khi mở ngăn kéo; *Xoá nhóm* chỉ chủ nhóm bấm được và quay về danh sách; mốc giờ của tin vừa gửi khớp đồng hồ máy.

### Kiểm tra thủ công đề nghị

1. `npm run api` + `npm start`, mở hai trình duyệt ở hai tài khoản để thấy realtime.
2. Đăng nhập → tạo nhóm → tạo việc + giao việc → đổi trạng thái → tải lại trang vẫn giữ.
3. Tab *Công việc*: rê chuột vào một việc rồi đổi tên (Enter), xoá (bấm hai lần), mở *Bình luận* và gửi.
4. Chat: gửi chữ, gửi ảnh không kèm chữ, thả cảm xúc, trả lời, nhắc `@`, xoá tin của mình, mở ảnh, tải tin cũ.
5. Mở tab *Thành viên* bằng tài khoản chủ nhóm rồi bấm *Xoá nhóm*: bấm một lần và chờ năm giây để nút hoàn tác.
6. Tắt API → kiểm tra banner/empty state và rollback; bật lại → tải lại thành công.
7. Trên iPhone (Expo Go, cùng Wi-Fi, `.env` đúng IP): đăng nhập, mở nhóm, gửi ảnh, chuyển sang tab khác để một máy khác gửi tin → thông báo cục bộ bật lên.

---

## 10. Đối chiếu tiêu chí nghiệm thu

- [x] Đăng ký/đăng nhập bằng token Bearer; phiên tái khám được khi mở lại app (cả web và điện thoại).
- [x] Nhóm phân quyền theo thành viên; tài khoản chỉ thấy nhóm và task của mình (có ca kiểm thử riêng cho hai tài khoản).
- [x] Tạo/xoá nhóm; *Xoá nhóm* dành cho owner/admin, khớp đúng vai trò server kiểm tra.
- [x] Công việc: tạo, giao người, đổi trạng thái, **đổi tiêu đề**, **xoá** — ghi thật, có rollback khi lỗi.
- [x] Bình luận công việc, tải khi cần, mất theo cascade khi xoá việc hoặc nhóm.
- [x] Chat nhóm thời gian thực: tin mới, "đang nhập", đã đọc, cảm xúc, trả lời, nhắc tên.
- [x] Ảnh chat: upload kiểm tra MIME + kích thước + 5 MB, chỉ thành viên đọc được, tin chỉ-ảnh không bị nhét chữ.
- [x] Phân trang tin cũ, loading/empty/error states, pull-to-refresh ở cả hai frontend.
- [x] Trung tâm thông báo có một nguồn dữ liệu duy nhất; lời mời nhóm trả lời được ngay.
- [x] IP server khai báo một nơi, có hướng dẫn LAN; trình duyệt không phụ thuộc IP của điện thoại.
- [x] Không endpoint giả định; schema tự migrate idempotent kèm revision gate.
- [x] Không còn tuyên bố “chỉ lưu local” sai sự thật.
- [x] Không lỗi TypeScript/ESLint; 25/25 ca API đạt; bundle web và iOS build được.

---

## 11. Xử lý sự cố

| Hiện tượng | Cách xử lý |
| --- | --- |
| `php` không nhận diện | Cài PHP 8.1+, thêm vào `PATH`, mở terminal mới |
| `could not find driver` | Bật `extension=pdo_mysql` hoặc `extension=pdo_sqlite` trong `php.ini` |
| Expo CLI báo Node không được hỗ trợ | Dùng Node `^22.13` / `^24.3` / `>=26` (Node 25 không nằm trong dải) |
| API 500 khi dùng MySQL | Kiểm tra `backend/.env`, database đã tạo, user có quyền |
| Web treo "máy chủ phản hồi quá lâu" | `.env` đang giữ IP LAN cũ; bản web phải dùng `http://localhost:8080` |
| Điện thoại không kết nối | Cùng Wi-Fi, đúng IP LAN, mở firewall cổng 8080 **và 8090** |
| Realtime không chạy, app vẫn polling | Chỉ `DB_DRIVER=mysql` có WebSocket; SQLite không có realtime |
| Reaction hiển thị sai emoji | Cột `emoji` phải là `utf8mb4_bin` (migration 007) |
| Expo Web bị CORS | `CORS_ALLOWED_ORIGINS=*` hoặc thêm origin web vào danh sách |
| Apache báo 403 với `.htaccess` | Bật `AllowOverride All` cho thư mục `htdocs` |
| Cổng 8080 bận | `php -S 0.0.0.0:8081 -t backend backend/router.php` rồi đổi `.env` |
| Android dev build chặn HTTP | Expo Go thường cho phép; dev build cần bật cleartext cho mạng nội bộ |

---

## 12. Phạm vi hiện tại và giới hạn

**Đã có**: đăng nhập và phân quyền, nhóm + vai trò, công việc (tạo/sửa/xoá/giao việc/bình luận), chat nhóm thời gian thực với ảnh/cảm xúc/trả lời/nhắc tên/đã đọc, bạn bè, lời mời, trung tâm thông báo, hồ sơ và đổi mật khẩu, tour hướng dẫn, thông báo cục bộ trên điện thoại, banner mất kết nối.

**Chưa có — và tài liệu này không tuyên bố là có**:

- **Rời nhóm, xoá thành viên, đổi vai trò**: backend chưa có endpoint, nên UI không có nút.
- **Push remote (APNs/FCM)**: cần Apple Developer profile + development build/EAS. Trên Expo Go ứng dụng chỉ gửi *thông báo cục bộ*; tin đến khi app đã bị kill sẽ không đánh thức máy.
- **Hàng đợi ghi khi offline**: mất mạng là chỉ đọc được dữ liệu đã tải, không có queued write rồi đồng bộ lại.
- **Chat 1-1 ngoài nhóm**: bảng `messages` có `receiver_id` và schema đã hỗ trợ, nhưng cả hai frontend đều chưa mở màn hình này.
- **Bản điện thoại chưa bằng bản web ở phần chat**: thiếu trả lời, nhắc tên, bảng cảm xúc, bình luận công việc và tải tin cũ.
- **Không có rate limit, audit log, quản trị viên hệ thống**: không nên deploy công khai nguyên trạng; API mở chỉ phù hợp demo trong mạng nội bộ.
- **Múi giờ**: MySQL ghi theo múi máy chủ (+07 trên máy phát triển) còn PHP chạy UTC, nên client đọc chuỗi "giờ máy chủ" như giờ của máy người dùng. Hai máy phải cùng múi, hoặc backend phải trả UTC kèm offset.
