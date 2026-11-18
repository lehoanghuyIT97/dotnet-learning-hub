import { code, h, Lesson, p, raw, table, tip, ul, warn } from './helpers'

export const stage2Lessons: Lesson[] = [
  {
    id: 'api-http-rest',
    title: 'HTTP và REST từ phía server',
    detail: 'Method, status code, header, thiết kế resource và quy ước lỗi.',
    minutes: 25,
    flutter: 'Bạn đã gọi API từ phía client hàng trăm lần. Giờ bạn là bên thiết kế contract: mọi quyết định ở đây sẽ ảnh hưởng đến app mobile đã phát hành.',
    blocks: [
      h('Method và tính chất'),
      table(['Method', 'Mục đích', 'Safe', 'Idempotent'], [
        ['GET', 'Đọc dữ liệu', 'Có', 'Có'],
        ['POST', 'Tạo mới / hành động', 'Không', 'Không'],
        ['PUT', 'Thay thế toàn bộ resource', 'Không', 'Có'],
        ['PATCH', 'Cập nhật một phần', 'Không', 'Không bắt buộc'],
        ['DELETE', 'Xóa', 'Không', 'Có']
      ]),
      p('**Idempotent** nghĩa là gọi nhiều lần cho cùng kết quả. Điều này quyết định client có được phép retry an toàn hay không, và là nền tảng của bài idempotency key ở phần Banking.'),
      h('Status code hay dùng'),
      table(['Code', 'Khi nào'], [
        ['200 OK / 201 Created / 204 No Content', 'Thành công (201 kèm header `Location`)'],
        ['400 Bad Request', 'Dữ liệu đầu vào sai định dạng hoặc không hợp lệ'],
        ['401 Unauthorized', 'Chưa đăng nhập hoặc token sai/hết hạn'],
        ['403 Forbidden', 'Đã đăng nhập nhưng không có quyền'],
        ['404 Not Found', 'Không có resource'],
        ['409 Conflict', 'Xung đột trạng thái (trùng dữ liệu, concurrency)'],
        ['422 Unprocessable Entity', 'Hợp lệ về cú pháp nhưng vi phạm luật nghiệp vụ'],
        ['429 Too Many Requests', 'Bị giới hạn tốc độ'],
        ['500 / 503', 'Lỗi server / dịch vụ tạm thời không sẵn sàng']
      ]),
      h('Thiết kế resource'),
      code('http', raw`
GET    /api/notes              # danh sách (hỗ trợ ?page=1&pageSize=20&search=dotnet)
GET    /api/notes/12           # chi tiết
POST   /api/notes              # tạo, trả 201 + Location: /api/notes/12
PUT    /api/notes/12           # cập nhật
DELETE /api/notes/12           # xóa, trả 204
`),
      ul(
        'Dùng danh từ số nhiều cho resource: `/orders`, không dùng `/getOrders`.',
        'Dùng quan hệ lồng nhau vừa phải: `/orders/12/items`.',
        'Hành động không thuộc CRUD có thể đặt tên rõ: `POST /orders/12/cancel`.',
        'Danh sách luôn có phân trang, giới hạn `pageSize` tối đa.',
        'Dùng một định dạng lỗi thống nhất (ProblemDetails, xem bài Middleware).'
      ),
      tip('Đây là lúc bạn nên nghĩ như người thiết kế API cho mobile: app cũ ngoài kia vẫn gọi API của bạn, nên thay đổi phải tương thích ngược.')
    ],
    takeaways: [
      'Biết method nào idempotent để quyết định retry an toàn.',
      '401 là chưa xác thực, 403 là không đủ quyền.',
      'Danh sách luôn cần phân trang và giới hạn kích thước.'
    ],
    practice: 'Thiết kế (viết ra giấy) bộ endpoint cho quản lý ghi chú và tiến độ học: method, URL, request, response và status code cho từng trường hợp thành công/lỗi.',
    links: [
      { title: 'HTTP overview (MDN)', url: 'https://developer.mozilla.org/docs/Web/HTTP/Overview' },
      { title: 'Web API design guidance', url: 'https://learn.microsoft.com/azure/architecture/best-practices/api-design' }
    ]
  },
  {
    id: 'api-project-structure',
    title: 'Cấu trúc project và Program.cs',
    detail: 'WebApplication builder, Kestrel, pipeline, launchSettings và Minimal API so với Controller.',
    minutes: 25,
    flutter: '`Program.cs` giống `main()` kết hợp với nơi đăng ký service (như `get_it`/`ProviderScope`) và nơi khai báo route.',
    blocks: [
      p('Một ASP.NET Core app là một process console khởi chạy web server **Kestrel**. Toàn bộ cấu hình nằm trong `Program.cs` với hai giai đoạn: đăng ký service vào DI và cấu hình pipeline xử lý request.'),
      code('csharp', raw`
var builder = WebApplication.CreateBuilder(args);

// Giai đoạn 1: đăng ký service
builder.Services.AddDbContext<LearningDbContext>(o => o.UseSqlite("Data Source=app.db"));
builder.Services.AddCors();

var app = builder.Build();

// Giai đoạn 2: pipeline (thứ tự quan trọng)
app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();
`, 'Program.cs'),
      h('Hai kiểu viết endpoint'),
      table(['', 'Minimal API', 'Controller'], [
        ['Cách viết', 'Hàm lambda gắn vào `MapGet/MapPost`', 'Class kế thừa `ControllerBase`'],
        ['Phù hợp', 'API nhỏ/vừa, microservice', 'API lớn, nhiều convention, filter'],
        ['Trong project này', 'Đang dùng (xem `Program.cs`)', 'Sẽ học ở bài tiếp theo']
      ]),
      p('Cả hai đều chạy trên cùng một pipeline và đều tốt cho production. Với team lớn hoặc code legacy bạn sẽ thấy Controller nhiều, còn project mới thường bắt đầu bằng Minimal API và dùng `MapGroup` để tổ chức.'),
      h('launchSettings.json'),
      code('json', raw`
{
  "profiles": {
    "DotNetLearning.Api": {
      "commandName": "Project",
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5080",
      "environmentVariables": { "ASPNETCORE_ENVIRONMENT": "Development" }
    }
  }
}
`),
      p('File này chỉ dùng khi chạy local (`dotnet run`). Nó đặt URL và biến môi trường `ASPNETCORE_ENVIRONMENT` (`Development`, `Staging`, `Production`). Môi trường quyết định file `appsettings.{Environment}.json` được nạp.'),
      tip('Hãy mở `backend/DotNetLearning.Api/Program.cs` của project này và đọc lại: bạn sẽ thấy đủ ba phần: đăng ký service, pipeline và route.')
    ],
    takeaways: [
      'Program.cs có hai giai đoạn: đăng ký service rồi cấu hình pipeline.',
      'Minimal API và Controller cùng chạy trên một pipeline.',
      '`ASPNETCORE_ENVIRONMENT` quyết định cấu hình nào được nạp.'
    ],
    practice: 'Tạo `dotnet new webapi`, thêm endpoint `GET /ping` trả về thời gian server (UTC), rồi chạy bằng `dotnet watch`.',
    links: [
      { title: 'ASP.NET Core fundamentals', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/' },
      { title: 'Minimal APIs overview', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis/overview' }
    ]
  },
  {
    id: 'api-routing',
    title: 'Routing, Controller và Minimal API',
    detail: 'Attribute routing, model binding, kết quả trả về và MapGroup.',
    minutes: 30,
    blocks: [
      h('Minimal API với MapGroup'),
      code('csharp', raw`
var notes = app.MapGroup("/api/notes");

notes.MapGet("/", async (AppDb db, CancellationToken ct) =>
    TypedResults.Ok(await db.Notes.AsNoTracking().ToListAsync(ct)));

notes.MapGet("/{id:int}", async (int id, AppDb db) =>
    await db.Notes.FindAsync(id) is { } note
        ? TypedResults.Ok(note)
        : Results.NotFound());

notes.MapPost("/", async (NoteRequest req, AppDb db) =>
{
    var note = new Note { Title = req.Title, Content = req.Content };
    db.Notes.Add(note);
    await db.SaveChangesAsync();
    return TypedResults.Created($"/api/notes/{note.Id}", note);
});
`),
      h('Controller'),
      code('csharp', raw`
[ApiController]
[Route("api/[controller]")]
public class NotesController(AppDb db) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Note>> Get(int id, CancellationToken ct)
    {
        var note = await db.Notes.FindAsync([id], ct);
        return note is null ? NotFound() : Ok(note);
    }

    [HttpPost]
    public async Task<ActionResult<Note>> Create(NoteRequest req)
    {
        var note = new Note { Title = req.Title, Content = req.Content };
        db.Notes.Add(note);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = note.Id }, note);
    }
}
`),
      h('Model binding: dữ liệu đến từ đâu?'),
      table(['Nguồn', 'Attribute', 'Ví dụ'], [
        ['Route', '`[FromRoute]`', '`/notes/12`'],
        ['Query string', '`[FromQuery]`', '`?page=2&search=ef`'],
        ['Body (JSON)', '`[FromBody]`', 'Request body'],
        ['Header', '`[FromHeader]`', '`X-Request-Id`'],
        ['DI service', '`[FromServices]`', 'Service được inject']
      ]),
      p('Với `[ApiController]` hoặc Minimal API, .NET tự suy luận nguồn: kiểu phức tạp lấy từ body, kiểu đơn giản lấy từ route hoặc query. Bạn chỉ cần ghi attribute khi muốn chỉ rõ.'),
      h('Route constraint'),
      code('text', raw`
/{id:int}        chỉ nhận số nguyên
/{id:guid}       chỉ nhận Guid
/{slug:minlength(3)}
`),
      tip('Dùng `TypedResults` thay cho `Results` để có kiểu trả về rõ ràng, giúp OpenAPI sinh tài liệu chính xác hơn.')
    ],
    takeaways: [
      'Dùng `MapGroup` để gom nhóm route và chung cấu hình (auth, prefix).',
      'Model binding tự suy luận nguồn dữ liệu, nhưng bạn có thể chỉ rõ.',
      'Trả `201 Created` kèm `Location` khi tạo mới.'
    ],
    practice: 'Viết CRUD cho `Todo` bằng Minimal API trước, sau đó viết lại bằng Controller để cảm nhận khác biệt.',
    links: [
      { title: 'Routing in ASP.NET Core', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/routing' },
      { title: 'Create a web API with controllers', url: 'https://learn.microsoft.com/aspnet/core/web-api/' }
    ]
  },
  {
    id: 'api-dto-validation',
    title: 'DTO, Validation và JSON',
    detail: 'Tách entity khỏi DTO, validate dữ liệu, cấu hình System.Text.Json.',
    minutes: 30,
    flutter: 'Giống tách `Model` (API) khỏi `Entity` (domain) trong Clean Architecture ở Flutter. Mục đích là không lộ cấu trúc DB ra API.',
    blocks: [
      p('**Entity** là hình dạng dữ liệu trong DB. **DTO** (Data Transfer Object) là hình dạng dữ liệu trên API. Không bao giờ trả entity trực tiếp: bạn sẽ lộ cột nhạy cảm (`PasswordHash`), dính vòng lặp tham chiếu khi serialize và khóa chặt API vào schema DB.'),
      code('csharp', raw`
public class User            // entity
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}

public record CreateUserRequest(string Email, string Password);   // input
public record UserResponse(int Id, string Email);                  // output

app.MapPost("/api/users", async (CreateUserRequest req, AppDb db) =>
{
    var user = new User { Email = req.Email.Trim().ToLowerInvariant(), PasswordHash = Hash(req.Password) };
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return TypedResults.Created($"/api/users/{user.Id}", new UserResponse(user.Id, user.Email));
});
`),
      h('Validation bằng Data Annotations'),
      code('csharp', raw`
public class CreateOrderRequest
{
    [Required, StringLength(100)]
    public string CustomerName { get; set; } = "";

    [Range(1, 1_000_000)]
    public decimal Amount { get; set; }

    [EmailAddress]
    public string? Email { get; set; }
}
`),
      p('Với Controller có `[ApiController]`, request không hợp lệ tự trả `400` kèm `ValidationProblemDetails`. Với Minimal API (.NET 10) bạn bật validation bằng `builder.Services.AddValidation()`. Với luật phức tạp, dùng thư viện **FluentValidation** để viết rule bằng code.'),
      h('JSON: System.Text.Json'),
      ul(
        'Mặc định ASP.NET Core serialize property sang `camelCase`: `UserName` thành `userName`, khớp với convention Dart.',
        'Dùng `[JsonPropertyName("user_name")]` để đổi tên từng field.',
        'Enum nên trả dạng chuỗi: `JsonStringEnumConverter` để mobile đọc `"Paid"` thay vì số.',
        'Property `null` có thể bỏ qua bằng `DefaultIgnoreCondition = WhenWritingNull`.'
      ),
      code('csharp', raw`
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
`),
      warn('Không tin dữ liệu từ client: validate ở server dù app Flutter đã validate. Đừng dùng entity làm request body (lỗi over-posting: client gửi thêm field như `IsAdmin`).')
    ],
    takeaways: [
      'Luôn tách DTO khỏi entity.',
      'Validate ở server, bất kể client đã validate.',
      'Cấu hình JSON thống nhất (camelCase, enum dạng chuỗi) để mobile dễ parse.'
    ],
    practice: 'Thêm validation cho `CreateTodoRequest` (title bắt buộc, tối đa 200 ký tự) và gọi thử bằng Swagger để xem định dạng lỗi 400.',
    links: [
      { title: 'Model validation', url: 'https://learn.microsoft.com/aspnet/core/mvc/models/validation' },
      { title: 'System.Text.Json overview', url: 'https://learn.microsoft.com/dotnet/standard/serialization/system-text-json/overview' }
    ]
  },
  {
    id: 'api-di',
    title: 'Dependency Injection và service lifetime',
    detail: 'Singleton, Scoped, Transient, captive dependency và Options pattern.',
    minutes: 30,
    flutter: 'DI trong ASP.NET Core là built-in, tương tự `get_it` (`registerSingleton` / `registerFactory`) hoặc Riverpod providers, nhưng thêm khái niệm Scoped theo từng request.',
    blocks: [
      code('csharp', raw`
builder.Services.AddSingleton<IClock, SystemClock>();        // 1 instance cho cả app
builder.Services.AddScoped<IOrderService, OrderService>();   // 1 instance cho mỗi request
builder.Services.AddTransient<IEmailBuilder, EmailBuilder>();// tạo mới mỗi lần được yêu cầu

public class OrderService(AppDb db, IClock clock, ILogger<OrderService> logger) : IOrderService
{
    // db, clock, logger được inject qua constructor
}
`),
      table(['Lifetime', 'Vòng đời', 'Dùng cho', 'Tương tự bên Flutter'], [
        ['Singleton', 'Cả app', 'Cache, config, `HttpClient` factory (phải thread-safe)', '`registerSingleton`'],
        ['Scoped', 'Một HTTP request', '`DbContext`, service nghiệp vụ', 'Không có sẵn (gần với provider theo màn hình)'],
        ['Transient', 'Mỗi lần resolve', 'Object nhẹ, không giữ state', '`registerFactory`']
      ]),
      warn('**Captive dependency**: Singleton không được phụ thuộc Scoped (ví dụ Singleton giữ `DbContext`). `DbContext` sẽ sống mãi và không thread-safe. Môi trường Development sẽ báo lỗi này khi bật `ValidateScopes`.'),
      h('Options pattern: cấu hình có kiểu'),
      code('csharp', raw`
public class JwtOptions
{
    public string Issuer { get; set; } = "";
    public int ExpiresMinutes { get; set; } = 60;
}

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

public class TokenService(IOptions<JwtOptions> options)
{
    private readonly JwtOptions _jwt = options.Value;
}
`),
      h('Keyed services (từ .NET 8)'),
      code('csharp', raw`
builder.Services.AddKeyedSingleton<IPaymentGateway, MomoGateway>("momo");
builder.Services.AddKeyedSingleton<IPaymentGateway, VnpayGateway>("vnpay");

app.MapPost("/pay", ([FromKeyedServices("momo")] IPaymentGateway gw) => gw.PayAsync());
`),
      tip('Quy tắc đơn giản: cái gì có state theo request hoặc dùng DB thì để Scoped, cái gì không state thì Transient, cái gì đắt để tạo và thread-safe thì Singleton.')
    ],
    takeaways: [
      'Scoped = một instance mỗi request, đây là lifetime mặc định cho service nghiệp vụ và DbContext.',
      'Singleton phải thread-safe và không phụ thuộc service Scoped.',
      'Dùng Options pattern thay vì đọc config bằng chuỗi key khắp nơi.'
    ],
    practice: 'Tạo `IClock` và `SystemClock`, inject vào một service, rồi viết một `FakeClock` để thay thế khi test.',
    links: [
      { title: 'Dependency injection', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/dependency-injection' },
      { title: 'Options pattern', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/configuration/options' }
    ]
  },
  {
    id: 'api-middleware',
    title: 'Middleware và xử lý lỗi tập trung',
    detail: 'Request pipeline, middleware tự viết, ProblemDetails, IExceptionHandler và CORS.',
    minutes: 30,
    flutter: 'Middleware giống Interceptor của Dio: mỗi cái nhận request, làm việc rồi gọi cái tiếp theo, và có thể xử lý response/lỗi khi quay ngược lại.',
    blocks: [
      p('Mỗi request đi qua một chuỗi middleware theo **thứ tự đăng ký**. Thứ tự sai là nguồn lỗi kinh điển (ví dụ `UseAuthorization` trước `UseAuthentication`).'),
      code('csharp', raw`
app.UseExceptionHandler();      // 1. bắt lỗi từ các bước phía sau
app.UseHttpsRedirection();
app.UseCors("Frontend");        // 2. CORS trước auth
app.UseAuthentication();        // 3. xác định bạn là ai
app.UseAuthorization();         // 4. kiểm tra bạn được làm gì
app.MapControllers();           // 5. endpoint
`),
      h('Middleware tự viết'),
      code('csharp', raw`
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();
    await next(context);                         // chuyển cho middleware kế tiếp
    sw.Stop();
    app.Logger.LogInformation("{Method} {Path} -> {Status} in {Ms}ms",
        context.Request.Method, context.Request.Path, context.Response.StatusCode, sw.ElapsedMilliseconds);
});
`),
      h('Xử lý lỗi tập trung với ProblemDetails'),
      p('Thay vì try/catch ở từng endpoint, hãy bắt lỗi ở một chỗ và trả JSON theo chuẩn **ProblemDetails** (RFC 9457) để client xử lý đồng nhất.'),
      code('csharp', raw`
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException => (404, "Resource not found"),
            ConflictException => (409, "Conflict"),
            _ => (500, "Unexpected error")
        };
        if (status == 500) logger.LogError(ex, "Unhandled exception");

        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title }, ct);
        return true;
    }
}
`),
      code('json', raw`
{
  "type": "about:blank",
  "title": "Resource not found",
  "status": 404
}
`, 'Response lỗi thống nhất'),
      h('CORS'),
      p('CORS chỉ áp dụng cho trình duyệt (Flutter Web, web app), không áp dụng cho app mobile native. Trong project này, `AllowedOrigins` cấu hình danh sách origin được phép. Khi frontend chạy ở origin mới, hãy thêm vào đó.'),
      warn('Đừng dùng `AllowAnyOrigin` cùng với cookie/credentials trên production. Liệt kê rõ origin được phép.')
    ],
    takeaways: [
      'Thứ tự middleware quyết định hành vi: lỗi → CORS → auth → endpoint.',
      'Xử lý lỗi tập trung và trả ProblemDetails thống nhất cho client.',
      'CORS chỉ ảnh hưởng client chạy trên trình duyệt.'
    ],
    practice: 'Viết `GlobalExceptionHandler` ánh xạ `NotFoundException` thành 404 và `ConflictException` thành 409, rồi test bằng Swagger.',
    links: [
      { title: 'Middleware', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/middleware/' },
      { title: 'Handle errors in ASP.NET Core APIs', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/error-handling' }
    ]
  },
  {
    id: 'api-config-logging',
    title: 'Configuration và Logging',
    detail: 'appsettings, biến môi trường, user-secrets, ILogger và structured logging.',
    minutes: 25,
    flutter: 'Giống `--dart-define` và flavor trong Flutter: cùng một build nhưng đổi cấu hình theo môi trường mà không sửa code.',
    blocks: [
      h('Thứ tự nạp cấu hình (sau đè trước)'),
      ul(
        '1. `appsettings.json`',
        '2. `appsettings.{Environment}.json`',
        '3. User secrets (chỉ Development)',
        '4. Biến môi trường',
        '5. Tham số dòng lệnh'
      ),
      p('Biến môi trường dùng `__` (hai gạch dưới) thay cho dấu `:` của JSON. Ví dụ `ConnectionStrings:DefaultConnection` thành `ConnectionStrings__DefaultConnection` (cách bạn cấu hình trên Azure App Service).'),
      code('bash', raw`
# Lưu bí mật khi dev, không nằm trong repo
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Password=..."
dotnet user-secrets list

# Production: dùng biến môi trường / App Service Settings
export ConnectionStrings__DefaultConnection="Server=...;Password=..."
export DatabaseProvider=SqlServer
`),
      warn('Không bao giờ commit connection string hoặc secret vào git. Dùng user-secrets cho local, Azure Key Vault hoặc App Settings cho production.'),
      h('Logging với ILogger'),
      code('csharp', raw`
public class PaymentService(ILogger<PaymentService> logger)
{
    public void Process(int orderId, decimal amount)
    {
        // ĐÚNG: structured logging, giữ OrderId và Amount thành field có thể truy vấn
        logger.LogInformation("Processing payment for order {OrderId} amount {Amount}", orderId, amount);

        // SAI: nội suy chuỗi làm mất cấu trúc
        // logger.LogInformation($"Processing payment for order {orderId}");
    }
}
`),
      table(['Level', 'Dùng khi'], [
        ['Trace / Debug', 'Chi tiết khi phát triển'],
        ['Information', 'Sự kiện bình thường quan trọng'],
        ['Warning', 'Bất thường nhưng vẫn chạy được'],
        ['Error', 'Thao tác thất bại'],
        ['Critical', 'Hệ thống không thể tiếp tục']
      ]),
      code('json', raw`
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
`, 'appsettings.json'),
      tip('Đừng log dữ liệu nhạy cảm (mật khẩu, token, số thẻ, thông tin cá nhân). Đây cũng là lý do nên dùng structured logging có chủ đích.')
    ],
    takeaways: [
      'Cấu hình nạp theo lớp: file → môi trường → secrets → env var.',
      'Secret không nằm trong git: user-secrets / Key Vault / App Settings.',
      'Dùng message template của ILogger, không nội suy chuỗi.'
    ],
    practice: 'Thêm `Jwt` section vào appsettings, đọc bằng Options pattern và log một dòng khi app khởi động (không log secret).',
    links: [
      { title: 'Configuration', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/configuration/' },
      { title: 'Logging', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/logging/' }
    ]
  },
  {
    id: 'api-openapi',
    title: 'OpenAPI và tài liệu API',
    detail: 'Sinh tài liệu, Swagger UI/Scalar, và sinh client Dart từ OpenAPI.',
    minutes: 20,
    flutter: 'Đây là cầu nối tuyệt vời cho bạn: từ file OpenAPI, bạn có thể sinh luôn client Dart cho app Flutter thay vì viết tay.',
    blocks: [
      p('**OpenAPI** là chuẩn mô tả API (JSON/YAML). Tài liệu này dùng cho UI thử API, sinh client code và kiểm thử contract. Project này đang dùng **Swashbuckle** (`AddSwaggerGen`, `UseSwaggerUI`). Từ .NET 9, template mặc định dùng gói `Microsoft.AspNetCore.OpenApi`.'),
      code('csharp', raw`
// Cách built-in (.NET 9+)
builder.Services.AddOpenApi();
...
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();          // phục vụ tại /openapi/v1.json
}
`),
      p('Built-in chỉ sinh file JSON. Để có giao diện thử API, thêm một UI như **Scalar** (`Scalar.AspNetCore`) hoặc tiếp tục dùng Swagger UI.'),
      h('Làm tài liệu có ích'),
      code('csharp', raw`
app.MapGet("/api/notes/{id:int}", GetNote)
   .WithName("GetNote")
   .WithSummary("Lấy chi tiết một ghi chú")
   .Produces<Note>(StatusCodes.Status200OK)
   .ProducesProblem(StatusCodes.Status404NotFound);
`),
      h('Sinh client Dart cho Flutter'),
      p('Có nhiều công cụ đọc OpenAPI và sinh model + client cho Dart (ví dụ `openapi-generator` hoặc các package như `swagger_parser`). Lợi ích: model Dart luôn khớp contract backend, giảm lỗi parse JSON.'),
      code('bash', raw`
# Ví dụ dùng openapi-generator (cần cài trước)
openapi-generator-cli generate \
  -i http://localhost:5080/swagger/v1/swagger.json \
  -g dart-dio \
  -o ./flutter_app/lib/api_client
`),
      tip('Thử ngay trong project này: chạy backend rồi mở `http://localhost:5080/swagger` để gọi API progress và notes.')
    ],
    takeaways: [
      'OpenAPI là hợp đồng giữa backend và mọi client.',
      'Ghi rõ response (`Produces`, `ProducesProblem`) để tài liệu chính xác.',
      'Có thể sinh client Dart từ OpenAPI để tiết kiệm công sức.'
    ],
    practice: 'Mở Swagger của project này, tải file swagger.json và thử sinh một client Dart bằng công cụ bạn chọn.',
    links: [
      { title: 'OpenAPI in ASP.NET Core', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/openapi/overview' },
      { title: 'OpenAPI Initiative', url: 'https://www.openapis.org/' }
    ]
  }
]
