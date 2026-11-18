# .NET Learning Hub

Website học .NET Backend với giao diện dark mode.

## Công nghệ
- Frontend: React + TypeScript + Vite
- Backend: ASP.NET Core Web API (.NET 10)
- Database: Azure SQL Database + Entity Framework Core
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
API kết nối thẳng tới Azure SQL. Chuỗi kết nối không nằm trong git.

Trên App Service (`dotnet-learning-hub-api`), thêm Application settings:

- `DatabaseProvider` = `SqlServer`
- `ConnectionStrings__DefaultConnection` = connection string Azure SQL
- `AllowedOrigins` = URL frontend, ví dụ `https://<name>.azurestaticapps.net`

Connection string dạng:

```text
Server=tcp:<server>.database.windows.net,1433;Initial Catalog=<database>;User ID=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

SQL server cần bật firewall **Allow Azure services**. Login cần quyền tạo bảng, vì lần chạy đầu EF Core gọi `EnsureCreated`.

Chạy local, dữ liệu nằm trên Azure SQL. Chuỗi kết nối nằm trong `backend/DotNetLearning.Api/.env` (file này không commit):

```text
ConnectionStrings__DefaultConnection=Server=tcp:<server>.database.windows.net,1433;Initial Catalog=<database>;User ID=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

```bash
cd backend/DotNetLearning.Api
dotnet run
```

API local: http://localhost:5080

Trên SQL server phải thêm IP máy bạn vào firewall. "Allow Azure services" chỉ cho App Service, không cho máy local.

## Lưu ý
- Checklist và ghi chú được lưu qua API vào Azure SQL.
- Roadmap, resources và exercises được định nghĩa sẵn trong frontend.
- Chưa có đăng nhập người dùng hay phân quyền.
- Không commit connection string hay file `learninghub.db`.

Frontend đang gọi API tại:
`https://dotnet-learning-hub-api-hjhyadcah7b4h8aq.eastasia-01.azurewebsites.net/api`
