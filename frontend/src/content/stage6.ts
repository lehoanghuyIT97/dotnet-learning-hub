import { code, h, Lesson, p, raw, table, tip, ul, warn } from './helpers'

export const stage6Lessons: Lesson[] = [
  {
    id: 'ops-caching',
    title: 'Caching: MemoryCache, HybridCache và Redis',
    detail: 'Cache-aside, hết hạn, invalidation và cache phân tán.',
    minutes: 30,
    blocks: [
      p('Cache giảm tải DB và giảm độ trễ, nhưng đổi lại bạn phải xử lý dữ liệu cũ (stale). Câu hỏi quan trọng nhất: **khi nào dữ liệu trong cache được phép sai, và sai trong bao lâu?**'),
      table(['Loại cache', 'Phạm vi', 'Khi nào dùng'], [
        ['`IMemoryCache`', 'Trong process của một instance', 'Một instance, dữ liệu ít, chấp nhận mất khi restart'],
        ['`IDistributedCache` (Redis)', 'Chia sẻ giữa nhiều instance', 'Nhiều instance (scale out), session, dữ liệu dùng chung'],
        ['`HybridCache` (.NET 9+)', 'L1 trong bộ nhớ + L2 phân tán', 'Mặc định tốt: nhanh, có chống "cache stampede"']
      ]),
      h('Cache-aside'),
      code('csharp', raw`
builder.Services.AddHybridCache();      // thêm Redis làm L2 bằng AddStackExchangeRedisCache

app.MapGet("/api/categories", async (HybridCache cache, AppDb db, CancellationToken ct) =>
{
    var categories = await cache.GetOrCreateAsync(
        "categories:all",
        async token => await db.Categories.AsNoTracking().ToListAsync(token),   // chỉ chạy khi cache miss
        new HybridCacheEntryOptions { Expiration = TimeSpan.FromMinutes(10) },
        cancellationToken: ct);
    return Results.Ok(categories);
});

// Khi dữ liệu thay đổi, xóa cache để người dùng thấy dữ liệu mới
await cache.RemoveAsync("categories:all", ct);
`),
      h('Những điều cần nhớ'),
      ul(
        'Luôn đặt thời gian hết hạn (TTL). Cache không hết hạn là một cái bẫy.',
        'Đặt tên key có cấu trúc: `entity:id:version`.',
        '**Invalidation** là phần khó nhất. Chỉ cache dữ liệu đọc nhiều, ít đổi.',
        'Không cache dữ liệu theo người dùng nếu key không chứa user id (lộ dữ liệu giữa người dùng).',
        'Cache stampede: nhiều request cùng miss một lúc dồn xuống DB. `HybridCache` đã gộp các request này.'
      ),
      code('bash', raw`
# Chạy Redis local bằng Docker
docker run -d --name redis -p 6379:6379 redis:7
`),
      warn('Đừng dùng cache để che giấu truy vấn chậm. Hãy sửa truy vấn/index trước, cache sau.')
    ],
    takeaways: [
      'Chọn loại cache theo số instance: memory cho một instance, Redis/Hybrid cho nhiều instance.',
      'Luôn đặt TTL và có chiến lược invalidation.',
      'Sửa truy vấn chậm trước khi nghĩ đến cache.'
    ],
    practice: 'Cache danh sách danh mục bằng `HybridCache`, đo thời gian response trước/sau, và xóa cache khi có danh mục mới.',
    links: [
      { title: 'Caching overview', url: 'https://learn.microsoft.com/aspnet/core/performance/caching/overview' },
      { title: 'HybridCache', url: 'https://learn.microsoft.com/aspnet/core/performance/caching/hybrid' }
    ]
  },
  {
    id: 'ops-background',
    title: 'Background job và Message Broker',
    detail: 'BackgroundService, hàng đợi, RabbitMQ/Kafka, outbox pattern.',
    minutes: 35,
    blocks: [
      p('Không phải việc gì cũng nên xử lý trong request: gửi email, sinh báo cáo, đồng bộ dữ liệu... nên chạy nền để API trả lời nhanh.'),
      h('BackgroundService'),
      code('csharp', raw`
public class ReminderWorker(IServiceScopeFactory scopeFactory, ILogger<ReminderWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();            // BackgroundService là Singleton nên tự tạo scope
                var db = scope.ServiceProvider.GetRequiredService<AppDb>();
                // ... xử lý
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Reminder run failed");               // không để worker chết vì một lỗi
            }
        }
    }
}

builder.Services.AddHostedService<ReminderWorker>();
`),
      h('Hàng đợi trong process: Channel'),
      code('csharp', raw`
var channel = Channel.CreateBounded<EmailJob>(100);
await channel.Writer.WriteAsync(new EmailJob("an@example.com", "Welcome"));
await foreach (var job in channel.Reader.ReadAllAsync(ct)) { /* gửi email */ }
`),
      p('Channel chỉ sống trong một process: restart là mất việc. Với việc quan trọng, cần hàng đợi bền vững (message broker) hoặc thư viện job (Hangfire, Quartz.NET).'),
      h('Message broker'),
      table(['', 'RabbitMQ / Azure Service Bus', 'Kafka'], [
        ['Mô hình', 'Hàng đợi / publish-subscribe', 'Log sự kiện phân vùng, lưu lâu dài'],
        ['Mạnh ở', 'Tác vụ, routing linh hoạt, retry/dead-letter', 'Lưu lượng cực lớn, replay sự kiện'],
        ['Phù hợp', 'Hầu hết ứng dụng nghiệp vụ', 'Streaming, event sourcing, phân tích']
      ]),
      h('Outbox pattern'),
      p('Vấn đề: bạn ghi DB xong rồi gửi message, nếu process chết giữa hai bước thì DB đã đổi nhưng message không được gửi (hoặc ngược lại). **Outbox**: ghi message vào một bảng `Outbox` trong **cùng transaction** với dữ liệu nghiệp vụ, một worker riêng đọc bảng này và gửi lên broker, gửi xong mới đánh dấu đã xử lý.'),
      code('csharp', raw`
db.Orders.Add(order);
db.OutboxMessages.Add(new OutboxMessage { Type = "OrderCreated", Payload = JsonSerializer.Serialize(new { order.Id }) });
await db.SaveChangesAsync();        // một transaction cho cả hai
`),
      warn('Broker thường đảm bảo "ít nhất một lần" (at-least-once), nên consumer phải **idempotent**: xử lý cùng một message hai lần không gây sai lệch.')
    ],
    takeaways: [
      'Việc nặng, việc chậm đưa vào background thay vì request.',
      'BackgroundService là Singleton: tự tạo scope để dùng DbContext.',
      'Dùng Outbox để đảm bảo dữ liệu và message nhất quán; consumer phải idempotent.'
    ],
    practice: 'Viết `BackgroundService` mỗi phút đếm số ghi chú và log ra. Sau đó mô phỏng lỗi và đảm bảo worker không bị dừng.',
    links: [
      { title: 'Background tasks with hosted services', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/host/hosted-services' },
      { title: 'Transactional outbox pattern', url: 'https://learn.microsoft.com/azure/architecture/databases/guide/transactional-outbox-cosmos' }
    ]
  },
  {
    id: 'ops-docker',
    title: 'Docker cho ứng dụng .NET',
    detail: 'Multi-stage Dockerfile, docker compose với database và container từ SDK.',
    minutes: 30,
    flutter: 'Docker giúp backend chạy giống nhau ở mọi nơi, giống như bạn cố định version Flutter bằng FVM cho cả team.',
    blocks: [
      code('dockerfile', raw`
# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/DotNetLearning.Api/DotNetLearning.Api.csproj backend/DotNetLearning.Api/
RUN dotnet restore backend/DotNetLearning.Api/DotNetLearning.Api.csproj
COPY backend/ backend/
RUN dotnet publish backend/DotNetLearning.Api/DotNetLearning.Api.csproj -c Release -o /app/publish --no-restore

# Stage 2: runtime (nhỏ hơn nhiều, không có SDK)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "DotNetLearning.Api.dll"]
`, 'Dockerfile'),
      p('Copy file `csproj` và `restore` trước khi copy toàn bộ source để tận dụng cache layer: chỉ khi package đổi thì mới restore lại.'),
      h('docker compose với SQL Server'),
      code('yaml', raw`
services:
  api:
    build: .
    ports: ["5080:8080"]
    environment:
      DatabaseProvider: SqlServer
      ConnectionStrings__DefaultConnection: "Server=db;Database=learninghub;User Id=sa;Password=Your_strong_Pass123;TrustServerCertificate=True"
      AllowedOrigins: "http://localhost:5173"
    depends_on: [db]

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "Your_strong_Pass123"
    ports: ["1433:1433"]
    volumes: [dbdata:/var/opt/mssql]

volumes:
  dbdata:
`, 'docker-compose.yml'),
      code('bash', raw`
docker compose up --build
docker compose logs -f api
docker compose down
`),
      h('Container không cần Dockerfile'),
      p('SDK .NET có thể tạo image trực tiếp:'),
      code('bash', raw`
dotnet publish backend/DotNetLearning.Api -t:PublishContainer -c Release
`),
      warn('Mật khẩu trong ví dụ chỉ để học. Trên môi trường thật, truyền secret qua biến môi trường/secret store, không ghi vào file commit.'),
      tip('Apple Silicon (M1/M2/...) chạy image SQL Server x64 qua giả lập có thể chậm hoặc lỗi. Khi học, bạn có thể dùng SQLite hoặc PostgreSQL để nhẹ hơn.')
    ],
    takeaways: [
      'Dùng multi-stage để image runtime nhỏ và an toàn.',
      'Copy csproj và restore trước để cache layer hiệu quả.',
      'Secret đi qua biến môi trường, không nằm trong image hoặc repo.'
    ],
    practice: 'Viết Dockerfile cho backend của project này, build và chạy container, rồi gọi `http://localhost:5080/health`.',
    links: [
      { title: 'Containerize a .NET app', url: 'https://learn.microsoft.com/dotnet/core/docker/build-container' },
      { title: 'Docker Get Started', url: 'https://docs.docker.com/get-started/' }
    ]
  },
  {
    id: 'ops-cicd-azure',
    title: 'CI/CD và Azure App Service',
    detail: 'GitHub Actions, path filter, secret, App Settings và Azure SQL.',
    minutes: 30,
    blocks: [
      p('Backend của project này đang được deploy bằng GitHub Actions lên Azure App Service. Hãy đọc file `.github/workflows/deploy-api.yml` để thấy một pipeline thật.'),
      code('yaml', raw`
name: Deploy Backend to Azure

on:
  push:
    branches: [main]
    paths:
      - 'backend/DotNetLearning.Api/**'      # chỉ chạy khi backend đổi
      - '.github/workflows/deploy-api.yml'
  workflow_dispatch:                          # cho phép bấm chạy tay

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '10.0.x' }
      - run: dotnet test                       # nên có bước test trước khi deploy
      - run: dotnet publish backend/DotNetLearning.Api -c Release -o ./publish
      - uses: azure/webapps-deploy@v3
        with:
          app-name: dotnet-learning-hub-api
          publish-profile: ${"$"}{{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE }}
          package: ./publish
`, 'deploy-api.yml (rút gọn)'),
      h('Những khái niệm cần nắm'),
      ul(
        '**CI** (build + test mỗi lần push) và **CD** (tự deploy sau khi qua test).',
        '**Path filter**: tránh build backend khi chỉ đổi frontend (và ngược lại). `workflow_dispatch` luôn chạy toàn bộ, không áp dụng path filter.',
        '**Secrets**: lưu trong GitHub Settings, truy cập bằng `secrets.NAME`, không bao giờ in ra log.',
        '**App Settings** trên Azure: nơi đặt `DatabaseProvider`, `ConnectionStrings__DefaultConnection`, `AllowedOrigins`.',
        '**Deployment slots**: deploy vào slot staging, kiểm tra, rồi swap sang production để không downtime.',
        'Nâng cao: dùng OIDC (federated credentials) thay cho publish profile để không phải lưu secret dài hạn.'
      ),
      h('Checklist đưa lên production'),
      ul(
        'Health check endpoint (`/health`) và cấu hình kiểm tra sức khỏe trên App Service.',
        'Chuyển từ `EnsureCreated` sang migrations và có bước migrate rõ ràng.',
        'Chuyển SQLite sang Azure SQL (SQLite trên App Service dễ mất dữ liệu khi scale/redeploy).',
        'Bật HTTPS only, cấu hình CORS đúng origin, tắt Swagger nếu không cần công khai.',
        'Bật logging/Application Insights và đặt cảnh báo.'
      ),
      warn('Không đặt dữ liệu quan trọng vào file SQLite trên App Service: file hệ thống có thể bị reset hoặc không chia sẻ giữa các instance khi scale out.')
    ],
    takeaways: [
      'Pipeline tối thiểu: restore, build, test, publish, deploy.',
      '`workflow_dispatch` bỏ qua path filter: đó là lý do bấm tay sẽ build cả backend.',
      'Cấu hình production đi qua App Settings/Key Vault, không nằm trong code.'
    ],
    practice: 'Thêm bước `dotnet test` vào workflow, tạo một deployment slot staging và thử swap.',
    links: [
      { title: 'Deploy to App Service with GitHub Actions', url: 'https://learn.microsoft.com/azure/app-service/deploy-github-actions' },
      { title: 'GitHub Actions docs', url: 'https://docs.github.com/actions' }
    ]
  },
  {
    id: 'ops-observability',
    title: 'Observability: log, metric, trace, health check',
    detail: 'Serilog, OpenTelemetry, health checks và cảnh báo.',
    minutes: 30,
    blocks: [
      p('**Observability** là khả năng hiểu hệ thống đang làm gì từ dữ liệu nó phát ra: **logs** (sự kiện), **metrics** (số liệu theo thời gian), **traces** (đường đi của một request qua nhiều thành phần).'),
      h('Health checks'),
      code('csharp', raw`
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDb>("database");

app.MapHealthChecks("/health/ready");                         // sẵn sàng nhận traffic (kiểm tra DB)
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });   // process còn sống
`),
      h('Structured logging với Serilog'),
      code('csharp', raw`
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());

app.UseSerilogRequestLogging();     // mỗi request một dòng log gọn

// Gắn correlation id để theo dõi một request xuyên suốt các log
app.Use(async (ctx, next) =>
{
    var id = ctx.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
    ctx.Response.Headers["X-Correlation-Id"] = id;
    using (LogContext.PushProperty("CorrelationId", id)) await next();
});
`),
      h('OpenTelemetry'),
      p('OpenTelemetry là chuẩn mở để thu thập metrics và traces, xuất ra Azure Monitor/Application Insights, Grafana, Jaeger... Bạn thêm instrumentation một lần, đổi backend lưu trữ dễ dàng.'),
      code('csharp', raw`
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddEntityFrameworkCoreInstrumentation())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddRuntimeInstrumentation());
`),
      h('Những gì nên theo dõi'),
      ul(
        'Tỷ lệ lỗi 5xx, độ trễ (p50/p95/p99), số request/giây.',
        'Thời gian truy vấn DB, số kết nối, lỗi timeout.',
        'Kích thước hàng đợi và độ trễ xử lý job nền.',
        'Cảnh báo (alert) khi vượt ngưỡng, kèm cách xử lý (runbook).'
      ),
      tip('Bạn đã dùng Crashlytics hoặc Sentry ở app Flutter: đây là phiên bản dành cho backend. Có thể dùng chính Sentry cho .NET.')
    ],
    takeaways: [
      'Ba trụ cột: logs, metrics, traces.',
      'Tách health check "live" và "ready".',
      'Gắn correlation id để truy vết một request qua nhiều log.'
    ],
    practice: 'Thêm `/health/ready` kiểm tra DB và `X-Correlation-Id` vào mọi log của project này.',
    links: [
      { title: 'Health checks', url: 'https://learn.microsoft.com/aspnet/core/host-and-deploy/health-checks' },
      { title: '.NET observability with OpenTelemetry', url: 'https://learn.microsoft.com/dotnet/core/diagnostics/observability-with-otel' }
    ]
  },
  {
    id: 'ops-resilience',
    title: 'Hiệu năng và Resilience',
    detail: 'HttpClientFactory, retry/timeout/circuit breaker, nén, giới hạn và đo hiệu năng.',
    minutes: 25,
    blocks: [
      p('Hệ thống thật luôn có lỗi tạm thời: mạng chập chờn, dịch vụ ngoài chậm, DB quá tải. **Resilience** là thiết kế để chịu được những tình huống đó.'),
      code('csharp', raw`
builder.Services.AddHttpClient<IPaymentClient, PaymentClient>(c =>
{
    c.BaseAddress = new Uri("https://payments.example.com");
    c.Timeout = TimeSpan.FromSeconds(10);
})
.AddStandardResilienceHandler();    // retry, timeout, circuit breaker, rate limiter mặc định hợp lý
`),
      table(['Kỹ thuật', 'Mục đích'], [
        ['Timeout', 'Không chờ vô hạn một dịch vụ chậm'],
        ['Retry + backoff + jitter', 'Thử lại lỗi tạm thời, tránh dồn sóng đồng loạt'],
        ['Circuit breaker', 'Ngừng gọi dịch vụ đang hỏng để nó hồi phục'],
        ['Bulkhead / giới hạn đồng thời', 'Một phần hỏng không kéo sập cả hệ thống'],
        ['Idempotency', 'Retry không gây tác dụng phụ lặp (ví dụ trừ tiền hai lần)']
      ]),
      warn('Chỉ retry thao tác **idempotent** hoặc có idempotency key. Retry một lệnh chuyển tiền không idempotent có thể trừ tiền hai lần.'),
      h('Danh sách việc tối ưu hay có hiệu quả'),
      ul(
        'Async tới cùng, truyền `CancellationToken`.',
        'Phân trang, projection, `AsNoTracking`, index đúng.',
        'Bật response compression: `AddResponseCompression`.',
        'Cache dữ liệu đọc nhiều (bài Caching).',
        'Đo trước khi tối ưu: dùng `dotnet-counters`, `dotnet-trace` hoặc Application Insights để tìm nút cổ chai thật.',
        'Dùng `BenchmarkDotNet` để so sánh hiệu năng đoạn code nhỏ.'
      ),
      tip('Đừng tối ưu theo cảm giác. Một truy vấn thiếu index thường gây chậm gấp hàng trăm lần so với bất kỳ tinh chỉnh code nào.')
    ],
    takeaways: [
      'Thiết kế cho lỗi tạm thời: timeout, retry có backoff, circuit breaker.',
      'Chỉ retry thao tác idempotent.',
      'Đo đạc trước khi tối ưu.'
    ],
    practice: 'Gọi một API công khai có thể lỗi qua `AddStandardResilienceHandler`, giả lập lỗi và quan sát retry trong log.',
    links: [
      { title: 'HTTP resilience in .NET', url: 'https://learn.microsoft.com/dotnet/core/resilience/http-resilience' },
      { title: 'Performance best practices', url: 'https://learn.microsoft.com/aspnet/core/performance/performance-best-practices' }
    ]
  }
]
