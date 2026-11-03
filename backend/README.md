# StudySync API (PHP + PDO)

## Nền tảng cộng tác

Backend có tài khoản và cộng tác MySQL thật: mật khẩu dùng `password_hash`,
phiên dùng Bearer token SHA-256 trong `user_sessions`. Các endpoint yêu cầu
header `Authorization: Bearer <token>`:

- `POST /register.php`, `POST /login.php`, `GET /me.php`, `PATCH /profile.php`, `POST /change_password.php`, `POST /logout.php`
- `GET /users.php?q=...`, `GET /friends.php`, `POST /send_friend_request.php`, `POST /respond_friend_request.php`
- `GET /group_members.php?group_id=...`, `GET /group_invitations.php`, `POST /invite_group_member.php`, `POST /respond_group_invitation.php`
- `GET|POST /messages.php`, `GET|PATCH|POST /notifications.php`
- Tin nhắn nhóm hỗ trợ trả lời và đính kèm ảnh JPEG/PNG/WebP/GIF tối đa 5 MB. Ảnh chỉ đọc được bởi thành viên nhóm đã đăng nhập.
- `POST /assign_task.php`, `GET|POST /task_comments.php`

Migration thủ công cho phpMyAdmin nằm tại `migrations/001_collaboration.mysql.sql`.
Backend cũng tự chạy migration idempotent trên MySQL ở request đầu tiên. Các
endpoint task cũ vẫn được giữ để tương thích frontend hiện tại; khi chuyển sang
production, frontend cần dùng token và kiểm tra thành viên nhóm đầy đủ.

Backend nhỏ gọn, không cần Composer hay framework. Endpoint được phân nhóm trong `api/`, mã dùng chung nằm trong `core/`, schema SQL trong `database/`, dữ liệu runtime trong `storage/`.

## Chạy

Từ thư mục gốc dự án:

```bash
npm run api
```

Hoặc chạy trực tiếp:

```bash
php -S 0.0.0.0:8080 -t backend backend/router.php
```

Kiểm tra:

```bash
curl http://localhost:8080/health.php
```

## Endpoints

| Method | URL | Mô tả |
| --- | --- | --- |
| GET | `/get_tasks.php?group_id=1` | Danh sách task của nhóm |
| POST | `/create_task.php` | Tạo task mới |
| POST/PATCH | `/update_task_status.php` | Cập nhật trạng thái task |
| GET | `/health.php` | Kiểm tra kết nối database |

Body nhận cả `application/json` và `application/x-www-form-urlencoded`.

### Ví dụ

```bash
curl "http://localhost:8080/get_tasks.php?group_id=1"

curl -X POST "http://localhost:8080/create_task.php" \
  -H "Content-Type: application/json" \
  -d '{"group_id":1,"title":"Ôn tập chương 4"}'

curl -X POST "http://localhost:8080/update_task_status.php" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"group_id":1,"status":"doing"}'
```

## Database

### SQLite (mặc định)

- File: `backend/storage/data/studysync.sqlite` (tự tạo lần đầu).
- Xoá file này để reset dữ liệu; request kế tiếp sẽ tạo schema mới (không thêm nhóm mẫu).
- Không cần cấu hình gì.

### MySQL / XAMPP

1. Tạo database `studysync` (utf8mb4).
2. Import `backend/database/schema.mysql.sql` (hoặc để backend tự tạo bảng).
3. Tạo `backend/.env` từ `backend/.env.example` và đặt:

```dotenv
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=studysync
DB_USER=root
DB_PASSWORD=
```

4. Khởi động lại API.

## Cấu hình

Xem `backend/.env.example`. Biến môi trường hệ thống được ưu tiên hơn file `.env`.

- `CORS_ALLOWED_ORIGINS`: `*` hoặc danh sách phân tách bằng dấu phẩy.
- `SEED_DEMO_DATA`: cũ, hiện không còn tự tạo nhóm/task mẫu dùng chung.
- `DB_SQLITE_PATH`: đổi vị trí file SQLite.
- `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`: bật đăng nhập OAuth; nút sẽ giữ trạng thái tắt đến khi cặp cấu hình tương ứng hợp lệ.
- `OAUTH_APP_URL`, `OAUTH_CALLBACK_URL`: URL web và callback backend; URI callback trên Google/Meta phải khớp cả `?provider=google` hoặc `?provider=facebook`.

Đăng nhập OAuth hiện dùng MySQL/MariaDB, state chống giả mạo, PKCE cho Google và chỉ lấy email/hồ sơ cơ bản. Tạo OAuth client/app trong Google Cloud Console và Meta for Developers, bật callback URL chính xác rồi điền secret vào `backend/.env` (không commit secret). Tài khoản đã đăng ký bằng mật khẩu chưa tự liên kết với OAuth cùng email; cần đăng nhập phương thức cũ để tránh ghép nhầm danh tính.

## Kiểm thử

Từ thư mục gốc:

```bash
npm run test:api
```

Script sẽ khởi động PHP server tạm ở một cổng trống với database tạm, chạy các kiểm thử HTTP rồi dọn dẹp.

## Bảo mật

- Có đăng nhập bằng mật khẩu và OAuth Google/Facebook khi provider credentials được cấu hình; không dùng cho production công khai nếu chưa cấu hình HTTPS, rate limit và kiểm thử bảo mật.
- Mọi query dùng prepared statement.
- File `.env`, database SQLite và file SQL bị chặn qua router/.htaccess.
- Lỗi PHP được ghi log, client chỉ nhận JSON tiếng Việt an toàn.
