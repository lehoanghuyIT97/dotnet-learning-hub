import type { Lesson } from './content/helpers'
import { stage1Lessons } from './content/stage1'
import { stage2Lessons } from './content/stage2'
import { stage3Lessons } from './content/stage3'
import { stage4Lessons } from './content/stage4'
import { stage5Lessons } from './content/stage5'
import { stage6Lessons } from './content/stage6'
import { stage7Lessons } from './content/stage7'

export type { Block, Lesson, Lang, Link } from './content/helpers'
export type Stage = { id: number; title: string; subtitle: string; duration: string; lessons: Lesson[] }

/**
 * Lộ trình dành cho lập trình viên đã có kinh nghiệm Flutter/Dart (5 năm):
 * bỏ qua kiến thức lập trình căn bản, tập trung ánh xạ Dart -> C#, rồi đi vào
 * kỹ năng backend: API, database, bảo mật, kiến trúc, vận hành và kết nối với app Flutter.
 */
export const stages: Stage[] = [
  {
    id: 1, title: 'Từ Dart sang C#', duration: '1–2 tuần',
    subtitle: 'Học C# nhanh bằng cách ánh xạ từ những gì bạn đã biết ở Dart và Flutter.',
    lessons: stage1Lessons
  },
  {
    id: 2, title: 'ASP.NET Core Web API', duration: '2–3 tuần',
    subtitle: 'Xây dựng REST API chuẩn: routing, DTO, DI, middleware, cấu hình và tài liệu OpenAPI.',
    lessons: stage2Lessons
  },
  {
    id: 3, title: 'Database & Entity Framework Core', duration: '3–4 tuần',
    subtitle: 'SQL vững chắc, EF Core, migrations, truy vấn hiệu quả và xử lý concurrency.',
    lessons: stage3Lessons
  },
  {
    id: 4, title: 'Authentication & Security', duration: '2 tuần',
    subtitle: 'JWT, refresh token, phân quyền và checklist bảo mật API.',
    lessons: stage4Lessons
  },
  {
    id: 5, title: 'Architecture & Testing', duration: '3 tuần',
    subtitle: 'SOLID, Clean Architecture, CQRS, unit test và integration test.',
    lessons: stage5Lessons
  },
  {
    id: 6, title: 'Production & DevOps', duration: '3–4 tuần',
    subtitle: 'Cache, background job, Docker, CI/CD trên Azure, observability và resilience.',
    lessons: stage6Lessons
  },
  {
    id: 7, title: 'Flutter ↔ .NET & Dự án thực tế', duration: '3–4 tuần',
    subtitle: 'Thiết kế API cho mobile, tích hợp với Flutter, realtime/push và backend tài chính.',
    lessons: stage7Lessons
  }
]

export const resources = [
  { title: 'A tour of C#', type: 'Official docs', description: 'Tour ngắn gọn về C# cho người đã biết một ngôn ngữ khác.', url: 'https://learn.microsoft.com/dotnet/csharp/tour-of-csharp/' },
  { title: 'Microsoft Learn – C#', type: 'Official docs', description: 'Lộ trình học C# chính thức từ Microsoft.', url: 'https://learn.microsoft.com/dotnet/csharp/' },
  { title: 'Microsoft Learn – ASP.NET Core', type: 'Official docs', description: 'Tài liệu xây dựng ứng dụng web và Web API.', url: 'https://learn.microsoft.com/aspnet/core/' },
  { title: 'Tutorial: Minimal API', type: 'Tutorial', description: 'Tạo Web API đầu tiên bằng Minimal API từng bước.', url: 'https://learn.microsoft.com/aspnet/core/tutorials/min-web-api' },
  { title: 'Microsoft Learn – EF Core', type: 'Official docs', description: 'Học Entity Framework Core và truy vấn dữ liệu.', url: 'https://learn.microsoft.com/ef/core/' },
  { title: '.NET Architecture Guides', type: 'Reference', description: 'Sách và hướng dẫn kiến trúc chính thức cho ứng dụng .NET.', url: 'https://learn.microsoft.com/dotnet/architecture/' },
  { title: 'C# language reference', type: 'Reference', description: 'Tra cứu cú pháp và đặc tả ngôn ngữ C#.', url: 'https://learn.microsoft.com/dotnet/csharp/language-reference/' },
  { title: 'Integration tests', type: 'Tutorial', description: 'Kiểm thử API bằng WebApplicationFactory.', url: 'https://learn.microsoft.com/aspnet/core/test/integration-tests' },
  { title: 'OWASP API Security Top 10', type: 'Security', description: 'Các rủi ro bảo mật API phổ biến nhất và cách phòng tránh.', url: 'https://owasp.org/API-Security/' },
  { title: 'Docker Get Started', type: 'Tutorial', description: 'Hướng dẫn chính thức để bắt đầu với Docker.', url: 'https://docs.docker.com/get-started/' },
  { title: 'Azure App Service', type: 'Cloud', description: 'Triển khai ứng dụng web và API lên Azure.', url: 'https://learn.microsoft.com/azure/app-service/' },
  { title: 'Azure for Students', type: 'Cloud', description: 'Tìm hiểu ưu đãi Azure dành cho sinh viên.', url: 'https://azure.microsoft.com/free/students/' }
]

export const exercises = [
  {
    level: 'Beginner', title: 'Port một module từ Flutter sang C#', stage: 'Từ Dart sang C#',
    description: 'Chọn một module logic trong app Flutter của bạn (tính giá, format, validate, repository) và viết lại bằng C# trong console app, có unit test.',
    tasks: ['Chọn module và liệt kê input/output', 'Viết lại bằng class/record/interface C#', 'Dùng LINQ thay cho các phép map/where', 'Viết 5 test bằng xUnit', 'Ghi lại các khác biệt Dart/C# bạn gặp vào ghi chú']
  },
  {
    level: 'Beginner', title: 'Ứng dụng quản lý chi tiêu Console', stage: 'Từ Dart sang C#',
    description: 'Thực hành OOP, collections, async và lưu dữ liệu JSON.',
    tasks: ['Thêm khoản thu/chi', 'Phân loại giao dịch bằng enum', 'Tính tổng theo tháng bằng LINQ', 'Lưu và đọc dữ liệu từ JSON bất đồng bộ', 'Xử lý lỗi file bằng exception phù hợp']
  },
  {
    level: 'Intermediate', title: 'Todo REST API', stage: 'ASP.NET Core Web API',
    description: 'Xây dựng API CRUD có DTO, validation, middleware lỗi tập trung, Swagger và phân trang.',
    tasks: ['Tạo Todo entity và DTO', 'Viết CRUD endpoints bằng Minimal API', 'Validate dữ liệu đầu vào', 'Thêm GlobalExceptionHandler trả ProblemDetails', 'Thêm tìm kiếm và pagination']
  },
  {
    level: 'Intermediate', title: 'Student Management API + EF Core', stage: 'Database & EF Core',
    description: 'Kết nối SQL database, thiết kế quan hệ và viết truy vấn hiệu quả.',
    tasks: ['Thiết kế database (Student, Class, Enrollment)', 'Tạo EF Core migrations', 'Xây dựng quan hệ nhiều-nhiều có điểm số', 'Viết API danh sách có Include và projection', 'Bật log SQL và loại bỏ N+1']
  },
  {
    level: 'Intermediate', title: 'API có đăng nhập cho app Flutter', stage: 'Authentication & Security',
    description: 'Thêm đăng ký, đăng nhập, JWT và refresh token; nối với một app Flutter nhỏ.',
    tasks: ['Đăng ký với mật khẩu băm', 'Đăng nhập trả access + refresh token', 'Refresh token có rotation', 'Phân quyền: user chỉ truy cập dữ liệu của mình', 'App Flutter dùng Dio interceptor để tự refresh']
  },
  {
    level: 'Advanced', title: 'Clean Architecture + Tests', stage: 'Architecture & Testing',
    description: 'Tái cấu trúc một API thành Domain/Application/Infrastructure/Api và có bộ test đầy đủ.',
    tasks: ['Tách solution thành 4 project', 'Viết use case dạng command/query handler', 'Dùng Result cho lỗi nghiệp vụ', 'Unit test cho domain và handler', 'Integration test với WebApplicationFactory']
  },
  {
    level: 'Advanced', title: 'Dockerize và Deploy lên Azure', stage: 'Production & DevOps',
    description: 'Đưa API lên production có CI/CD, health check, logging và cấu hình đúng.',
    tasks: ['Viết Dockerfile multi-stage và docker compose', 'Thêm /health/ready và structured logging', 'CI chạy test trước khi deploy', 'Chuyển sang Azure SQL và dùng migrations', 'Thiết lập deployment slot staging']
  },
  {
    level: 'Advanced', title: 'Banking Management System', stage: 'Flutter ↔ .NET & Dự án thực tế',
    description: 'Dự án tổng hợp: tài khoản, chuyển tiền an toàn, xác thực, audit log và app Flutter làm client.',
    tasks: ['Thiết kế Account, Transaction và ledger kép', 'Chuyển tiền trong transaction với kiểm tra concurrency', 'Idempotency key chống gửi trùng', 'JWT, phân quyền và audit log bất biến', 'Integration test cho trường hợp gửi trùng song song', 'App Flutter: đăng nhập, xem số dư, chuyển tiền']
  }
]
