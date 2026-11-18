import { code, h, Lesson, p, raw, table, tip, ul, warn } from './helpers'

export const stage7Lessons: Lesson[] = [
  {
    id: 'mob-api-design',
    title: 'Thiết kế API cho mobile client',
    detail: 'Tương thích ngược, versioning, phân trang, offline-first và force update.',
    minutes: 30,
    flutter: 'Đây là lợi thế lớn nhất của bạn: bạn hiểu app mobile cần gì từ API. Hãy dùng kinh nghiệm đó để thiết kế contract tốt hơn nhiều backend dev thuần.',
    blocks: [
      p('Khác với web, bạn **không kiểm soát** phiên bản app người dùng đang chạy. Sẽ luôn có người dùng app cũ gọi API mới. Mọi thay đổi phải coi trọng tương thích ngược.'),
      h('Quy tắc tương thích ngược'),
      ul(
        'Được phép: thêm field mới vào response, thêm endpoint mới, thêm field tùy chọn vào request.',
        'Không được (không có version mới): đổi tên/xóa field, đổi kiểu dữ liệu, đổi ý nghĩa field, thêm field bắt buộc vào request.',
        'Client phải bỏ qua field lạ; server phải chấp nhận thiếu field tùy chọn.',
        'Enum nên xử lý giá trị lạ (client nhận enum mới mà chưa biết phải không crash).'
      ),
      h('Versioning'),
      code('csharp', raw`
// Cách đơn giản: version trong URL
var v1 = app.MapGroup("/api/v1");
var v2 = app.MapGroup("/api/v2");

v1.MapGet("/orders/{id}", GetOrderV1);
v2.MapGet("/orders/{id}", GetOrderV2);   // cấu trúc response mới
`),
      p('Giữ version cũ chạy cho tới khi tỷ lệ người dùng app cũ đủ thấp. Có thể dùng thư viện `Asp.Versioning` khi cần quản lý nhiều version.'),
      h('Force update và minimum version'),
      code('csharp', raw`
app.MapGet("/api/app-config", () => new
{
    MinSupportedVersion = "2.3.0",        // app thấp hơn phiên bản này phải cập nhật
    LatestVersion = "2.6.1",
    MaintenanceMode = false
});
`),
      p('App Flutter gọi endpoint này khi khởi động và hiển thị màn hình bắt buộc cập nhật khi cần. Đây là "van an toàn" khi buộc phải đổi contract.'),
      h('Những điều mobile cần từ API'),
      ul(
        '**Phân trang theo cursor** cho infinite scroll (ổn định khi dữ liệu thay đổi).',
        '**Dữ liệu gọn**: trả đúng field cần dùng, giảm băng thông 4G.',
        '**Hỗ trợ offline**: `updatedAt` hoặc `ETag` để đồng bộ gia tăng, idempotency key cho thao tác ghi khi retry.',
        '**Lỗi có mã**: trả `code` ổn định (ví dụ `INSUFFICIENT_FUNDS`) để app hiển thị thông báo đã dịch, không phụ thuộc chuỗi lỗi.',
        '**Thời gian dạng UTC ISO-8601** cho mọi timestamp.'
      ),
      code('json', raw`
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Không đủ số dư",
  "status": 422,
  "code": "INSUFFICIENT_FUNDS",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00"
}
`, 'Lỗi có mã ổn định'),
      tip('Hãy lưu `traceId` trong response lỗi: khi người dùng báo lỗi kèm ảnh chụp, bạn tra được log chính xác.')
    ],
    takeaways: [
      'Mọi thay đổi API đều phải xem xét app cũ đang tồn tại ngoài kia.',
      'Chỉ thêm, không đổi/xóa; khi bắt buộc đổi thì tạo version mới.',
      'Có endpoint app-config với minimum version để force update khi cần.'
    ],
    practice: 'Thêm `GET /api/app-config` cho project này và viết (trên giấy) luồng app Flutter xử lý màn hình bắt buộc cập nhật.',
    links: [
      { title: 'API versioning (Asp.Versioning)', url: 'https://github.com/dotnet/aspnet-api-versioning' },
      { title: 'Web API design best practices', url: 'https://learn.microsoft.com/azure/architecture/best-practices/api-design' }
    ]
  },
  {
    id: 'mob-flutter-client',
    title: 'Gọi .NET API từ Flutter',
    detail: 'Dio, interceptor refresh token, xử lý ProblemDetails và lưu ý CORS cho Flutter Web.',
    minutes: 30,
    blocks: [
      code('dart', raw`
final dio = Dio(BaseOptions(
  baseUrl: const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:5080/api'),
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 20),
));

class AuthInterceptor extends QueuedInterceptorsWrapper {
  AuthInterceptor(this.tokens, this.dio);
  final TokenStore tokens;
  final Dio dio;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final access = tokens.access;
    if (access != null) options.headers['Authorization'] = 'Bearer $access';
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && await tokens.refresh(dio)) {
      final retry = await dio.fetch(err.requestOptions);      // gọi lại với token mới
      return handler.resolve(retry);
    }
    handler.next(err);
  }
}
`, 'Flutter: Dio + refresh token'),
      h('Địa chỉ localhost khi chạy emulator'),
      table(['Môi trường', 'Địa chỉ trỏ tới máy dev'], [
        ['Android emulator', '`http://10.0.2.2:5080`'],
        ['iOS simulator', '`http://localhost:5080`'],
        ['Thiết bị thật', 'IP LAN của máy (ví dụ `http://192.168.1.10:5080`), máy và điện thoại cùng Wi-Fi'],
        ['Flutter Web', '`http://localhost:5080` + bật CORS ở backend']
      ]),
      warn('Android (từ API 28) chặn HTTP không mã hóa mặc định, iOS cũng yêu cầu ATS. Với dev local, cần cấu hình cho phép cleartext, còn production luôn dùng HTTPS.'),
      h('Đọc lỗi từ ProblemDetails'),
      code('dart', raw`
class ApiError implements Exception {
  ApiError(this.status, this.title, {this.code});
  final int status;
  final String title;
  final String? code;

  factory ApiError.from(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      return ApiError(e.response!.statusCode ?? 0, data['title'] as String? ?? 'Lỗi', code: data['code'] as String?);
    }
    return ApiError(e.response?.statusCode ?? 0, 'Không kết nối được máy chủ');
  }
}
`),
      h('Lưu ý khi dùng Flutter Web'),
      ul(
        'Trình duyệt áp dụng CORS: cấu hình `AllowedOrigins` của backend chứa origin của Flutter Web.',
        'App mobile native không bị CORS, nên lỗi "chạy mobile được nhưng web lỗi" thường là CORS.',
        'Sinh model/client từ OpenAPI để đồng bộ với backend (xem bài OpenAPI).'
      ),
      tip('Đặt `API_BASE_URL` qua `--dart-define` để đổi môi trường (dev/staging/prod) mà không sửa code.')
    ],
    takeaways: [
      'Địa chỉ localhost khác nhau giữa Android emulator, iOS simulator và thiết bị thật.',
      'Interceptor refresh token trên client phải khớp với luồng rotation ở server.',
      'Lỗi chạy được trên mobile nhưng hỏng trên web thường là CORS.'
    ],
    practice: 'Viết một màn hình Flutter nhỏ gọi `GET /api/notes` của project này, hiển thị danh sách và xử lý trạng thái loading/lỗi.',
    links: [
      { title: 'Dio package', url: 'https://pub.dev/packages/dio' },
      { title: 'Flutter networking cookbook', url: 'https://docs.flutter.dev/cookbook/networking' }
    ]
  },
  {
    id: 'mob-realtime-push',
    title: 'Realtime, Push Notification và upload file',
    detail: 'SignalR với Flutter, gửi FCM từ .NET và upload file lên storage.',
    minutes: 35,
    blocks: [
      h('SignalR: realtime hai chiều'),
      p('**SignalR** là thư viện realtime của ASP.NET Core (WebSocket, tự fallback). Phù hợp cho chat, thông báo giao dịch, cập nhật trạng thái đơn hàng.'),
      code('csharp', raw`
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        await base.OnConnectedAsync();
    }
}

builder.Services.AddSignalR();
app.MapHub<NotificationHub>("/hubs/notifications");

// Gửi từ bất kỳ đâu trong backend
await hubContext.Clients.Group($"user:{userId}").SendAsync("transferCompleted", new { transferId, amount });
`),
      code('dart', raw`
// Flutter: package signalr_netcore
final hub = HubConnectionBuilder()
    .withUrl('https://api.example.com/hubs/notifications',
        options: HttpConnectionOptions(accessTokenFactory: () async => tokens.access ?? ''))
    .withAutomaticReconnect()
    .build();

hub.on('transferCompleted', (args) => print('Giao dịch xong: $args'));
await hub.start();
`),
      h('Push notification với FCM'),
      ul(
        'App Flutter đăng ký và lấy **FCM token**, gửi lên backend (`POST /api/devices`) kèm user id.',
        'Backend lưu token, và khi có sự kiện gọi Firebase Admin SDK để gửi.',
        'Dọn token hết hạn (FCM trả lỗi `UNREGISTERED`) để không gửi vào token chết.',
        'Không đặt dữ liệu nhạy cảm trong nội dung notification; gửi id rồi để app tải chi tiết.'
      ),
      code('csharp', raw`
// dotnet add package FirebaseAdmin
var message = new Message
{
    Token = deviceToken,
    Notification = new Notification { Title = "Chuyển tiền thành công", Body = "Bạn đã nhận 500.000đ" },
    Data = new Dictionary<string, string> { ["transferId"] = transferId.ToString() }
};
await FirebaseMessaging.DefaultInstance.SendAsync(message);
`),
      h('Upload file'),
      code('csharp', raw`
app.MapPost("/api/avatar", async (IFormFile file, IBlobStorage storage, ClaimsPrincipal user) =>
{
    if (file.Length is 0 or > 2 * 1024 * 1024) return Results.BadRequest("File phải nhỏ hơn 2MB.");
    if (file.ContentType is not ("image/jpeg" or "image/png")) return Results.BadRequest("Chỉ nhận JPEG hoặc PNG.");

    await using var stream = file.OpenReadStream();
    var url = await storage.UploadAsync(stream, $"avatars/{Guid.NewGuid()}.jpg");
    return Results.Ok(new { url });
}).DisableAntiforgery().RequireAuthorization();
`),
      warn('Luôn kiểm tra kích thước, loại file và đặt tên file do server tạo (không tin tên file từ client). File lớn nên upload thẳng lên Blob Storage bằng URL có chữ ký ngắn hạn (SAS) thay vì đi qua API.')
    ],
    takeaways: [
      'SignalR phù hợp thông báo realtime; có client cho Flutter.',
      'Lưu FCM token theo user/thiết bị và dọn token hết hạn.',
      'Kiểm tra chặt file upload; file lớn dùng SAS upload trực tiếp.'
    ],
    practice: 'Dựng một `NotificationHub` đơn giản và dùng Postman hoặc app Flutter nhỏ nhận sự kiện khi bạn gọi một endpoint.',
    links: [
      { title: 'SignalR in ASP.NET Core', url: 'https://learn.microsoft.com/aspnet/core/signalr/introduction' },
      { title: 'Firebase Cloud Messaging', url: 'https://firebase.google.com/docs/cloud-messaging' }
    ]
  },
  {
    id: 'mob-banking',
    title: 'Backend tài chính: idempotency, audit, đối soát',
    detail: 'Idempotency key, double-entry ledger, audit log, concurrency và xử lý lỗi từng phần.',
    minutes: 40,
    flutter: 'App của bạn có thể gửi cùng một yêu cầu chuyển tiền hai lần khi mạng chập chờn (người dùng bấm lại, hoặc interceptor retry). Backend phải đảm bảo tiền chỉ bị trừ một lần.',
    blocks: [
      h('1. Idempotency key'),
      p('Client sinh một khóa duy nhất cho mỗi **ý định** chuyển tiền và gửi trong header. Server lưu kết quả theo khóa này; nhận lại cùng khóa thì trả đúng kết quả cũ, không xử lý lại.'),
      code('csharp', raw`
public class IdempotencyRecord
{
    public string Key { get; set; } = "";          // unique index (UserId + Key)
    public int UserId { get; set; }
    public string RequestHash { get; set; } = "";  // phát hiện cùng key nhưng nội dung khác
    public int StatusCode { get; set; }
    public string ResponseBody { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

app.MapPost("/api/transfers", async (
    [FromHeader(Name = "Idempotency-Key")] string? key, TransferRequest req, AppDb db, ClaimsPrincipal user, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(key)) return Results.BadRequest("Thiếu Idempotency-Key.");
    var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    var existing = await db.IdempotencyRecords.FirstOrDefaultAsync(r => r.UserId == userId && r.Key == key, ct);
    if (existing is not null)
        return Results.Content(existing.ResponseBody, "application/json", statusCode: existing.StatusCode);

    // ... thực hiện chuyển tiền trong transaction, rồi lưu IdempotencyRecord trong CÙNG transaction
    // Unique index trên (UserId, Key) chặn hai request song song cùng key: một bên sẽ lỗi, xử lý bằng cách đọc lại kết quả
    return Results.Ok();
});
`),
      h('2. Sổ cái kép (double-entry ledger)'),
      p('Đừng chỉ lưu `Balance` rồi cộng trừ. Hãy ghi mọi biến động tiền thành các dòng **bất biến** (không bao giờ sửa/xóa), và số dư là kết quả của các dòng đó. Mỗi giao dịch có ít nhất hai bút toán ghi nợ/ghi có cân bằng nhau.'),
      code('csharp', raw`
public class LedgerEntry
{
    public long Id { get; set; }
    public Guid TransactionId { get; set; }
    public int AccountId { get; set; }
    public decimal Amount { get; set; }           // dương: ghi có, âm: ghi nợ
    public string Currency { get; set; } = "VND";
    public DateTime CreatedAt { get; set; }
}
// Quy tắc: tổng Amount của một TransactionId luôn bằng 0
`),
      h('3. Những nguyên tắc khác'),
      ul(
        '**decimal** (hoặc số nguyên theo đơn vị nhỏ nhất) cho tiền; tuyệt đối không dùng `double`.',
        '**Audit log** bất biến: ai, làm gì, lúc nào, từ đâu, trước/sau thay đổi.',
        '**Concurrency**: rowversion hoặc cập nhật số dư bằng một câu SQL atomic có điều kiện.',
        '**Transaction** bao toàn bộ: ledger + cập nhật số dư + idempotency record + outbox.',
        '**Outbox** để gửi thông báo/sự kiện sau khi commit, không gửi giữa transaction.',
        '**Trạng thái giao dịch rõ ràng**: Pending → Completed/Failed; không để trạng thái "lửng lơ" khi gọi hệ thống ngoài.',
        '**Đối soát (reconciliation)**: job so khớp số liệu nội bộ với đối tác, xử lý chênh lệch.'
      ),
      warn('Gọi hệ thống bên ngoài (ngân hàng đối tác) **không nằm trong** transaction DB. Hãy lưu giao dịch ở trạng thái Pending trước, gọi đối tác, rồi cập nhật kết quả; xử lý trường hợp timeout bằng cách truy vấn lại trạng thái, không đoán thất bại.')
    ],
    takeaways: [
      'Idempotency key bảo vệ khỏi trừ tiền hai lần khi client retry.',
      'Lưu biến động tiền thành các dòng bất biến thay vì chỉ sửa số dư.',
      'Không có transaction DB nào bao được lời gọi hệ thống ngoài: dùng trạng thái Pending và đối soát.'
    ],
    practice: 'Hiện thực `POST /transfers` có Idempotency-Key, ledger kép, rowversion và một integration test gửi cùng request hai lần song song.',
    links: [
      { title: 'Idempotency (Stripe docs)', url: 'https://docs.stripe.com/api/idempotent_requests' },
      { title: 'Retry pattern', url: 'https://learn.microsoft.com/azure/architecture/patterns/retry' }
    ]
  }
]
