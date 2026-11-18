import { code, h, Lesson, p, raw, table, tip, ul, warn } from './helpers'

export const stage4Lessons: Lesson[] = [
  {
    id: 'sec-jwt',
    title: 'Authentication, Authorization và JWT',
    detail: 'Phân biệt xác thực và phân quyền, cấu trúc JWT và cấu hình JWT Bearer.',
    minutes: 35,
    flutter: 'Bạn đã gắn `Authorization: Bearer ...` vào Dio interceptor. Bây giờ bạn là bên tạo và kiểm tra token đó.',
    blocks: [
      table(['', 'Authentication (AuthN)', 'Authorization (AuthZ)'], [
        ['Câu hỏi', 'Bạn là ai?', 'Bạn được làm gì?'],
        ['Lỗi trả về', '401 Unauthorized', '403 Forbidden'],
        ['Ví dụ', 'Đăng nhập, kiểm tra token', 'Chỉ Admin được xóa user']
      ]),
      h('Cấu trúc JWT'),
      p('JWT gồm ba phần ngăn cách bởi dấu chấm: `header.payload.signature`. Payload chứa **claims** (sub, email, role, exp...). Chữ ký đảm bảo token không bị sửa. **JWT chỉ được mã hóa Base64, không bị che giấu**: đừng đặt dữ liệu nhạy cảm vào payload.'),
      code('json', raw`
{
  "sub": "42",
  "email": "an@example.com",
  "role": "User",
  "iss": "dotnet-learning-hub",
  "exp": 1763500000
}
`, 'Payload (đã giải mã)'),
      h('Cấu hình JWT Bearer'),
      code('csharp', raw`
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/me", (ClaimsPrincipal user) => new { Id = user.FindFirstValue(ClaimTypes.NameIdentifier) })
   .RequireAuthorization();
`),
      h('Tạo token'),
      code('csharp', raw`
public string CreateAccessToken(User user)
{
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role)
    };
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _jwt.Issuer, audience: _jwt.Audience, claims: claims,
        expires: DateTime.UtcNow.AddMinutes(15), signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
}
`),
      warn('Khóa ký (`Jwt:Key`) phải đủ dài (tối thiểu 32 byte với HS256) và nằm trong secret/Key Vault, không nằm trong git. Access token nên ngắn hạn (5 đến 15 phút).')
    ],
    takeaways: [
      '401 = chưa xác thực, 403 = không đủ quyền.',
      'JWT không bí mật: không đặt dữ liệu nhạy cảm vào payload.',
      'Access token ngắn hạn, khóa ký nằm trong secret store.'
    ],
    practice: 'Thêm endpoint `POST /auth/login` trả JWT (user giả trong bộ nhớ) và `GET /api/me` yêu cầu token. Test bằng Swagger với nút Authorize.',
    links: [
      { title: 'JWT bearer authentication', url: 'https://learn.microsoft.com/aspnet/core/security/authentication/' },
      { title: 'jwt.io (giải mã JWT)', url: 'https://jwt.io/' }
    ]
  },
  {
    id: 'sec-identity-refresh',
    title: 'Mật khẩu, Identity và Refresh Token',
    detail: 'Băm mật khẩu, ASP.NET Core Identity và luồng refresh token cho mobile.',
    minutes: 35,
    flutter: 'Luồng này khớp với interceptor refresh token bạn đã viết trong Dio: gặp 401 thì gọi refresh rồi thử lại request.',
    blocks: [
      h('Không bao giờ lưu mật khẩu thô'),
      p('Dùng thuật toán băm chậm có salt (PBKDF2, bcrypt, Argon2). ASP.NET Core Identity có sẵn `PasswordHasher`.'),
      code('csharp', raw`
var hasher = new PasswordHasher<User>();
user.PasswordHash = hasher.HashPassword(user, request.Password);

var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
if (result == PasswordVerificationResult.Failed)
    return Results.Unauthorized();
`),
      warn('Thông báo đăng nhập thất bại nên chung chung ("Email hoặc mật khẩu không đúng") để không lộ email nào đã tồn tại. Thêm rate limit chống dò mật khẩu.'),
      h('ASP.NET Core Identity'),
      p('Identity cung cấp sẵn user, mật khẩu băm, role, khóa tài khoản, xác nhận email và lưu trong EF Core. Từ .NET 8 có `MapIdentityApi` để có sẵn endpoint đăng ký/đăng nhập/refresh nhanh cho prototype. Với hệ thống lớn, nhiều team dùng một **identity provider** riêng (Microsoft Entra ID, Keycloak, Auth0...) thay vì tự xây.'),
      code('csharp', raw`
builder.Services.AddIdentityApiEndpoints<AppUser>().AddEntityFrameworkStores<AppDb>();
...
app.MapIdentityApi<AppUser>();     // /register, /login, /refresh, ...
`),
      h('Luồng access token + refresh token'),
      ul(
        'Login thành công: server trả **access token** (ngắn hạn, 15 phút) và **refresh token** (dài hạn, ví dụ 30 ngày).',
        'App gọi API kèm access token. Khi nhận 401 do hết hạn, app gọi `POST /auth/refresh` với refresh token.',
        'Server kiểm tra refresh token, **xoay vòng** (rotation): hủy token cũ, cấp cặp token mới.',
        'Nếu refresh token cũ bị dùng lại, nghi ngờ bị đánh cắp: hủy cả chuỗi và bắt đăng nhập lại.',
        'Lưu refresh token **đã băm** trong DB, kèm thời hạn, thiết bị và trạng thái thu hồi.'
      ),
      code('csharp', raw`
public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = "";     // lưu băm, không lưu token thô
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
}
`),
      tip('Trên Flutter, lưu token trong `flutter_secure_storage` (Keychain/Keystore), không dùng `SharedPreferences`.')
    ],
    takeaways: [
      'Băm mật khẩu bằng thuật toán chậm có salt, không tự chế.',
      'Refresh token phải xoay vòng và được lưu dạng băm.',
      'Cân nhắc dùng identity provider có sẵn cho hệ thống lớn.'
    ],
    practice: 'Hiện thực `POST /auth/refresh` có rotation: hủy refresh token cũ, trả cặp token mới, và phát hiện token bị dùng lại.',
    links: [
      { title: 'ASP.NET Core Identity', url: 'https://learn.microsoft.com/aspnet/core/security/authentication/identity' },
      { title: 'Microsoft Entra ID', url: 'https://learn.microsoft.com/entra/identity/' }
    ]
  },
  {
    id: 'sec-authorization',
    title: 'Phân quyền: role, claim, policy',
    detail: 'Authorize theo role, policy, resource-based authorization.',
    minutes: 25,
    blocks: [
      code('csharp', raw`
// Theo role
app.MapDelete("/api/users/{id}", DeleteUser).RequireAuthorization(p => p.RequireRole("Admin"));

// Theo policy: đặt tên cho một tập điều kiện, dùng lại ở nhiều nơi
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanApproveLoan", p => p
        .RequireAuthenticatedUser()
        .RequireClaim("department", "Credit")
        .RequireAssertion(ctx => ctx.User.IsInRole("Manager") || ctx.User.IsInRole("Admin")));

app.MapPost("/api/loans/{id}/approve", Approve).RequireAuthorization("CanApproveLoan");
`),
      h('Resource-based: kiểm tra quyền theo từng object'),
      p('Role và policy trả lời "người này làm được loại thao tác này không". Nhưng "người này có được xem tài khoản số 123 không" cần kiểm tra theo dữ liệu cụ thể. Đây là điểm yếu bảo mật phổ biến nhất (BOLA/IDOR trong OWASP API Top 10).'),
      code('csharp', raw`
app.MapGet("/api/accounts/{id:int}", async (int id, ClaimsPrincipal user, AppDb db) =>
{
    var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var account = await db.Accounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);

    if (account is null) return Results.NotFound();
    if (account.OwnerId != userId) return Results.NotFound();   // hoặc 403; trả 404 để không lộ sự tồn tại
    return Results.Ok(account);
}).RequireAuthorization();
`),
      warn('Luôn lọc dữ liệu theo người dùng hiện tại ở phía server (ví dụ `Where(a => a.OwnerId == userId)`). Không bao giờ chỉ dựa vào việc client "không gửi id của người khác".'),
      ul(
        'Mặc định deny: đặt fallback policy yêu cầu đăng nhập, rồi mở `AllowAnonymous` cho các endpoint công khai.',
        'Giữ policy nhỏ, tên rõ nghĩa, ghi trong tài liệu.',
        'Kiểm thử phân quyền bằng integration test (user thường không được gọi endpoint admin).'
      )
    ],
    takeaways: [
      'Role cho phân quyền thô, policy cho luật nghiệp vụ, kiểm tra theo resource cho quyền sở hữu dữ liệu.',
      'Luôn lọc dữ liệu theo người dùng hiện tại ở server.',
      'Mặc định cấm, chỉ mở những gì cần công khai.'
    ],
    practice: 'Thêm role Admin/User cho API ghi chú: user chỉ xem và sửa ghi chú của mình, Admin xem được tất cả. Viết test cho từng trường hợp.',
    links: [
      { title: 'Authorization in ASP.NET Core', url: 'https://learn.microsoft.com/aspnet/core/security/authorization/introduction' },
      { title: 'Policy-based authorization', url: 'https://learn.microsoft.com/aspnet/core/security/authorization/policies' }
    ]
  },
  {
    id: 'sec-hardening',
    title: 'Bảo mật API: checklist thực tế',
    detail: 'OWASP API Top 10, HTTPS, rate limiting, quản lý secret và các lỗi hay gặp.',
    minutes: 25,
    blocks: [
      table(['Rủi ro', 'Cách phòng tránh'], [
        ['Broken object level authorization', 'Lọc theo người dùng hiện tại ở mọi truy vấn'],
        ['Broken authentication', 'Token ngắn hạn, refresh rotation, rate limit đăng nhập'],
        ['Excessive data exposure', 'Dùng DTO, không trả entity'],
        ['Mass assignment (over-posting)', 'DTO riêng cho input, không bind trực tiếp vào entity'],
        ['Lack of resource limits', 'Giới hạn `pageSize`, kích thước body, rate limit'],
        ['Injection', 'Dùng EF/parameterized query, không nối chuỗi SQL'],
        ['Security misconfiguration', 'Tắt Swagger/chi tiết lỗi ở production, CORS chặt chẽ'],
        ['Secret lộ trong repo', 'User-secrets, Key Vault, biến môi trường']
      ]),
      h('Rate limiting (built-in)'),
      code('csharp', raw`
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddFixedWindowLimiter("login", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});

app.UseRateLimiter();
app.MapPost("/auth/login", Login).RequireRateLimiting("login");
`),
      h('Các cấu hình nên bật'),
      code('csharp', raw`
app.UseHttpsRedirection();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();                       // buộc trình duyệt dùng HTTPS
}

builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 5 * 1024 * 1024);   // 5MB
`),
      ul(
        'Không lộ stack trace ra client ở production; chỉ trả ProblemDetails chung.',
        'Giới hạn CORS theo origin cụ thể.',
        'Cập nhật package thường xuyên (`dotnet list package --vulnerable`).',
        'Dùng Managed Identity khi kết nối Azure SQL/Key Vault để không phải lưu mật khẩu.',
        'Ghi audit log cho các hành động nhạy cảm (đăng nhập, đổi quyền, chuyển tiền).'
      ),
      tip('Chạy `dotnet list package --vulnerable --include-transitive` định kỳ để phát hiện gói có lỗ hổng bảo mật.')
    ],
    takeaways: [
      'Học thuộc OWASP API Top 10: lỗi quyền theo object và lộ dữ liệu là phổ biến nhất.',
      'Bật rate limit cho endpoint đăng nhập và các endpoint đắt.',
      'Quản lý secret đúng cách và kiểm tra lỗ hổng gói định kỳ.'
    ],
    practice: 'Thêm rate limit cho login, giới hạn `pageSize` tối đa 100 và chạy `dotnet list package --vulnerable` cho project của bạn.',
    links: [
      { title: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/' },
      { title: 'Rate limiting middleware', url: 'https://learn.microsoft.com/aspnet/core/performance/rate-limit' }
    ]
  }
]
