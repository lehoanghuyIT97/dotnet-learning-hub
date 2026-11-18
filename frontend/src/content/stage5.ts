import { code, h, Lesson, p, raw, table, tip, ul, warn } from './helpers'

export const stage5Lessons: Lesson[] = [
  {
    id: 'arch-solid',
    title: 'SOLID với ví dụ C#',
    detail: 'SRP, OCP, LSP, ISP, DIP và cách chúng xuất hiện trong code backend.',
    minutes: 30,
    flutter: 'Bạn đã áp dụng SOLID khi tách Repository, UseCase, BLoC trong Flutter. Ở backend, nguyên lý giống hệt, chỉ khác tên lớp.',
    blocks: [
      h('S: Single Responsibility'),
      p('Mỗi class chỉ có một lý do để thay đổi. Controller chỉ nhận request và trả response, logic nghiệp vụ ở service, truy cập dữ liệu ở repository/DbContext.'),
      code('csharp', raw`
// Vi phạm: một class làm tất cả
public class OrderController
{
    public async Task<IResult> Create(OrderRequest r)
    {
        // validate, tính giá, ghi DB, gửi email, ghi log... tất cả ở đây
    }
}

// Tốt hơn: tách trách nhiệm
public class OrderService(IOrderRepository repo, IPriceCalculator calc, IEmailSender email) { ... }
`),
      h('O: Open/Closed'),
      p('Mở để mở rộng, đóng để sửa đổi. Thêm hành vi mới bằng cách thêm class, không sửa code cũ.'),
      code('csharp', raw`
public interface IDiscountRule { decimal Apply(Order order); }

public class VipDiscount : IDiscountRule { public decimal Apply(Order o) => o.Customer.IsVip ? o.Total * 0.1m : 0; }
public class BulkDiscount : IDiscountRule { public decimal Apply(Order o) => o.Items.Count > 10 ? 50_000m : 0; }

public class PriceCalculator(IEnumerable<IDiscountRule> rules)    // DI tự inject tất cả rule đã đăng ký
{
    public decimal Discount(Order o) => rules.Sum(r => r.Apply(o));
}
`),
      h('L: Liskov Substitution'),
      p('Class con phải thay thế được class cha mà không làm hỏng hành vi. Nếu class con ném `NotImplementedException` cho method của cha, thiết kế đang sai.'),
      h('I: Interface Segregation'),
      p('Nhiều interface nhỏ, tập trung tốt hơn một interface to. Client không nên bị ép phụ thuộc vào method nó không dùng.'),
      code('csharp', raw`
// Thay vì IRepository<T> có 15 method cho mọi thứ:
public interface IOrderReader { Task<Order?> GetAsync(int id); Task<IReadOnlyList<Order>> ListAsync(); }
public interface IOrderWriter { Task AddAsync(Order o); }
`),
      h('D: Dependency Inversion'),
      p('Module cấp cao không phụ thuộc module cấp thấp; cả hai phụ thuộc abstraction. Đây là lý do DI container tồn tại.'),
      code('csharp', raw`
public class OrderService(IClock clock, IPaymentGateway gateway)   // phụ thuộc interface
{
    public Task PayAsync(Order o) => gateway.ChargeAsync(o.Total, clock.UtcNow);
}
builder.Services.AddScoped<IPaymentGateway, MomoGateway>();     // đổi implementation ở một nơi
`),
      warn('Đừng áp dụng SOLID một cách máy móc: tạo interface cho mọi class chỉ vì "nguyên tắc" sẽ làm code rối. Chỉ tạo abstraction khi có nhu cầu thật (nhiều implementation, cần mock, ranh giới kiến trúc).')
    ],
    takeaways: [
      'SRP và DIP là hai nguyên lý bạn áp dụng thường xuyên nhất ở backend.',
      'DI container là công cụ hiện thực DIP.',
      'Thêm abstraction khi có lý do rõ, không tạo interface vô tội vạ.'
    ],
    practice: 'Lấy một service dài trong code của bạn (hoặc viết thử `OrderService`) rồi tách theo SRP và biến luật giảm giá thành `IDiscountRule`.',
    links: [
      { title: 'Architectural principles', url: 'https://learn.microsoft.com/dotnet/architecture/modern-web-apps-azure/architectural-principles' }
    ]
  },
  {
    id: 'arch-clean',
    title: 'Layered và Clean Architecture',
    detail: 'Domain, Application, Infrastructure, Api và quy tắc phụ thuộc.',
    minutes: 35,
    flutter: 'Rất giống Clean Architecture bạn đã dùng ở Flutter (presentation / domain / data). Lớp domain không biết gì về framework hay database.',
    blocks: [
      table(['Flutter', '.NET (Clean Architecture)', 'Trách nhiệm'], [
        ['domain (entity, usecase, repository interface)', 'Domain + Application', 'Luật nghiệp vụ, use case, interface'],
        ['data (repository impl, datasource)', 'Infrastructure', 'EF Core, HTTP client, email, file storage'],
        ['presentation (UI, BLoC)', 'Api (controller/endpoint)', 'Nhận request, trả response, DI, auth']
      ]),
      code('text', raw`
src/
├── MyApp.Domain/          # entity, value object, domain rule. Không phụ thuộc gì
├── MyApp.Application/     # use case, interface (IOrderRepository), DTO. Phụ thuộc Domain
├── MyApp.Infrastructure/  # EF Core, repository impl, email. Phụ thuộc Application
└── MyApp.Api/             # endpoint, DI, middleware. Phụ thuộc tất cả để kết nối
tests/
├── MyApp.UnitTests/
└── MyApp.IntegrationTests/
`, 'Cấu trúc solution'),
      p('**Quy tắc phụ thuộc**: mũi tên phụ thuộc luôn hướng vào trong (Api → Infrastructure → Application → Domain). Domain không bao giờ tham chiếu EF Core hay ASP.NET.'),
      code('csharp', raw`
// Application: định nghĩa interface
public interface IAccountRepository
{
    Task<Account?> GetAsync(int id, CancellationToken ct);
}

// Infrastructure: hiện thực bằng EF Core
public class AccountRepository(AppDb db) : IAccountRepository
{
    public Task<Account?> GetAsync(int id, CancellationToken ct) =>
        db.Accounts.FirstOrDefaultAsync(a => a.Id == id, ct);
}

// Api: ghép lại bằng DI
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
`),
      h('Vertical slice: phương án thay thế'),
      p('Thay vì chia theo tầng kỹ thuật, bạn chia theo tính năng: mỗi tính năng (CreateOrder, GetOrder) chứa endpoint, handler, validator, DTO cùng một thư mục. Dễ điều hướng hơn khi dự án lớn. Nhiều team kết hợp: Clean Architecture ở mức solution, vertical slice trong lớp Application.'),
      warn('Với app nhỏ như project này, Clean Architecture đầy đủ có thể là "over-engineering". Hãy bắt đầu đơn giản (Minimal API + service), tách lớp khi độ phức tạp thực sự tăng.')
    ],
    takeaways: [
      'Phụ thuộc luôn đi từ ngoài vào trong; Domain độc lập framework.',
      'Interface đặt ở Application, hiện thực ở Infrastructure.',
      'Chọn mức kiến trúc theo độ phức tạp thực tế của dự án.'
    ],
    practice: 'Tạo solution gồm 4 project (Domain, Application, Infrastructure, Api) cho bài toán quản lý tài khoản, đảm bảo Domain không tham chiếu package nào.',
    links: [
      { title: '.NET architecture guides', url: 'https://learn.microsoft.com/dotnet/architecture/' },
      { title: 'Common web application architectures', url: 'https://learn.microsoft.com/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures' }
    ]
  },
  {
    id: 'arch-repository',
    title: 'Repository, Unit of Work và EF Core',
    detail: 'Khi nào nên (và không nên) bọc EF Core bằng repository.',
    minutes: 20,
    blocks: [
      p('`DbContext` của EF Core đã là một **Unit of Work** (gom thay đổi, `SaveChanges` là commit) và `DbSet<T>` đã giống một **Repository**. Bọc thêm một lớp repository chung chung (`IRepository<T>` với `GetAll`, `Add`...) thường không mang lại lợi ích và còn che mất sức mạnh của LINQ.'),
      table(['Cách làm', 'Ưu điểm', 'Nhược điểm'], [
        ['Dùng DbContext trực tiếp trong handler/service', 'Đơn giản, tận dụng đầy đủ EF, ít code', 'Logic dễ gắn chặt với EF'],
        ['Repository theo aggregate (`IOrderRepository`)', 'Che giấu truy cập dữ liệu, dễ mock', 'Nhiều code, dễ rò rỉ `IQueryable`'],
        ['Generic `IRepository<T>`', 'Ít code lặp', 'Che mất LINQ, khó tối ưu, thường là anti-pattern']
      ]),
      h('Lời khuyên thực tế'),
      ul(
        'Dự án nhỏ/vừa: dùng `DbContext` trực tiếp trong service/handler, kiểm thử bằng integration test với DB thật (SQLite in-memory hoặc container).',
        'Nếu dùng repository: thiết kế theo **aggregate** và method có ý nghĩa nghiệp vụ (`GetOpenOrdersForCustomerAsync`), đừng lộ `IQueryable` ra ngoài.',
        'Tách truy vấn đọc phức tạp (báo cáo) ra khỏi repository: dùng query riêng với projection hoặc SQL thô.'
      ),
      code('csharp', raw`
public interface IOrderRepository
{
    Task<Order?> GetWithItemsAsync(int id, CancellationToken ct);
    Task AddAsync(Order order, CancellationToken ct);
}

public class OrderRepository(AppDb db) : IOrderRepository
{
    public Task<Order?> GetWithItemsAsync(int id, CancellationToken ct) =>
        db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task AddAsync(Order order, CancellationToken ct) => await db.Orders.AddAsync(order, ct);
    // SaveChanges được gọi bởi Unit of Work (DbContext) ở tầng use case
}
`),
      tip('Không có đáp án tuyệt đối. Điều quan trọng là bạn biết lý do mình chọn và nhất quán trong toàn dự án.')
    ],
    takeaways: [
      'DbContext đã là Unit of Work; DbSet đã giống Repository.',
      'Generic repository thường không đáng giá, repository theo aggregate thì có.',
      'Đừng để `IQueryable` rò rỉ ra ngoài tầng truy cập dữ liệu.'
    ],
    practice: 'Viết hai phiên bản của use case "tạo đơn hàng": một dùng DbContext trực tiếp, một dùng `IOrderRepository`, rồi so sánh khối lượng code và độ dễ test.',
    links: [
      { title: 'Infrastructure persistence layer design', url: 'https://learn.microsoft.com/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design' }
    ]
  },
  {
    id: 'arch-cqrs',
    title: 'CQRS, Mediator và Result pattern',
    detail: 'Tách command/query, handler, pipeline behavior và xử lý lỗi bằng Result.',
    minutes: 30,
    blocks: [
      p('**CQRS** tách thao tác ghi (Command: thay đổi trạng thái) khỏi thao tác đọc (Query: chỉ trả dữ liệu). Mỗi use case là một handler nhỏ, dễ test, dễ thêm cross-cutting concern (logging, validation, transaction).'),
      code('csharp', raw`
public record CreateOrderCommand(int CustomerId, List<OrderItemDto> Items);
public record GetOrderQuery(int Id);

public class CreateOrderHandler(AppDb db, IClock clock)
{
    public async Task<Result<int>> HandleAsync(CreateOrderCommand cmd, CancellationToken ct)
    {
        if (cmd.Items.Count == 0) return Result.Failure<int>("Đơn hàng phải có ít nhất một sản phẩm.");

        var order = Order.Create(cmd.CustomerId, cmd.Items, clock.UtcNow);
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        return Result.Success(order.Id);
    }
}

app.MapPost("/api/orders", async (CreateOrderCommand cmd, CreateOrderHandler h, CancellationToken ct) =>
{
    var result = await h.HandleAsync(cmd, ct);
    return result.IsSuccess ? Results.Created($"/api/orders/{result.Value}", null) : Results.UnprocessableEntity(new { error = result.Error });
});
`),
      h('Mediator'),
      p('Mediator (như thư viện **MediatR**) cho phép gọi `await mediator.Send(command)` và thêm "pipeline behavior" (validation, logging, transaction) áp dụng cho mọi request. Lưu ý: MediatR (và AutoMapper) đã chuyển sang mô hình giấy phép thương mại cho một số trường hợp sử dụng, hãy kiểm tra điều khoản trước khi dùng cho công việc. Có các lựa chọn khác như thư viện Mediator dùng source generator, hoặc tự viết dispatcher nhỏ.'),
      h('Result pattern thay cho exception'),
      p('Với lỗi **dự kiến** (không đủ số dư, dữ liệu không hợp lệ), trả một `Result` thay vì ném exception: nhanh hơn, tường minh trong chữ ký hàm và buộc người gọi xử lý.'),
      code('csharp', raw`
public readonly record struct Result<T>(bool IsSuccess, T? Value, string? Error)
{
    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}
`),
      h('Mapping'),
      ul(
        'Mapping tay (constructor, `Select`) là lựa chọn rõ ràng, dễ debug và hiệu năng tốt nhất.',
        'Thư viện như Mapster hoặc AutoMapper giúp giảm code lặp nhưng che giấu logic, hãy dùng có chọn lọc.'
      ),
      tip('CQRS không bắt buộc phải có hai database. Với hầu hết ứng dụng, chỉ cần tách code đọc/ghi và giữ một DB.')
    ],
    takeaways: [
      'Mỗi use case là một handler nhỏ: dễ test và mở rộng.',
      'Dùng Result cho lỗi nghiệp vụ dự kiến, exception cho lỗi bất ngờ.',
      'Kiểm tra giấy phép của thư viện (MediatR, AutoMapper) trước khi dùng cho công việc.'
    ],
    practice: 'Viết `TransferMoneyCommand` + handler trả `Result`, với các lỗi dự kiến: tài khoản không tồn tại, không đủ số dư, số tiền không hợp lệ.',
    links: [
      { title: 'CQRS pattern', url: 'https://learn.microsoft.com/azure/architecture/patterns/cqrs' }
    ]
  },
  {
    id: 'arch-unit-test',
    title: 'Unit test với xUnit và mocking',
    detail: 'Arrange-Act-Assert, Fact/Theory, mock dependency và nguyên tắc test tốt.',
    minutes: 30,
    flutter: 'Giống `flutter_test` + `mocktail`: group/test/expect trở thành class/[Fact]/Assert, `when(...)` trở thành `Substitute.For`/`Setup`.',
    blocks: [
      code('bash', raw`
dotnet new xunit -n MyApp.UnitTests
cd MyApp.UnitTests
dotnet add reference ../src/MyApp.Application/MyApp.Application.csproj
dotnet add package NSubstitute
dotnet test
`),
      code('csharp', raw`
public class PriceCalculatorTests
{
    [Fact]
    public void Discount_ForVipCustomer_Returns10Percent()
    {
        // Arrange
        var calc = new PriceCalculator([new VipDiscount()]);
        var order = new Order { Total = 1_000_000m, Customer = new Customer { IsVip = true } };

        // Act
        var discount = calc.Discount(order);

        // Assert
        Assert.Equal(100_000m, discount);
    }

    [Theory]                                // chạy cùng test với nhiều bộ dữ liệu
    [InlineData(0, 0)]
    [InlineData(5, 0)]
    [InlineData(11, 50_000)]
    public void BulkDiscount_DependsOnItemCount(int items, decimal expected)
    {
        var order = new Order { Items = Enumerable.Range(0, items).Select(_ => new OrderItem()).ToList() };
        Assert.Equal(expected, new BulkDiscount().Apply(order));
    }
}
`),
      h('Mock dependency'),
      code('csharp', raw`
[Fact]
public async Task Pay_WhenGatewayFails_ReturnsFailure()
{
    var gateway = Substitute.For<IPaymentGateway>();
    gateway.ChargeAsync(Arg.Any<decimal>(), Arg.Any<DateTime>())
           .Returns(Task.FromException(new TimeoutException()));
    var clock = Substitute.For<IClock>();
    clock.UtcNow.Returns(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));

    var service = new PaymentService(gateway, clock);

    var result = await service.PayAsync(new Order { Total = 100m });

    Assert.False(result.IsSuccess);
}
`),
      h('Nguyên tắc'),
      ul(
        'Một test kiểm tra một hành vi, tên test mô tả rõ: `Method_Scenario_Expected`.',
        'Test nhanh, độc lập, không phụ thuộc thứ tự và không gọi mạng/DB thật.',
        'Mock những thứ ở rìa (cổng thanh toán, email, đồng hồ), không mock logic bạn đang test.',
        'Inject `IClock` hoặc `TimeProvider` để test code phụ thuộc thời gian.'
      ),
      tip('Về thư viện: Moq từng gây tranh cãi về telemetry, còn FluentAssertions từ bản 8 dùng giấy phép thương mại cho một số trường hợp. NSubstitute, Shouldly hoặc `Assert` có sẵn của xUnit là lựa chọn an toàn. Hãy kiểm tra điều khoản hiện hành.')
    ],
    takeaways: [
      'Dùng `[Fact]` cho test đơn, `[Theory]` cho nhiều bộ dữ liệu.',
      'Mock phần rìa, không mock logic cần test.',
      'Inject `TimeProvider`/`IClock` để kiểm soát thời gian trong test.'
    ],
    practice: 'Viết ít nhất 6 unit test cho `TransferMoneyHandler` (thành công, không đủ số dư, tài khoản không tồn tại, số tiền âm...).',
    links: [
      { title: 'Unit testing in .NET', url: 'https://learn.microsoft.com/dotnet/core/testing/unit-testing-with-dotnet-test' },
      { title: 'xUnit.net', url: 'https://xunit.net/' }
    ]
  },
  {
    id: 'arch-integration-test',
    title: 'Integration test với WebApplicationFactory',
    detail: 'Test API end-to-end trong bộ nhớ, thay DB bằng SQLite hoặc container.',
    minutes: 30,
    flutter: 'Giống `integration_test` nhưng cho backend: gọi HTTP thật vào app chạy trong process test.',
    blocks: [
      p('Unit test không phát hiện lỗi cấu hình DI, route sai, JSON serialize sai hay SQL sai. **Integration test** khởi động toàn bộ app trong bộ nhớ và gọi bằng `HttpClient`.'),
      code('csharp', raw`
// Program.cs cần để app test được truy cập:
public partial class Program;     // đặt ở cuối file Program.cs

public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // thay DbContext thật bằng SQLite in-memory
            var descriptor = services.Single(d => d.ServiceType == typeof(DbContextOptions<LearningDbContext>));
            services.Remove(descriptor);

            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();                                     // giữ mở để DB tồn tại suốt test
            services.AddDbContext<LearningDbContext>(o => o.UseSqlite(connection));
        });
    }
}

public class NotesApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task CreateNote_ThenGet_ReturnsCreatedNote()
    {
        var client = factory.CreateClient();

        var created = await client.PostAsJsonAsync("/api/notes", new { title = "EF Core", content = "DbContext" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var list = await client.GetFromJsonAsync<List<NoteDto>>("/api/notes");
        Assert.Contains(list!, n => n.Title == "EF Core");
    }
}
`),
      h('SQLite in-memory hay DB thật?'),
      table(['', 'SQLite in-memory', 'Testcontainers (SQL Server thật)'], [
        ['Tốc độ', 'Rất nhanh', 'Chậm hơn (khởi động container)'],
        ['Độ chính xác', 'Khác SQL Server ở một số hành vi', 'Giống production'],
        ['Cần', 'Không cần Docker', 'Docker']
      ]),
      p('Khuyến nghị: dùng SQLite cho phần lớn test nhanh, và Testcontainers cho các test quan trọng liên quan SQL đặc thù (transaction, concurrency, rowversion).'),
      tip('Dự án của bạn đang chạy SQLite và SQL Server qua cấu hình, đây là lý do nên có ít nhất một nhóm test chạy trên DB thật.')
    ],
    takeaways: [
      'Integration test bắt lỗi cấu hình mà unit test bỏ sót.',
      '`WebApplicationFactory` chạy app trong bộ nhớ, bạn có thể thay service.',
      'Kết hợp SQLite (nhanh) với Testcontainers (chính xác) hợp lý.'
    ],
    practice: 'Viết integration test cho `GET/PUT /api/progress` của project này bằng `WebApplicationFactory` và SQLite in-memory.',
    links: [
      { title: 'Integration tests in ASP.NET Core', url: 'https://learn.microsoft.com/aspnet/core/test/integration-tests' },
      { title: 'Testcontainers for .NET', url: 'https://dotnet.testcontainers.org/' }
    ]
  }
]
