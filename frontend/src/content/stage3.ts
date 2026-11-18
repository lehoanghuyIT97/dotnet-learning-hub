import { code, h, Lesson, p, raw, table, tip, ul, warn } from './helpers'

export const stage3Lessons: Lesson[] = [
  {
    id: 'db-sql',
    title: 'SQL nền tảng',
    detail: 'SELECT, JOIN, GROUP BY, subquery, CTE và CRUD.',
    minutes: 40,
    flutter: 'Nếu bạn từng dùng `sqflite` hoặc `drift`, bạn đã biết SQL cơ bản. Ở backend, điểm khác là quy mô dữ liệu và nhiều người dùng đồng thời.',
    blocks: [
      p('SQL là nền tảng bắt buộc dù bạn dùng ORM như EF Core. Bạn cần đọc được SQL mà EF sinh ra để tối ưu và debug. Các ví dụ dưới dùng bảng `Customers` và `Orders`.'),
      code('sql', raw`
-- Lọc, sắp xếp, phân trang
SELECT Id, Name, Email
FROM Customers
WHERE IsActive = 1 AND Name LIKE 'A%'
ORDER BY Name
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;   -- SQL Server; SQLite/Postgres dùng LIMIT 10 OFFSET 20
`, 'SELECT cơ bản'),
      h('JOIN'),
      code('sql', raw`
-- INNER JOIN: chỉ khách có đơn hàng
SELECT c.Name, o.Id AS OrderId, o.Total
FROM Customers c
INNER JOIN Orders o ON o.CustomerId = c.Id;

-- LEFT JOIN: tất cả khách, kể cả chưa có đơn (cột order là NULL)
SELECT c.Name, COUNT(o.Id) AS OrderCount
FROM Customers c
LEFT JOIN Orders o ON o.CustomerId = c.Id
GROUP BY c.Name;
`),
      h('GROUP BY, HAVING, subquery, CTE'),
      code('sql', raw`
-- Khách có tổng chi tiêu > 1 triệu
SELECT CustomerId, SUM(Total) AS TotalSpent
FROM Orders
GROUP BY CustomerId
HAVING SUM(Total) > 1000000;

-- CTE: tách bước cho dễ đọc
WITH Spent AS (
    SELECT CustomerId, SUM(Total) AS TotalSpent
    FROM Orders
    GROUP BY CustomerId
)
SELECT c.Name, s.TotalSpent
FROM Spent s
JOIN Customers c ON c.Id = s.CustomerId
ORDER BY s.TotalSpent DESC;
`),
      h('Thay đổi dữ liệu'),
      code('sql', raw`
INSERT INTO Customers (Name, Email) VALUES ('An', 'an@example.com');
UPDATE Customers SET IsActive = 0 WHERE Id = 5;
DELETE FROM Orders WHERE CreatedAt < '2020-01-01';
`),
      warn('`UPDATE` và `DELETE` luôn phải có `WHERE`. Hãy `SELECT` trước với cùng điều kiện để kiểm tra số dòng ảnh hưởng.'),
      tip('Bạn có thể luyện SQL ngay trên SQLite (file `learninghub.db` của project này) bằng DB Browser for SQLite hoặc extension SQLite trong editor.')
    ],
    takeaways: [
      'Nắm vững JOIN (INNER/LEFT), GROUP BY/HAVING và subquery/CTE.',
      'Luôn phân trang truy vấn danh sách.',
      '`UPDATE`/`DELETE` bắt buộc có `WHERE`.'
    ],
    practice: 'Tạo bảng `Students`, `Classes`, `Enrollments` trong SQLite và viết 5 truy vấn: danh sách lớp kèm sĩ số, sinh viên chưa đăng ký lớp nào, top 3 lớp đông nhất.',
    links: [
      { title: 'SQL tutorial (W3Schools)', url: 'https://www.w3schools.com/sql/' },
      { title: 'T-SQL reference', url: 'https://learn.microsoft.com/sql/t-sql/language-reference' }
    ]
  },
  {
    id: 'db-index-transaction',
    title: 'Index, Transaction và Isolation',
    detail: 'Index hoạt động ra sao, ACID, isolation level và execution plan.',
    minutes: 35,
    blocks: [
      h('Index'),
      p('Index giống mục lục của sách: giúp tìm nhanh nhưng làm chậm ghi và tốn dung lượng. Nguyên tắc: index cho cột thường xuất hiện trong `WHERE`, `JOIN`, `ORDER BY`.'),
      code('sql', raw`
CREATE INDEX IX_Orders_CustomerId ON Orders (CustomerId);

-- Composite index: thứ tự cột quan trọng (lọc theo CustomerId trước, rồi sắp theo CreatedAt)
CREATE INDEX IX_Orders_Customer_Created ON Orders (CustomerId, CreatedAt DESC);

-- Unique index: đảm bảo không trùng
CREATE UNIQUE INDEX UX_Users_Email ON Users (Email);
`),
      ul(
        'Hàm bọc cột (`WHERE LOWER(Email) = ...`) thường làm index không được dùng.',
        '`LIKE \'%abc\'` (bắt đầu bằng `%`) không dùng được index thông thường.',
        'Dùng execution plan để xem truy vấn đang Index Seek (tốt) hay Table Scan (chậm trên bảng lớn).'
      ),
      h('Transaction và ACID'),
      table(['Chữ cái', 'Ý nghĩa'], [
        ['Atomicity', 'Hoặc tất cả thành công, hoặc không gì cả'],
        ['Consistency', 'Dữ liệu luôn hợp lệ theo ràng buộc'],
        ['Isolation', 'Các transaction đồng thời không làm hỏng nhau'],
        ['Durability', 'Đã commit thì không mất dữ liệu']
      ]),
      code('sql', raw`
BEGIN TRANSACTION;
    UPDATE Accounts SET Balance = Balance - 500000 WHERE Id = 1;
    UPDATE Accounts SET Balance = Balance + 500000 WHERE Id = 2;
COMMIT;      -- lỗi giữa chừng thì ROLLBACK, không bên nào bị trừ/cộng dở dang
`, 'Chuyển tiền'),
      h('Isolation level (SQL Server)'),
      table(['Level', 'Bảo vệ khỏi', 'Ghi chú'], [
        ['Read Uncommitted', 'Không gì', 'Có thể đọc dữ liệu chưa commit (dirty read)'],
        ['Read Committed', 'Dirty read', 'Mặc định của SQL Server'],
        ['Repeatable Read', 'Non-repeatable read', 'Giữ khóa đọc'],
        ['Serializable', 'Phantom read', 'An toàn nhất nhưng chậm, dễ deadlock'],
        ['Snapshot', 'Đọc nhất quán theo thời điểm', 'Dựa trên row versioning, ít khóa hơn']
      ]),
      tip('Hãy hiểu isolation ở mức đủ dùng: biết vì sao hai request cùng trừ tiền một tài khoản có thể sai nếu không có khóa hoặc kiểm tra concurrency (bài sau).')
    ],
    takeaways: [
      'Index đúng cột giúp đọc nhanh nhưng tốn chi phí ghi.',
      'Transaction đảm bảo nhiều thao tác thành công hoặc thất bại cùng nhau.',
      'Hiểu các isolation level để chọn mức phù hợp, mặc định là Read Committed.'
    ],
    practice: 'Tạo bảng 100.000 dòng, đo thời gian truy vấn theo cột chưa index, thêm index và so sánh bằng execution plan.',
    links: [
      { title: 'Indexes', url: 'https://learn.microsoft.com/sql/relational-databases/indexes/indexes' },
      { title: 'Transaction isolation levels', url: 'https://learn.microsoft.com/sql/t-sql/statements/set-transaction-isolation-level-transact-sql' }
    ]
  },
  {
    id: 'db-efcore-dbcontext',
    title: 'EF Core và DbContext',
    detail: 'Entity, DbSet, DbContext, provider, vòng đời và tracking.',
    minutes: 35,
    flutter: 'EF Core giống `drift` hoặc `floor`: mô tả bảng bằng class, rồi truy vấn bằng code có kiểu thay vì SQL thủ công.',
    blocks: [
      p('**EF Core** là ORM chính thức của .NET. Bạn mô tả entity bằng class, `DbContext` là phiên làm việc với DB, mỗi `DbSet<T>` là một bảng.'),
      code('csharp', raw`
public class Note
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}

public class LearningDbContext(DbContextOptions<LearningDbContext> options) : DbContext(options)
{
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Note>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.UpdatedAt);
        });
    }
}
`),
      h('Chọn provider qua cấu hình (như project này)'),
      code('csharp', raw`
if (provider == "SqlServer")
    options.UseSqlServer(connectionString);
else
    options.UseSqlite(connectionString ?? "Data Source=learninghub.db");
`),
      p('Đổi DB chỉ cần đổi provider và connection string, phần query LINQ giữ nguyên (lưu ý một số khác biệt nhỏ giữa các DB).'),
      h('Change tracking'),
      code('csharp', raw`
var note = await db.Notes.FindAsync(id);   // EF theo dõi object này
note!.Title = "Tiêu đề mới";               // EF phát hiện thay đổi
await db.SaveChangesAsync();               // sinh câu UPDATE, chạy trong một transaction

// Chỉ đọc: tắt tracking để nhanh hơn, ít bộ nhớ hơn
var list = await db.Notes.AsNoTracking().ToListAsync();
`),
      ul(
        '`DbContext` có lifetime Scoped (một instance mỗi request) và **không thread-safe**.',
        '`SaveChangesAsync` gom mọi thay đổi và chạy trong một transaction.',
        'Với endpoint chỉ đọc, luôn cân nhắc `AsNoTracking()`.',
        'Bật log SQL khi debug: đặt `Microsoft.EntityFrameworkCore.Database.Command` ở mức `Information`.'
      ),
      tip('Mở `backend/DotNetLearning.Api/Data/LearningDbContext.cs` để xem DbContext thật của project này.')
    ],
    takeaways: [
      'DbContext = phiên làm việc với DB, DbSet = bảng.',
      'DbContext là Scoped và không thread-safe.',
      'Dùng `AsNoTracking()` cho truy vấn chỉ đọc.'
    ],
    practice: 'Thêm entity `Tag` vào project này (ở nhánh thử nghiệm), cấu hình độ dài và index, rồi viết endpoint liệt kê tag.',
    links: [
      { title: 'EF Core overview', url: 'https://learn.microsoft.com/ef/core/' },
      { title: 'DbContext lifetime and configuration', url: 'https://learn.microsoft.com/ef/core/dbcontext-configuration/' }
    ]
  },
  {
    id: 'db-migrations',
    title: 'Migrations',
    detail: 'Quản lý thay đổi schema: tạo, áp dụng, rollback và so sánh với EnsureCreated.',
    minutes: 25,
    flutter: 'Giống `schemaVersion` + `onUpgrade` của `drift`/`sqflite`, nhưng EF Core sinh file migration tự động từ thay đổi model.',
    blocks: [
      code('bash', raw`
dotnet tool install --global dotnet-ef        # cài một lần

dotnet ef migrations add AddNoteTags          # tạo migration từ thay đổi model
dotnet ef database update                     # áp dụng vào DB
dotnet ef migrations remove                   # xóa migration cuối (nếu chưa áp dụng)
dotnet ef migrations script --idempotent -o deploy.sql   # sinh SQL để chạy trên production
`),
      p('Mỗi migration là một file C# gồm `Up()` (áp dụng) và `Down()` (hoàn tác). Chúng được lưu trong thư mục `Migrations/` và **được commit vào git**.'),
      h('EnsureCreated và Migrate'),
      table(['', 'EnsureCreated()', 'Migrate()'], [
        ['Mục đích', 'Tạo DB + bảng nếu chưa có', 'Áp dụng các migration còn thiếu'],
        ['Cập nhật schema sau này', 'Không hỗ trợ', 'Có'],
        ['Dùng khi', 'Prototype, test nhanh', 'Mọi dự án thật']
      ]),
      warn('Project này hiện dùng `EnsureCreatedAsync()` (xem `Program.cs`). Cách này không thể dùng kèm migrations và không cập nhật bảng khi model đổi. Khi nghiêm túc triển khai, hãy chuyển sang migrations và gọi `db.Database.MigrateAsync()`.'),
      h('Quy trình khuyến nghị'),
      ul(
        'Dev: `migrations add` rồi `database update` trên máy local.',
        'CI/CD: sinh script SQL idempotent hoặc dùng migration bundle (`dotnet ef migrations bundle`).',
        'Production: chạy migration như một bước riêng trong pipeline, không để nhiều instance cùng migrate lúc khởi động.',
        'Không sửa migration đã áp dụng trên môi trường chung; tạo migration mới.'
      ),
      tip('Đổi tên cột có thể bị EF hiểu thành xóa rồi thêm cột mới (mất dữ liệu). Luôn đọc file migration sinh ra trước khi áp dụng.')
    ],
    takeaways: [
      'Migration là lịch sử thay đổi schema, được commit vào git.',
      '`EnsureCreated` chỉ để prototype, dự án thật dùng migrations.',
      'Luôn đọc file migration trước khi áp dụng, đặc biệt khi đổi tên/xóa cột.'
    ],
    practice: 'Chuyển một project thử nghiệm từ `EnsureCreated` sang migrations: thêm migration đầu tiên, rồi thêm một cột mới bằng migration thứ hai.',
    links: [
      { title: 'Migrations overview', url: 'https://learn.microsoft.com/ef/core/managing-schemas/migrations/' },
      { title: 'Applying migrations', url: 'https://learn.microsoft.com/ef/core/managing-schemas/migrations/applying' }
    ]
  },
  {
    id: 'db-relationships',
    title: 'Relationships và Fluent API',
    detail: 'One-to-many, many-to-many, foreign key, cascade và cấu hình mô hình.',
    minutes: 30,
    blocks: [
      h('One-to-many'),
      code('csharp', raw`
public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Order> Orders { get; set; } = [];     // navigation: 1 khách có nhiều đơn
}

public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }               // foreign key
    public Customer Customer { get; set; } = null!;   // navigation ngược
    public decimal Total { get; set; }
}
`),
      p('EF Core suy ra quan hệ theo convention (`CustomerId` + navigation). Khi cần kiểm soát hơn, dùng Fluent API trong `OnModelCreating`.'),
      code('csharp', raw`
protected override void OnModelCreating(ModelBuilder b)
{
    b.Entity<Order>()
        .HasOne(o => o.Customer)
        .WithMany(c => c.Orders)
        .HasForeignKey(o => o.CustomerId)
        .OnDelete(DeleteBehavior.Restrict);           // không cho xóa khách nếu còn đơn

    b.Entity<Order>().Property(o => o.Total).HasPrecision(18, 2);   // tiền phải khai báo precision
}
`),
      h('Many-to-many'),
      code('csharp', raw`
public class Student { public int Id { get; set; } public List<Course> Courses { get; set; } = []; }
public class Course  { public int Id { get; set; } public List<Student> Students { get; set; } = []; }
// EF Core tự tạo bảng nối (StudentCourse). Cần thêm cột (ví dụ ngày đăng ký)? Hãy tạo entity nối riêng.
`),
      h('Một vài kỹ thuật hữu ích'),
      ul(
        '**Owned type**: nhúng value object (như `Address`) vào cùng bảng với entity chủ.',
        '**Value converter**: lưu enum thành chuỗi: `.HasConversion<string>()`.',
        '**Unique index**: `.HasIndex(x => x.Email).IsUnique()`.',
        '**Cascade delete**: xóa cha thì xóa con; cân nhắc `Restrict` để tránh mất dữ liệu ngoài ý muốn.',
        '**Soft delete**: thêm cột `IsDeleted` + global query filter `HasQueryFilter(x => !x.IsDeleted)`.'
      ),
      warn('Luôn khai báo `HasPrecision` cho cột `decimal` tiền tệ, nếu không DB có thể cắt số lẻ hoặc dùng precision mặc định không phù hợp.')
    ],
    takeaways: [
      'Quan hệ gồm foreign key + navigation property, cấu hình thêm bằng Fluent API.',
      'Khai báo `HasPrecision` cho tiền và cân nhắc hành vi xóa (`Restrict` thay cho cascade).',
      'Dùng owned type, value converter, global filter để mô hình gọn và an toàn.'
    ],
    practice: 'Mô hình hóa Student/Class/Enrollment (many-to-many có thêm điểm số) và viết migration cho nó.',
    links: [
      { title: 'Relationships', url: 'https://learn.microsoft.com/ef/core/modeling/relationships' },
      { title: 'Entity properties', url: 'https://learn.microsoft.com/ef/core/modeling/entity-properties' }
    ]
  },
  {
    id: 'db-querying',
    title: 'Truy vấn với LINQ: Include, projection, hiệu năng',
    detail: 'Include, Select projection, N+1, phân trang, split query và raw SQL.',
    minutes: 35,
    blocks: [
      h('Nạp dữ liệu liên quan'),
      code('csharp', raw`
// Eager loading: kèm dữ liệu liên quan trong cùng truy vấn
var customer = await db.Customers
    .Include(c => c.Orders)
    .FirstOrDefaultAsync(c => c.Id == id);
`),
      h('Projection: chỉ lấy cột cần dùng'),
      p('Đây là cách tối ưu quan trọng nhất: đừng kéo cả entity khi API chỉ trả vài trường.'),
      code('csharp', raw`
var items = await db.Orders
    .AsNoTracking()
    .Where(o => o.CustomerId == customerId)
    .OrderByDescending(o => o.CreatedAt)
    .Select(o => new OrderListItem(o.Id, o.Total, o.CreatedAt))   // dịch thành SELECT chỉ 3 cột
    .ToListAsync(ct);
`),
      h('Vấn đề N+1'),
      code('csharp', raw`
// SAI: 1 truy vấn lấy khách + N truy vấn lấy đơn của từng khách
var customers = await db.Customers.ToListAsync();
foreach (var c in customers)
{
    var count = await db.Orders.CountAsync(o => o.CustomerId == c.Id);  // N lần gọi DB
}

// ĐÚNG: một truy vấn có GROUP BY / projection
var stats = await db.Customers
    .Select(c => new { c.Name, Orders = c.Orders.Count })
    .ToListAsync();
`),
      h('Phân trang'),
      code('csharp', raw`
var page = await db.Notes
    .AsNoTracking()
    .OrderByDescending(n => n.UpdatedAt).ThenBy(n => n.Id)   // luôn có thứ tự ổn định
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync(ct);
`),
      p('`Skip/Take` (offset) chậm dần khi trang lớn. Với danh sách vô hạn cho mobile (infinite scroll), hãy dùng **keyset pagination**: `Where(n => n.Id < lastId).Take(pageSize)`.'),
      h('Khi nào cần SQL thô?'),
      code('csharp', raw`
var rows = await db.Database
    .SqlQuery<MonthlyRevenue>($"SELECT Month, SUM(Total) AS Revenue FROM Orders GROUP BY Month")
    .ToListAsync();     // tham số luôn an toàn khi dùng interpolation của EF
`),
      warn('Không nối chuỗi người dùng vào SQL (SQL injection). Chỉ dùng interpolated overload của EF (`FromSql`, `SqlQuery`) hoặc tham số tường minh.'),
      tip('Bật log câu SQL khi phát triển và kiểm tra từng endpoint: số truy vấn có hợp lý không, có `SELECT *` thừa không.')
    ],
    takeaways: [
      'Dùng `Select` projection và `AsNoTracking` cho endpoint chỉ đọc.',
      'Tránh N+1: gom thành một truy vấn hoặc dùng `Include`/projection.',
      'Phân trang luôn có thứ tự ổn định; dùng keyset khi dữ liệu lớn.'
    ],
    practice: 'Viết API danh sách đơn hàng có phân trang, tìm kiếm và lọc theo trạng thái. Bật log SQL và đảm bảo mỗi request chỉ sinh một câu truy vấn.',
    links: [
      { title: 'Querying data', url: 'https://learn.microsoft.com/ef/core/querying/' },
      { title: 'Efficient querying', url: 'https://learn.microsoft.com/ef/core/performance/efficient-querying' }
    ]
  },
  {
    id: 'db-concurrency',
    title: 'Concurrency và Transaction trong EF Core',
    detail: 'Optimistic concurrency, rowversion, transaction tường minh, ExecuteUpdate.',
    minutes: 30,
    blocks: [
      p('Hai request cùng sửa một dòng sẽ dẫn đến **lost update**: bản ghi của request sau ghi đè bản trước mà không biết. Trên hệ thống tài chính, điều này không được phép xảy ra.'),
      h('Optimistic concurrency với rowversion'),
      code('csharp', raw`
public class Account
{
    public int Id { get; set; }
    public decimal Balance { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = [];     // SQL Server tự cập nhật mỗi khi dòng đổi
}

try
{
    account.Balance -= amount;
    await db.SaveChangesAsync();           // UPDATE ... WHERE Id = @id AND RowVersion = @oldVersion
}
catch (DbUpdateConcurrencyException)
{
    // Có người sửa trước: nạp lại dữ liệu và thử lại, hoặc trả 409 cho client
    return Results.Conflict(new { message = "Dữ liệu đã thay đổi, vui lòng thử lại." });
}
`),
      h('Transaction tường minh'),
      code('csharp', raw`
await using var tx = await db.Database.BeginTransactionAsync(ct);
try
{
    var from = await db.Accounts.FindAsync([fromId], ct);
    var to = await db.Accounts.FindAsync([toId], ct);

    if (from!.Balance < amount) return Results.UnprocessableEntity(new { message = "Không đủ số dư." });

    from.Balance -= amount;
    to!.Balance += amount;
    db.Transfers.Add(new Transfer { FromId = fromId, ToId = toId, Amount = amount });

    await db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
    return Results.Ok();
}
catch
{
    await tx.RollbackAsync(ct);
    throw;
}
`, 'Chuyển tiền an toàn'),
      p('Một lần `SaveChanges` đã nằm trong transaction. Chỉ cần `BeginTransaction` khi bạn có nhiều lần `SaveChanges` hoặc cần bọc thêm thao tác ngoài EF.'),
      h('Cập nhật hàng loạt'),
      code('csharp', raw`
// Không nạp entity, chạy thẳng một câu UPDATE trên DB
await db.Notes
    .Where(n => n.UpdatedAt < cutoff)
    .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsArchived, true));
`),
      warn('Optimistic concurrency chỉ phát hiện xung đột, không ngăn nó. Với tài khoản có tải rất cao, có thể cần khóa dòng (`UPDLOCK`) hoặc đặt cập nhật số dư thành một câu SQL atomic (`UPDATE ... SET Balance = Balance - @amt WHERE Balance >= @amt`).')
    ],
    takeaways: [
      'Dùng `[Timestamp]`/rowversion để phát hiện lost update và xử lý `DbUpdateConcurrencyException`.',
      '`SaveChanges` đã là một transaction; dùng `BeginTransaction` khi cần gom nhiều bước.',
      '`ExecuteUpdate/ExecuteDelete` cho cập nhật hàng loạt hiệu quả.'
    ],
    practice: 'Viết test mô phỏng hai request cùng trừ tiền từ một tài khoản và chứng minh rowversion phát hiện xung đột.',
    links: [
      { title: 'Handling concurrency conflicts', url: 'https://learn.microsoft.com/ef/core/saving/concurrency' },
      { title: 'Transactions', url: 'https://learn.microsoft.com/ef/core/saving/transactions' }
    ]
  }
]
