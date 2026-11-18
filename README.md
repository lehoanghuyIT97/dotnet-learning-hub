# .NET Learning Hub

Website học .NET Backend với giao diện dark mode.

## Công nghệ
- Frontend: React + TypeScript + Vite
- Backend: ASP.NET Core Web API (.NET 10)
- Database: SQLite + Entity Framework Core
- Lưu tiến độ checklist và ghi chú vào database local.

## Yêu cầu
- macOS (Intel hoặc Apple Silicon)
- .NET 10 SDK
- Node.js 20.19+ hoặc 22.12+

Kiểm tra:
```bash
dotnet --version
node -v
npm -v
```

## Chạy ứng dụng

Mở Terminal tại thư mục `dotnet-learning-hub`.

### 1. Chạy Backend
```bash
cd backend/DotNetLearning.Api
dotnet restore
dotnet run
```

Backend mặc định chạy tại:
- http://localhost:5080
- Swagger: http://localhost:5080/swagger

Giữ cửa sổ Terminal này mở.

### 2. Chạy Frontend
Mở Terminal thứ hai:
```bash
cd frontend
npm install
npm run dev
```

Mở URL Vite hiển thị trong Terminal, thường là:
http://localhost:5173

## Cấu trúc
```text
dotnet-learning-hub/
├── backend/
│   └── DotNetLearning.Api/
├── frontend/
└── README.md
```

## Database
SQLite được tạo tự động tại:
`backend/DotNetLearning.Api/learninghub.db`

Không cần cài SQL Server hoặc Docker cho bản local này.

## Lưu ý
- Checklist và ghi chú được lưu qua ASP.NET Core API vào SQLite.
- Roadmap, resources và exercises được định nghĩa sẵn trong frontend.
- Đây là phiên bản local đầu tiên. Chưa có đăng nhập người dùng, phân quyền hoặc đồng bộ cloud.
- Không đưa file `learninghub.db` chứa dữ liệu cá nhân lên GitHub công khai.


## Azure deployment preparation

This revision supports SQLite locally and Azure SQL Database in the cloud.

Configure these App Service application settings:
- `DatabaseProvider` = `SqlServer`
- `ConnectionStrings__DefaultConnection` = your Azure SQL connection string
- `AllowedOrigins` = your Static Web Apps URL, e.g. `https://<name>.azurestaticapps.net`

For the frontend build, set `VITE_API_BASE_URL` to:
`https://<your-app-service-name>.azurewebsites.net/api`

The starter schema is created on first run with EF Core `EnsureCreated`. For later schema changes, use EF Core migrations. Never commit production database credentials.
