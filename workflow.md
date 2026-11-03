StudySync MVP — Đặc tả Frontend React Native cho AI agent Ai-Chan
Tài liệu này là yêu cầu triển khai toàn bộ phần frontend của StudySync MVP. Giao tài liệu này trực tiếp cho AI agent Ai-Chan. Phạm vi gồm giao diện, điều hướng, state, gọi API, xử lý trạng thái và kiểm tra frontend. Không yêu cầu làm backend hoặc đăng nhập.

1. Mục tiêu sản phẩm
Tạo một ứng dụng React Native để người dùng có thể:
1. Mở app và chọn nhóm học tập.
2. Xem các công việc của nhóm.
3. Đổi trạng thái công việc trên giao diện.
4. Tạo công việc mới bằng modal.
5. Sau khi tạo thành công, quay lại bảng công việc và thấy task mới được tải từ API.
MVP bỏ qua Login. Dữ liệu nhóm ban đầu là mock data; danh sách task được tải từ PHP API.
2. Chỉ dẫn triển khai dành cho Ai-Chan
Hãy đọc cấu trúc repo và các API PHP đang có trước khi viết code. Sau đó triển khai frontend theo tài liệu này, ưu tiên code chạy được trong repo hiện tại.
- Nếu dự án đã dùng Expo hoặc React Native CLI, tiếp tục theo nền tảng đó; không tạo dự án mới thay thế repo.
- Nếu repo chưa có lựa chọn framework, dùng React Native với TypeScript và React Navigation Native Stack.
- Dùng tên route, dữ liệu, API và hành vi được nêu trong tài liệu. Không tự tạo endpoint cập nhật task khi chưa xác minh backend có endpoint đó.
- Tách cấu hình API khỏi component. Không để IP server rải rác trong màn hình.
- Đọc định dạng response thực tế của PHP API. Nếu response khác ví dụ bên dưới, viết lớp chuyển đổi ở API service; không làm component phụ thuộc vào nhiều dạng response.
- Không sửa backend hoặc thêm chức năng ngoài phạm vi frontend trừ khi người dùng yêu cầu.
- Khi hoàn thành, báo các file đã tạo/sửa, lệnh chạy app, nơi cần điền IP máy chủ, API contract nào đã xác minh và các điểm còn phụ thuộc backend.
3. Công nghệ và phạm vi
Bắt buộc
- React Native.
- React Navigation Native Stack.
- GroupScreen, TaskBoardScreen, CreateTaskModal.
- FlatList để hiển thị task.
- State cục bộ bằng React hooks (useState, useEffect hoặc useFocusEffect).
- Gọi API bằng fetch hoặc HTTP client hiện có trong repo.
- Giao diện và thông báo bằng tiếng Việt.
Không thuộc MVP
- Login, đăng ký, quản lý tài khoản.
- Tạo/sửa/xóa nhóm.
- Phân quyền thành viên hoặc chat.
- Đồng bộ offline, push notification, phân trang.
- Sửa hoặc triển khai PHP API.
4. Điều hướng
Dùng một Native Stack Navigator với ba route:
Route	Component	Vai trò
GroupScreen	GroupScreen	Entry point; chọn nhóm
TaskBoardScreen	TaskBoardScreen	Bảng task của nhóm được chọn
CreateTaskModal	CreateTaskModal	Form tạo task, hiển thị kiểu modal


Định nghĩa route params bằng TypeScript. TaskBoardScreen và CreateTaskModal nhận group_id: number. Khi bấm card nhóm mặc định, truyền group_id: 1.

Khai báo CreateTaskModal với presentation modal của Native Stack (ví dụ presentation: 'modal', tùy phiên bản thư viện). Modal nhận group_id từ Task Board. Không truyền callback function qua route params vì params cần giữ được tính tuần tự hóa.
Tải lại sau khi đóng modal
Task Board phải tải task khi được mở lần đầu và tải lại khi màn hình được focus trở lại sau khi modal đóng. Có thể dùng useFocusEffect để xử lý cả hai tình huống. Sau khi POST tạo task thành công, modal chỉ cần đóng; Task Board tự gọi lại GET khi focus. Không yêu cầu người dùng bấm nút refresh.
5. Kiểu dữ liệu frontend
Tạo type/interface thống nhất cho component. Có thể điều chỉnh tên field tại API service để khớp response backend.
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface StudyGroup {
  id: number;
  name: string;
}

export interface StudyTask {
  id: number | string;
  group_id: number;
  title: string;
  status: TaskStatus;
}
Nhóm mock ban đầu:
const groups: StudyGroup[] = [
  { id: 1, name: 'Nhóm Đồ án Mobile' },
];
Task cần có tối thiểu id, group_id, title, status. Nếu API hiện tại chưa trả status, API service có thể chuẩn hóa giá trị mặc định thành todo; ghi rõ giả định này trong báo cáo hoàn thành.
6. Cấu hình API và kết nối thiết bị
Định nghĩa một cấu hình duy nhất, ví dụ src/config/api.ts:
export const API_BASE_URL = 'http://<IP_MAY_CHU>/studysync_api';
Thay <IP_MAY_CHU> bằng IP LAN của máy chạy PHP/MySQL API, ví dụ 192.168.1.20. Không để nguyên placeholder khi chạy app. Ưu tiên dùng biến môi trường nếu repo đã có cấu hình môi trường.
- Điện thoại thật và máy tính chạy API cần cùng mạng Wi-Fi/LAN; dùng IP LAN của máy tính, không dùng localhost trên điện thoại.
- Android Emulator thường truy cập máy host qua 10.0.2.2; dùng đúng địa chỉ theo môi trường hiện tại.
- HTTP nội bộ có thể cần cấu hình cho phép cleartext traffic trên Android khi phát triển. Không tắt bảo vệ này rộng hơn mức cần thiết trong bản phát hành.
- Đảm bảo PHP server lắng nghe trên địa chỉ mạng có thể truy cập, firewall cho phép cổng cần dùng và cấu hình CORS của backend phù hợp nếu nền tảng yêu cầu.
Tạo service tập trung, ví dụ src/services/taskService.ts:
- getTasks(groupId) — GET danh sách task.
- createTask(payload) — POST task mới.
- Chỉ thêm updateTaskStatus(...) nếu endpoint cập nhật đã tồn tại và đã xác minh method, URL, body.
7. API contract frontend
7.1 Lấy task
GET {API_BASE_URL}/get_tasks.php?group_id={group_id}
Accept: application/json
Ví dụ cho nhóm mặc định:
GET http://<IP_MAY_CHU>/studysync_api/get_tasks.php?group_id=1
Response mong muốn để frontend chuẩn hóa:
{
  "success": true,
  "data": [
    {
      "id": 12,
      "group_id": 1,
      "title": "Hoàn thiện giao diện đăng nhập",
      "status": "todo"
    }
  ]
}
Nếu API hiện trả về mảng trực tiếp hoặc dùng key khác như tasks, hãy xử lý khác biệt trong taskService, sau khi kiểm tra response thực tế. Component chỉ nhận StudyTask[] đã chuẩn hóa.
7.2 Tạo task
POST {API_BASE_URL}/create_task.php
Content-Type: application/json
Accept: application/json
Body logic:
{
  "group_id": 1,
  "title": "Hoàn thiện giao diện đăng nhập"
}
PHP có thể đọc JSON qua php://input; nếu backend hiện dùng $_POST và chỉ nhận application/x-www-form-urlencoded hoặc FormData, dùng đúng định dạng backend đang hỗ trợ. Không chỉ đổi Content-Type mà vẫn gửi sai kiểu body.

Response thành công mẫu:
{
  "success": true,
  "message": "Tạo công việc thành công",
  "data": {
    "id": 13,
    "group_id": 1,
    "title": "Hoàn thiện giao diện đăng nhập",
    "status": "todo"
  }
}
Frontend chỉ coi thao tác thành công khi HTTP response hợp lệ và response body không báo success: false theo contract backend. Nếu server trả body rỗng hoặc không phải JSON, báo lỗi dễ hiểu; không tự đóng modal như thể đã tạo thành công.
7.3 Đổi trạng thái
MVP phải cập nhật UI ngay khi người dùng bấm nút trạng thái (optimistic UI).
- Trước hết kiểm tra backend có endpoint cập nhật hay chưa.
- Nếu có, dùng đúng URL, HTTP method, payload và response đã xác minh. Cập nhật UI ngay, sau đó rollback về trạng thái cũ nếu request thất bại; hiển thị thông báo lỗi.
- Nếu chưa có endpoint, chỉ cập nhật state local. Ghi rõ thay đổi chưa được lưu lên server và có thể mất khi tải lại màn hình. Không giả vờ rằng dữ liệu đã lưu bền vững.
Nếu chưa có quy tắc chuyển trạng thái từ backend, dùng vòng lặp UI đơn giản todo → doing → done → todo. Hiển thị nhãn tiếng Việt tương ứng: Cần làm, Đang làm, Hoàn thành.
8. Đặc tả từng màn hình
8.1 GroupScreen — Chọn nhóm
Nội dung:
- Tiêu đề StudySync và lời nhắc chọn nhóm học tập.
- Danh sách nhóm dưới dạng card nổi bật.
- Có một card mock: Nhóm Đồ án Mobile, mã nhóm 1.
Hành vi:
- Chạm card sẽ navigate sang TaskBoardScreen với { group_id: 1 }.
- Card có vùng chạm đủ lớn, trạng thái nhấn trực quan và hỗ trợ accessibility label.
- Không hiển thị form đăng nhập.
Trạng thái:
- Có thể dùng danh sách mock cố định; không gọi API nhóm trong MVP.
- Nếu danh sách mock rỗng do sửa dữ liệu, hiển thị empty state thay vì màn hình trắng.
8.2 TaskBoardScreen — Bảng công việc
Dữ liệu/state:
- Lấy group_id từ route params; không hardcode 1 trong API call.
- tasks: StudyTask[].
- isLoading: boolean cho lần tải đầu.
- isRefreshing: boolean nếu có thao tác refresh.
- error: string | null để hiển thị lỗi tải.
- State riêng cho task đang cập nhật nếu cần khóa nút trong lúc gửi request.
Tải dữ liệu:
- Khi màn hình focus, gọi getTasks(group_id).
- Trong lúc tải lần đầu, hiện loading indicator và không hiển thị nội dung như thể danh sách đã tải xong.
- Chặn hoặc bỏ qua kết quả request cũ khi người dùng rời màn hình/đổi nhóm, để response cũ không ghi đè state mới. Có thể dùng AbortController nếu môi trường hỗ trợ; nếu không, dùng cờ cleanup/request id.
- Lỗi mạng, timeout, HTTP error, JSON không hợp lệ: hiện thông báo tiếng Việt và nút Thử lại.
- Lỗi tải lại sau khi đã có dữ liệu không nên xóa danh sách đang có; giữ nội dung cũ và báo lỗi refresh.
Danh sách/UI:
- Dùng FlatList và key ổn định từ task.id.
- Header hiển thị tên nhóm và tổng số task nếu có.
- Mỗi item hiển thị tên task, nhãn trạng thái và nút trạng thái.
- Có thể thêm chip lọc Tất cả, Cần làm, Đang làm, Hoàn thành; nếu thêm thì lọc trên state local, không gọi API lại.
- Empty state: “Nhóm chưa có công việc nào” cùng lời gợi ý bấm nút +.
- Có Floating Action Button (FAB) dấu + ở góc phải dưới, có accessibility label Tạo công việc mới.
- Nội dung list phải cuộn được và không bị FAB che khuất; hỗ trợ safe area.
Đổi trạng thái:
- Chạm nút trạng thái cập nhật task đó ngay trên UI.
- Cập nhật đúng item theo id, không thay đổi task khác.
- Nếu có API update: request lỗi thì khôi phục trạng thái trước đó và thông báo lỗi.
- Nếu chỉ cập nhật local: chỉ cập nhật state trong phiên hiện tại và không báo “đã lưu lên máy chủ”.
Mở form:
- Bấm FAB mở CreateTaskModal, truyền group_id hiện tại.
- Không tạo task trực tiếp trên board khi người dùng mới mở modal.
8.3 CreateTaskModal — Thêm công việc
UI:
- Tiêu đề Tạo công việc.
- Một TextInput cho tên công việc, placeholder gợi ý như Nhập tên công việc.
- Nút submit Tạo công việc.
- Nút đóng/hủy rõ ràng; có thể đóng modal bằng nút hệ thống theo hành vi Native Stack.
- Layout vẫn dùng được khi bàn phím mở; dùng KeyboardAvoidingView/scroll nếu cần.
Validation:
- Xóa khoảng trắng đầu/cuối trước khi gửi: title.trim().
- Chuỗi rỗng chỉ gồm khoảng trắng phải bị từ chối, giữ modal mở và hiện thông báo ngay dưới input hoặc bằng alert.
- Không gửi request nếu thiếu group_id hợp lệ hoặc title rỗng.
Submit:
1. Khóa nút submit và hiển thị trạng thái đang gửi để tránh tạo trùng do bấm nhiều lần.
2. Gọi createTask({ group_id, title }).
3. Nếu thành công: hiển thị phản hồi ngắn nếu phù hợp, đóng modal bằng goBack().
4. Khi Task Board focus trở lại, tự tải danh sách lại từ GET.
5. Nếu thất bại: giữ modal mở, giữ nội dung đã nhập, mở khóa nút và hiện lỗi tiếng Việt để người dùng thử lại.
Không xóa nội dung input khi request lỗi. Không yêu cầu người dùng tải lại app.
9. Quy chuẩn giao diện và trải nghiệm
- Giao diện gọn, dễ đọc, phù hợp ứng dụng học tập; ưu tiên nền sáng, tương phản tốt.
- Dùng spacing, màu sắc, bo góc và typography nhất quán; đặt các giá trị dùng lại trong theme nếu dự án có nhiều màn hình.
- Trạng thái task cần phân biệt bằng cả chữ và màu, không chỉ dựa vào màu sắc.
- Tất cả nút có accessibility label/role phù hợp; input có label và hỗ trợ bàn phím tiếng Việt.
- Không dùng alert cho mọi tương tác; dùng inline error hoặc toast/snackbar nếu dự án đã có thư viện phù hợp.
- Có xử lý safe area, kích thước màn hình nhỏ và bàn phím.
- Không để log lỗi nhạy cảm hoặc địa chỉ có token trong UI.
10. Cấu trúc thư mục gợi ý
Điều chỉnh theo repo hiện tại; đây là cách chia trách nhiệm tham khảo:
src/
  navigation/
    AppNavigator.tsx
    types.ts
  screens/
    GroupScreen.tsx
    TaskBoardScreen.tsx
    CreateTaskModal.tsx
  components/
    GroupCard.tsx
    TaskItem.tsx
    FloatingActionButton.tsx
    LoadingView.tsx
    ErrorState.tsx
    EmptyState.tsx
  services/
    taskService.ts
    httpClient.ts
  config/
    api.ts
  types/
    task.ts
  theme/
    index.ts
Không cần tạo component/file riêng cho mọi dòng UI. Tách những phần có trách nhiệm rõ ràng và tránh viết toàn bộ ứng dụng trong một file.
11. Xử lý lỗi và thông báo
Thông báo ngắn gọn, tiếng Việt, gợi ý hành động tiếp theo:
Tình huống	Hành vi mong muốn
Không kết nối được API	“Không thể kết nối máy chủ. Kiểm tra IP và mạng rồi thử lại.”
GET thất bại	Giữ màn hình, hiện lỗi và nút Thử lại
Nhóm chưa có task	Hiện empty state và hướng dẫn bấm +
Tên task rỗng	Không gửi API; yêu cầu nhập tên công việc
POST thất bại	Modal vẫn mở, giữ input và cho phép thử lại
Update trạng thái thất bại khi có API	Rollback state và báo lỗi
Update local khi không có API	Cập nhật UI; không tuyên bố đã lưu bền vững


Không hiển thị stack trace, raw HTML của PHP warning, hoặc nội dung lỗi kỹ thuật dài cho người dùng. Có thể log chi tiết ở development console.
12. Tiêu chí nghiệm thu
Ai-Chan chỉ báo hoàn thành khi kiểm tra được các mục sau:
- [ ] App khởi động được và vào GroupScreen, không yêu cầu đăng nhập.
- [ ] Có card Nhóm Đồ án Mobile với ID 1.
- [ ] Chạm card điều hướng tới Task Board và truyền đúng group_id: 1.
- [ ] Task Board lấy đúng group_id từ params khi gọi GET.
- [ ] Có loading, empty, error/retry và danh sách task bằng FlatList.
- [ ] Task item hiển thị title và status; bấm status cập nhật đúng item tức thời.
- [ ] FAB mở modal và truyền đúng group ID.
- [ ] Submit title rỗng hoặc chỉ có khoảng trắng không gọi API.
- [ ] Submit hợp lệ gọi POST với đúng group_id, title và content type/encoding tương thích backend.
- [ ] POST thành công đóng modal; board tự GET lại khi focus và hiển thị task mới.
- [ ] POST thất bại giữ modal, dữ liệu input và cho phép thử lại.
- [ ] IP API cấu hình ở một nơi, có hướng dẫn thay bằng IP LAN phù hợp thiết bị.
- [ ] Không có endpoint update giả định hoặc trạng thái “đã lưu” sai sự thật.
- [ ] Không có lỗi TypeScript/lint/build đáng kể trong các lệnh kiểm tra sẵn có của repo.
13. Kiểm tra thủ công đề nghị
1. Chạy app trên emulator/thiết bị và chọn nhóm mặc định.
2. Tắt PHP server, xác nhận màn hình báo lỗi kết nối và nút thử lại hoạt động.
3. Bật API, xác nhận danh sách task tải đúng nhóm.
4. Bấm FAB rồi submit chuỗi rỗng và chuỗi chỉ có dấu cách; xác nhận không phát sinh request.
5. Tạo task hợp lệ; xác nhận modal đóng và task xuất hiện sau khi board tải lại.
6. Bấm status; xác nhận chỉ task tương ứng đổi trạng thái. Nếu có API update, mô phỏng lỗi để xác nhận rollback.
7. Thử trên kích thước màn hình nhỏ và khi bàn phím mở.
14. Bàn giao của Ai-Chan
Trong câu trả lời cuối sau khi triển khai, Ai-Chan cần ghi:
1. Các file đã tạo hoặc sửa và vai trò của chúng.
2. Lệnh cài dependencies/chạy app tương ứng với repo.
3. File/cấu hình cần thay IP máy chạy API.
4. URL và định dạng request thực tế đã đối chiếu với backend.
5. Cách xử lý đổi trạng thái: đã gọi endpoint nào, hoặc hiện chỉ lưu local.
6. Những lệnh kiểm tra đã chạy và kết quả.
7. Vấn đề còn chặn chạy thử (nếu có), ví dụ API chưa chạy, CORS hoặc response PHP chưa đúng JSON.