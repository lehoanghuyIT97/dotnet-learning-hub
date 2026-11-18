export type Lesson = { id: string; title: string; detail: string }
export type Stage = { id: number; title: string; subtitle: string; duration: string; lessons: Lesson[] }

export const stages: Stage[] = [
  {
    id: 1, title: 'C# Fundamentals', subtitle: 'Nắm chắc nền tảng ngôn ngữ C# và lập trình hướng đối tượng.', duration: '2–3 tuần',
    lessons: [
      { id: 's1-1', title: 'C# và .NET là gì?', detail: 'CLR, runtime, SDK, compiler và mối quan hệ giữa C# với .NET.' },
      { id: 's1-2', title: 'Biến, kiểu dữ liệu và toán tử', detail: 'Value types, reference types, nullable, ép kiểu và toán tử.' },
      { id: 's1-3', title: 'Điều kiện và vòng lặp', detail: 'if/else, switch, for, while, foreach.' },
      { id: 's1-4', title: 'Methods và parameter', detail: 'Overload, optional parameter, ref, out, expression-bodied members.' },
      { id: 's1-5', title: 'Array và String', detail: 'Mảng, chuỗi, StringBuilder và thao tác dữ liệu.' },
      { id: 's1-6', title: 'OOP trong C#', detail: 'Class, object, encapsulation, inheritance, polymorphism.' },
      { id: 's1-7', title: 'Interface và abstract class', detail: 'Abstraction, interface implementation và composition.' },
      { id: 's1-8', title: 'Exception handling', detail: 'try/catch/finally, custom exception và nguyên tắc xử lý lỗi.' }
    ]
  },
  {
    id: 2, title: 'Advanced C#', subtitle: 'Viết code hiện đại, dễ bảo trì và xử lý bất đồng bộ.', duration: '2–3 tuần',
    lessons: [
      { id: 's2-1', title: 'Collections và Generics', detail: 'List, Dictionary, HashSet, IEnumerable, generic types.' },
      { id: 's2-2', title: 'LINQ', detail: 'Where, Select, GroupBy, Join, OrderBy và deferred execution.' },
      { id: 's2-3', title: 'Lambda, Delegate và Events', detail: 'Func, Action, Predicate, event và callback.' },
      { id: 's2-4', title: 'Async/Await và Task', detail: 'Task, async/await, cancellation token và tránh blocking.' },
      { id: 's2-5', title: 'Memory và Garbage Collection', detail: 'Stack, heap, GC generations, IDisposable và using.' },
      { id: 's2-6', title: 'Dependency Injection', detail: 'IoC, constructor injection và service lifetimes.' }
    ]
  },
  {
    id: 3, title: 'ASP.NET Core Web API', subtitle: 'Xây dựng REST API theo chuẩn HTTP.', duration: '3–4 tuần',
    lessons: [
      { id: 's3-1', title: 'HTTP và REST', detail: 'Request/response, methods, status codes, headers và REST conventions.' },
      { id: 's3-2', title: 'Tạo Web API project', detail: 'Cấu trúc project, Program.cs, Kestrel và môi trường chạy.' },
      { id: 's3-3', title: 'Controller và Routing', detail: 'Attribute routing, route parameters và model binding.' },
      { id: 's3-4', title: 'DTO và Validation', detail: 'Request/response DTO, Data Annotations và validation errors.' },
      { id: 's3-5', title: 'Middleware và DI', detail: 'Request pipeline, middleware tự viết và dependency injection.' },
      { id: 's3-6', title: 'Configuration và Logging', detail: 'appsettings, environment variables, ILogger và structured logging.' },
      { id: 's3-7', title: 'Swagger / OpenAPI', detail: 'Mô tả API, test endpoint và tài liệu API.' }
    ]
  },
  {
    id: 4, title: 'Database & Entity Framework Core', subtitle: 'Thiết kế dữ liệu và kết nối SQL Server.', duration: '3–4 tuần',
    lessons: [
      { id: 's4-1', title: 'SQL nền tảng', detail: 'SELECT, JOIN, GROUP BY, subquery và CRUD.' },
      { id: 's4-2', title: 'Index và Transaction', detail: 'Index, execution plan, ACID và isolation levels.' },
      { id: 's4-3', title: 'EF Core và DbContext', detail: 'DbContext, DbSet, provider và cấu hình kết nối.' },
      { id: 's4-4', title: 'Migrations', detail: 'Tạo migration, cập nhật schema và quản lý thay đổi database.' },
      { id: 's4-5', title: 'Relationships', detail: 'One-to-one, one-to-many, many-to-many và Fluent API.' },
      { id: 's4-6', title: 'LINQ với EF Core', detail: 'Query translation, Include, projection và tracking.' },
      { id: 's4-7', title: 'Concurrency và Transactions', detail: 'Optimistic concurrency, transaction scope và xử lý xung đột.' }
    ]
  },
  {
    id: 5, title: 'Architecture & Clean Code', subtitle: 'Tổ chức code theo hướng dễ mở rộng và kiểm thử.', duration: '3–4 tuần',
    lessons: [
      { id: 's5-1', title: 'SOLID Principles', detail: 'SRP, OCP, LSP, ISP và DIP với ví dụ C#.' },
      { id: 's5-2', title: 'Layered Architecture', detail: 'Presentation, Application, Domain và Infrastructure.' },
      { id: 's5-3', title: 'Clean Architecture', detail: 'Dependency rule, boundaries và use cases.' },
      { id: 's5-4', title: 'Repository và Unit of Work', detail: 'Abstraction cho truy cập dữ liệu và trade-offs.' },
      { id: 's5-5', title: 'CQRS và Mapping', detail: 'Command/query separation, DTO mapping và MediatR concepts.' },
      { id: 's5-6', title: 'Unit Testing', detail: 'xUnit, mocking, arrange-act-assert và integration tests.' }
    ]
  },
  {
    id: 6, title: 'Advanced Backend & DevOps', subtitle: 'Bảo mật, hiệu năng, triển khai và vận hành backend.', duration: '4–6 tuần',
    lessons: [
      { id: 's6-1', title: 'Authentication và Authorization', detail: 'JWT, OAuth 2.0, OpenID Connect, claims và policies.' },
      { id: 's6-2', title: 'Caching với Redis', detail: 'Cache-aside, expiration, invalidation và distributed cache.' },
      { id: 's6-3', title: 'Message Broker', detail: 'RabbitMQ/Kafka, publish-subscribe và eventual consistency.' },
      { id: 's6-4', title: 'Docker', detail: 'Image, container, volume, network và Docker Compose.' },
      { id: 's6-5', title: 'CI/CD và Cloud', detail: 'Pipeline, secrets, deployment slots và Azure App Service.' },
      { id: 's6-6', title: 'Observability', detail: 'Logging, metrics, tracing, health checks và alerting.' },
      { id: 's6-7', title: 'Banking Backend Concerns', detail: 'Idempotency, audit log, concurrency, transaction và fault tolerance.' }
    ]
  }
]

export const resources = [
  { title: 'Microsoft Learn – C#', type: 'Official docs', description: 'Lộ trình học C# chính thức từ Microsoft.', url: 'https://learn.microsoft.com/dotnet/csharp/' },
  { title: 'Microsoft Learn – ASP.NET Core', type: 'Official docs', description: 'Tài liệu xây dựng ứng dụng web và Web API.', url: 'https://learn.microsoft.com/aspnet/core/' },
  { title: 'Microsoft Learn – EF Core', type: 'Official docs', description: 'Học Entity Framework Core và truy vấn dữ liệu.', url: 'https://learn.microsoft.com/ef/core/' },
  { title: '.NET Documentation', type: 'Official docs', description: 'Tài liệu tổng quan về nền tảng .NET.', url: 'https://learn.microsoft.com/dotnet/' },
  { title: 'C# language reference', type: 'Reference', description: 'Tra cứu cú pháp và đặc tả ngôn ngữ C#.', url: 'https://learn.microsoft.com/dotnet/csharp/language-reference/' },
  { title: 'ASP.NET Core fundamentals', type: 'Tutorial', description: 'Các khái niệm nền tảng để xây dựng ứng dụng ASP.NET Core.', url: 'https://learn.microsoft.com/aspnet/core/fundamentals/' },
  { title: 'Docker Get Started', type: 'Tutorial', description: 'Hướng dẫn chính thức để bắt đầu với Docker.', url: 'https://docs.docker.com/get-started/' },
  { title: 'Azure for Students', type: 'Cloud', description: 'Tìm hiểu ưu đãi Azure dành cho sinh viên.', url: 'https://azure.microsoft.com/free/students/' }
]

export const exercises = [
  { level: 'Beginner', title: 'Quản lý danh sách sinh viên', stage: 'C# Fundamentals', description: 'Tạo class Student, thêm/sửa/xóa/tìm kiếm và lọc sinh viên bằng LINQ.', tasks: ['Tạo model Student', 'Viết CRUD trong bộ nhớ', 'Tìm sinh viên theo tên', 'Sắp xếp theo điểm trung bình'] },
  { level: 'Beginner', title: 'Ứng dụng quản lý chi tiêu Console', stage: 'C# Fundamentals', description: 'Thực hành OOP, collections, exception handling và lưu dữ liệu.', tasks: ['Thêm khoản thu/chi', 'Phân loại giao dịch', 'Tính tổng theo tháng', 'Lưu và đọc dữ liệu từ JSON'] },
  { level: 'Intermediate', title: 'Todo REST API', stage: 'ASP.NET Core Web API', description: 'Xây dựng API CRUD có DTO, validation, Swagger và phân trang.', tasks: ['Tạo Todo entity và DTO', 'Viết CRUD endpoints', 'Validate dữ liệu đầu vào', 'Thêm tìm kiếm và pagination'] },
  { level: 'Intermediate', title: 'Student Management API + EF Core', stage: 'Database & EF Core', description: 'Kết nối SQL database, thiết kế quan hệ và viết truy vấn.', tasks: ['Thiết kế database', 'Tạo EF Core migrations', 'Xây dựng quan hệ lớp và sinh viên', 'Viết API truy vấn và cập nhật'] },
  { level: 'Advanced', title: 'Banking Management System', stage: 'Architecture & Advanced Backend', description: 'Dự án tổng hợp: tài khoản, giao dịch, xác thực và audit log.', tasks: ['Thiết kế Account và Transaction', 'Xây dựng chuyển tiền có transaction', 'Chống gửi giao dịch trùng bằng idempotency key', 'Thêm JWT và phân quyền', 'Ghi audit log và viết integration tests'] }
]
