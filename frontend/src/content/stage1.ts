import { code, h, Lesson, p, raw, table, tip, ul, vs, warn } from './helpers'

export const stage1Lessons: Lesson[] = [
  {
    id: 'cs-toolchain',
    title: '.NET toolchain cho Flutter dev',
    detail: 'SDK, CLI, csproj, NuGet và cách ánh xạ từ Dart/Flutter sang .NET.',
    minutes: 20,
    flutter: 'Bạn đã quen bộ khung SDK + CLI + file khai báo package + package registry. .NET có đúng bộ khung đó, chỉ khác tên gọi.',
    blocks: [
      p('**.NET** là nền tảng gồm runtime, thư viện chuẩn và SDK. **C#** là ngôn ngữ chính. Code C# được biên dịch thành IL trong assembly (`.dll`), sau đó **CLR** chạy bằng JIT. Giống Dart: khi dev thì có JIT, khi release có thể AOT (Native AOT trong .NET), nhưng mặc định server .NET vẫn chạy JIT.'),
      h('Bảng ánh xạ nhanh'),
      table(['Flutter / Dart', '.NET'], [
        ['Dart SDK / Flutter SDK', '.NET SDK (`dotnet --version`)'],
        ['`pubspec.yaml`', '`*.csproj` (XML)'],
        ['pub.dev', 'nuget.org'],
        ['`flutter pub get`', '`dotnet restore`'],
        ['`flutter pub add x`', '`dotnet add package X`'],
        ['`flutter run`', '`dotnet run`'],
        ['Hot reload', '`dotnet watch`'],
        ['`flutter test`', '`dotnet test`'],
        ['`flutter build`', '`dotnet publish`'],
        ['`build_runner`', 'Source Generators (chạy lúc compile)'],
        ['`analysis_options.yaml`', '`.editorconfig` + Roslyn analyzers'],
        ['melos / monorepo', 'Solution (`.sln` / `.slnx`) chứa nhiều project']
      ]),
      h('Các lệnh bạn dùng hằng ngày'),
      code('bash', raw`
dotnet --version                       # kiểm tra SDK
dotnet new webapi -n MyApi             # tạo Web API
cd MyApi
dotnet run                             # chạy app
dotnet watch                           # chạy + hot reload khi sửa code
dotnet add package Serilog.AspNetCore  # thêm package từ NuGet
dotnet new sln -n MyApp                # tạo solution
dotnet sln add MyApi/MyApi.csproj      # thêm project vào solution
`),
      h('File csproj là gì?'),
      p('Đây là nơi khai báo target framework, package và các cờ build. Hai cờ bạn nên luôn bật là `Nullable` (null-safety giống Dart) và `ImplicitUsings`.'),
      code('xml', raw`
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="10.0.0" />
  </ItemGroup>
</Project>
`, 'MyApi.csproj'),
      tip('Mở `backend/DotNetLearning.Api/DotNetLearning.Api.csproj` trong chính project này để xem một file csproj thật.'),
      tip('.NET 10 là bản LTS (hỗ trợ dài hạn). Với dự án đi làm, ưu tiên LTS.')
    ],
    takeaways: [
      'Mọi thứ trong Flutter đều có bản tương đương trong .NET: SDK, CLI, package manager.',
      '`csproj` là `pubspec.yaml` của .NET, và có thêm cấu hình build.',
      'Luôn bật `Nullable` để có null-safety ở compile time.'
    ],
    practice: 'Cài .NET 10 SDK, chạy `dotnet new webapi -n Playground`, chạy `dotnet watch`, rồi sửa một endpoint và quan sát hot reload.',
    links: [
      { title: 'Giới thiệu .NET', url: 'https://learn.microsoft.com/dotnet/core/introduction' },
      { title: '.NET CLI overview', url: 'https://learn.microsoft.com/dotnet/core/tools/' }
    ]
  },
  {
    id: 'cs-syntax',
    title: 'Cú pháp: Dart sang C# (cheatsheet)',
    detail: 'Biến, null-safety, string, collection, control flow và quy ước đặt tên.',
    minutes: 25,
    flutter: 'Dart và C# có cú pháp rất gần nhau (cùng họ C). Bạn sẽ đọc được 80% code C# ngay hôm nay, chỉ cần nhớ các điểm khác biệt dưới đây.',
    blocks: [
      h('Biến và hằng'),
      vs(
        raw`
var name = 'An';
final age = 30;          // gán đúng một lần
const pi = 3.14;         // hằng compile-time
String? nick;            // nullable
print('Hi $name');
`,
        raw`
var name = "An";
var age = 30;            // local variable không có "final"
const double Pi = 3.14;  // hằng compile-time
string? nick = null;     // nullable reference type
Console.WriteLine($"Hi {name}");
`
      ),
      p('Lưu ý: C# dùng dấu nháy kép cho `string`, nháy đơn dành cho `char`. Nội suy chuỗi viết `$"... {expr} ..."` (Dart viết `${expr}`). Với field của class, `final` tương ứng `readonly`.'),
      h('Toán tử null'),
      table(['Dart', 'C#', 'Ghi chú'], [
        ['`a?.b`', '`a?.b`', 'Giống hệt nhau'],
        ['`a ?? b`', '`a ?? b`', 'Giống hệt nhau'],
        ['`a ??= b`', '`a ??= b`', 'Giống hệt nhau'],
        ['`a!`', '`a!`', 'Khác biệt lớn: C# chỉ tắt cảnh báo, không kiểm tra lúc chạy'],
        ['`late String x`', '`required` hoặc `= null!`', 'Không có `late`; dùng `required` cho property']
      ]),
      warn('Trong Dart, `a!` ném lỗi nếu `a` null. Trong C#, `a!` chỉ bảo compiler im lặng, nếu null thật thì bạn vẫn dính `NullReferenceException` về sau.'),
      h('Collection literal'),
      vs(
        raw`
final list = [1, 2, 3];
final set = {1, 2, 3};
final map = {'a': 1, 'b': 2};
final merged = [...list, 4];
`,
        raw`
List<int> list = [1, 2, 3];                 // collection expression (C# 12)
HashSet<int> set = [1, 2, 3];
var map = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 };
List<int> merged = [..list, 4];             // spread dùng ".."
`
      ),
      h('Namespace và using'),
      code('csharp', raw`
// Program.cs (top-level statements: không cần class Main)
using MyApp.Models;          // tương đương import

namespace MyApp.Services;    // file-scoped namespace, mỗi file một namespace

public class Greeter
{
    public string Hello(string name) => $"Hello {name}";   // expression-bodied member
}
`),
      h('Quy ước đặt tên'),
      ul(
        '`PascalCase` cho class, method, property, enum, namespace (Dart dùng camelCase cho method).',
        '`camelCase` cho tham số và biến local.',
        '`_camelCase` cho private field.',
        'Interface bắt đầu bằng `I`, ví dụ `IUserRepository`.',
        'Method async kết thúc bằng `Async`, ví dụ `GetUserAsync`.'
      ),
      h('Một vài khác biệt nhỏ nhưng hay gặp'),
      ul(
        'Cascade `..` của Dart không có sẵn. C# dùng object initializer: `new User { Name = "An" }`.',
        'Chia nguyên: Dart là `~/`, C# chỉ cần `/` giữa hai số nguyên.',
        'C# yêu cầu dấu `;` và kiểu trả về đặt trước tên method: `int Add(int a, int b)`.',
        'Tham số có tên (named parameter) của Dart cũng có trong C#: `Foo(name: "An")`.'
      )
    ],
    takeaways: [
      'Dùng `$"..."` để nội suy chuỗi, `PascalCase` cho method và property.',
      '`?.`, `??`, `??=` giống Dart; `!` thì khác (không kiểm tra runtime).',
      'Collection expression `[..a, ..b]` gần như tương đương spread trong Dart.'
    ],
    practice: 'Viết lại một hàm tiện ích từ app Flutter của bạn (ví dụ format tiền tệ hoặc parse ngày) sang C# trong một console app.',
    links: [
      { title: 'A tour of C#', url: 'https://learn.microsoft.com/dotnet/csharp/tour-of-csharp/' },
      { title: 'C# language reference', url: 'https://learn.microsoft.com/dotnet/csharp/language-reference/' }
    ]
  },
  {
    id: 'cs-types',
    title: 'Kiểu dữ liệu: value type, reference type và nullable',
    detail: 'struct vs class, boxing, nullable reference types, decimal cho tiền và các kiểu ngày giờ.',
    minutes: 25,
    flutter: 'Trong Dart mọi thứ đều là object. Trong C# có hai nhóm: value type (struct) và reference type (class), và điều này ảnh hưởng đến cách so sánh, copy và gán.',
    blocks: [
      p('**Value type** (`int`, `double`, `bool`, `DateTime`, `Guid`, `struct`, `enum`) lưu giá trị trực tiếp và được **copy** khi gán. **Reference type** (`string`, `class`, `record`, mảng, `List<T>`) lưu tham chiếu, gán chỉ copy tham chiếu.'),
      code('csharp', raw`
int a = 5;
int b = a;          // copy giá trị
b = 10;             // a vẫn là 5

var u1 = new User { Name = "An" };
var u2 = u1;        // cùng trỏ vào một object
u2.Name = "Bình";   // u1.Name cũng là "Bình"

object boxed = a;   // boxing: gói int vào object (có chi phí cấp phát)
`),
      h('Hai loại nullable khác nhau'),
      code('csharp', raw`
int? count = null;        // Nullable<int>: có thật ở runtime
string? name = null;      // nullable reference type: chỉ là annotation lúc compile
string title = null!;     // ép bỏ cảnh báo, tự chịu trách nhiệm

if (name is not null) Console.WriteLine(name.Length);   // compiler hiểu name không null ở đây
`),
      p('Khi bật `<Nullable>enable</Nullable>`, compiler cảnh báo (warning) nếu bạn có thể gây null. Bạn có thể nâng thành lỗi bằng `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.'),
      h('So sánh bằng'),
      ul(
        'Với `class`, `==` mặc định so sánh tham chiếu (trừ khi override, như `string`).',
        'Với `record`, `==` so sánh theo giá trị các property, giống `Equatable` hoặc `freezed` bên Dart.',
        'Với `struct`, `==` không có sẵn; bạn phải tự định nghĩa hoặc dùng `record struct`.'
      ),
      h('Những kiểu quan trọng cho backend'),
      table(['Nhu cầu', 'Dùng', 'Tránh'], [
        ['Tiền, số tài chính', '`decimal`', '`double` (sai số nhị phân)'],
        ['Thời điểm cụ thể', '`DateTimeOffset` hoặc `DateTime.UtcNow`', '`DateTime.Now` trên server'],
        ['Chỉ ngày / chỉ giờ', '`DateOnly`, `TimeOnly`', 'Lưu `DateTime` rồi cắt giờ'],
        ['ID duy nhất', '`Guid`', 'Tự sinh chuỗi ngẫu nhiên']
      ]),
      code('csharp', raw`
decimal price = 19.99m;       // hậu tố m cho decimal
double d = 0.1 + 0.2;         // 0.30000000000000004
decimal ok = 0.1m + 0.2m;     // 0.3

public enum OrderStatus { Pending, Paid, Shipped, Cancelled }
`),
      tip('Enum của C# đơn giản hơn enhanced enum của Dart (không có field hay method trong enum). Nếu cần dữ liệu đi kèm, dùng class hoặc extension method.')
    ],
    takeaways: [
      'Value type được copy, reference type được chia sẻ tham chiếu.',
      'Nullable reference type là cảnh báo compile-time, còn `int?` là thật ở runtime.',
      'Luôn dùng `decimal` cho tiền và `DateTimeOffset`/UTC cho thời gian trên server.'
    ],
    practice: 'Viết một `struct Money(decimal Amount, string Currency)` và một `record Money` rồi so sánh hành vi của `==` giữa hai cách.',
    links: [
      { title: 'Built-in types', url: 'https://learn.microsoft.com/dotnet/csharp/language-reference/builtin-types/built-in-types' },
      { title: 'Nullable reference types', url: 'https://learn.microsoft.com/dotnet/csharp/nullable-references' }
    ]
  },
  {
    id: 'cs-oop',
    title: 'Class, record, interface và extension method',
    detail: 'Constructor, property, record, interface, abstract/virtual/override, access modifier.',
    minutes: 35,
    flutter: 'Bạn đã làm OOP 5 năm với Dart. Phần mới chỉ là cú pháp property, `virtual/override` tường minh và việc interface phải khai báo riêng.',
    blocks: [
      h('Class và property'),
      vs(
        raw`
class User {
  final int id;
  final String name;
  User({required this.id, required this.name});
}
final u = User(id: 1, name: 'An');
`,
        raw`
public class User
{
    public required int Id { get; init; }
    public required string Name { get; init; }
}
var u = new User { Id = 1, Name = "An" };
`
      ),
      p('`{ get; init; }` nghĩa là chỉ gán được lúc khởi tạo, sau đó bất biến. `required` buộc người dùng phải gán giá trị. Property là đơn vị chuẩn trong C#, không dùng public field.'),
      h('Primary constructor (C# 12)'),
      p('Rất hay dùng cho service vì nó gọn khi inject dependency:'),
      code('csharp', raw`
public class UserService(IUserRepository repo, ILogger<UserService> logger)
{
    public async Task<User?> GetAsync(int id)
    {
        logger.LogInformation("Get user {Id}", id);
        return await repo.FindAsync(id);
    }
}
`),
      h('Record: data class sẵn có'),
      code('csharp', raw`
public record UserDto(int Id, string Name);

var a = new UserDto(1, "An");
var b = a with { Name = "Bình" };     // giống copyWith
Console.WriteLine(a == b);            // false: so sánh theo giá trị
var (id, name) = a;                   // deconstruct
`),
      tip('Record rất hợp để làm DTO (request/response) vì ngắn gọn và so sánh theo giá trị, đúng như bạn dùng `freezed` bên Flutter.'),
      h('Interface, abstract, virtual'),
      code('csharp', raw`
public interface IClock { DateTime UtcNow { get; } }

public class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}

public abstract class Shape
{
    public abstract double Area();
    public virtual string Name => "shape";
}

public class Circle(double r) : Shape
{
    public override double Area() => Math.PI * r * r;
    public override string Name => "circle";
}
`),
      h('Khác biệt so với Dart'),
      ul(
        'Dart: mọi class là một implicit interface. C#: phải khai báo `interface` riêng.',
        'Dart override ngầm định. C# cần `virtual` ở class cha và `override` ở class con.',
        'Dart có `mixin`. C# không có: dùng composition, default interface method hoặc extension method.',
        'Mặc định member trong class là `private`, nhưng type cấp cao nhất (class, record) mặc định là `internal` (chỉ trong assembly). Hãy ghi `public` khi cần.',
        '`sealed` chặn kế thừa, `static class` chứa hàm tiện ích.'
      ),
      h('Extension method (giống Dart extension)'),
      code('csharp', raw`
public static class StringExtensions
{
    public static bool IsBlank(this string? s) => string.IsNullOrWhiteSpace(s);
}

if (name.IsBlank()) { /* ... */ }
`)
    ],
    takeaways: [
      'Dùng property `{ get; init; }` và `required` thay vì public field.',
      'Record là lựa chọn mặc định cho DTO, và `with` giống `copyWith`.',
      'Nhớ `public` cho type, và `virtual/override` cho method cần ghi đè.'
    ],
    practice: 'Mô hình hóa `Account`, `Transaction` và `IAccountRepository` bằng class/record/interface rồi viết một `InMemoryAccountRepository`.',
    links: [
      { title: 'Classes, structs, records', url: 'https://learn.microsoft.com/dotnet/csharp/fundamentals/types/' },
      { title: 'Extension members', url: 'https://learn.microsoft.com/dotnet/csharp/programming-guide/classes-and-structs/extension-methods' }
    ]
  },
  {
    id: 'cs-linq',
    title: 'Generics, collections và LINQ',
    detail: 'List, Dictionary, HashSet, generic constraint và LINQ so với Iterable của Dart.',
    minutes: 30,
    flutter: 'LINQ chính là bộ method của `Iterable` trong Dart (`map`, `where`, `fold`...) với tên khác. Bạn sẽ học rất nhanh.',
    blocks: [
      table(['Dart (Iterable)', 'C# (LINQ)'], [
        ['`map`', '`Select`'],
        ['`where`', '`Where`'],
        ['`fold` / `reduce`', '`Aggregate`'],
        ['`expand`', '`SelectMany`'],
        ['`firstWhere`', '`First(predicate)` / `FirstOrDefault`'],
        ['`any` / `every`', '`Any` / `All`'],
        ['`take` / `skip`', '`Take` / `Skip`'],
        ['`toList()`', '`ToList()`'],
        ['`sort`', '`OrderBy` / `ThenBy` (không đổi list gốc)']
      ]),
      code('csharp', raw`
public record Order(int Id, int CustomerId, decimal Total);

var orders = new List<Order>
{
    new(1, 10, 120m), new(2, 10, 80m), new(3, 11, 300m)
};

var top = orders
    .Where(o => o.Total > 100)
    .OrderByDescending(o => o.Total)
    .Select(o => new { o.Id, o.Total })
    .Take(5)
    .ToList();

var byCustomer = orders
    .GroupBy(o => o.CustomerId)
    .Select(g => new { CustomerId = g.Key, Sum = g.Sum(o => o.Total) });
`),
      h('Deferred execution'),
      p('Giống `Iterable` lười của Dart, LINQ chỉ chạy khi bạn duyệt kết quả (`foreach`, `ToList()`, `First()`, `Count()`...). Nếu duyệt nhiều lần thì query chạy nhiều lần, vì vậy hãy gọi `ToList()` khi cần chốt dữ liệu.'),
      h('Chọn đúng kiểu collection'),
      ul(
        '`List<T>`: danh sách cơ bản, tương đương `List` của Dart.',
        '`Dictionary<TKey, TValue>`: tương đương `Map`. Dùng `TryGetValue` để tránh exception.',
        '`HashSet<T>`: tương đương `Set`.',
        'Tham số hàm nên nhận `IEnumerable<T>` hoặc `IReadOnlyList<T>`, trả về `IReadOnlyList<T>` để không lộ khả năng sửa.'
      ),
      code('csharp', raw`
var prices = new Dictionary<string, decimal> { ["coffee"] = 35m };
if (prices.TryGetValue("coffee", out var price))
    Console.WriteLine(price);

// generic với constraint (giống "T extends Foo" của Dart)
public T Create<T>() where T : class, new() => new T();
`),
      tip('Hãy học kỹ khác biệt `IEnumerable<T>` và `IQueryable<T>`: với EF Core, `IQueryable` được dịch ra SQL, còn `IEnumerable` chạy trong bộ nhớ. Bạn sẽ gặp lại ở phần EF Core.')
    ],
    takeaways: [
      'LINQ gần như ánh xạ 1-1 với `Iterable` của Dart.',
      'LINQ lười: gọi `ToList()` để thực thi và chốt dữ liệu.',
      'Dùng `IReadOnlyList<T>` cho giá trị trả về công khai.'
    ],
    practice: 'Cho danh sách giao dịch, viết LINQ tính tổng chi tiêu theo tháng, top 3 danh mục chi nhiều nhất và tìm giao dịch lớn nhất mỗi ngày.',
    links: [
      { title: 'LINQ', url: 'https://learn.microsoft.com/dotnet/csharp/linq/' },
      { title: 'Generics', url: 'https://learn.microsoft.com/dotnet/csharp/fundamentals/types/generics' }
    ]
  },
  {
    id: 'cs-async',
    title: 'Async/await, Task và CancellationToken',
    detail: 'Future so với Task, Stream so với IAsyncEnumerable, đa luồng và các lỗi thường gặp.',
    minutes: 35,
    flutter: 'Cú pháp async/await gần như y hệt. Khác biệt quan trọng nhất: Dart chạy single-thread trong một isolate, còn .NET chạy đa luồng nên bạn phải để ý race condition.',
    blocks: [
      vs(
        raw`
Future<User> fetchUser(int id) async {
  final res = await http.get(Uri.parse('/users/$id'));
  return User.fromJson(jsonDecode(res.body));
}

final both = await Future.wait([fetchUser(1), fetchUser(2)]);

Stream<int> ticks() async* {
  for (var i = 0; i < 3; i++) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;
  }
}
await for (final t in ticks()) print(t);
`,
        raw`
public async Task<User?> FetchUserAsync(int id, CancellationToken ct)
{
    return await _http.GetFromJsonAsync<User>($"/users/{id}", ct);
}

var both = await Task.WhenAll(FetchUserAsync(1, ct), FetchUserAsync(2, ct));

public async IAsyncEnumerable<int> TicksAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (var i = 0; i < 3; i++)
    {
        await Task.Delay(TimeSpan.FromSeconds(1), ct);
        yield return i;
    }
}
await foreach (var t in TicksAsync()) Console.WriteLine(t);
`
      ),
      table(['Dart', 'C#'], [
        ['`Future<T>`', '`Task<T>`'],
        ['`Future<void>`', '`Task`'],
        ['`Stream<T>`', '`IAsyncEnumerable<T>`'],
        ['`Future.wait`', '`Task.WhenAll`'],
        ['`Future.any`', '`Task.WhenAny`'],
        ['`Isolate.run` / `compute`', '`Task.Run` (cùng bộ nhớ, khác isolate)']
      ]),
      h('Điểm khác biệt quan trọng: đa luồng'),
      p('Một request trong ASP.NET Core chạy trên thread từ thread pool, và nhiều request chạy song song. Vì vậy dữ liệu dùng chung (static field, service Singleton, cache trong bộ nhớ) phải an toàn với đa luồng. Dùng `ConcurrentDictionary`, `lock`, `Interlocked` hoặc ưu tiên dữ liệu bất biến.'),
      code('csharp', raw`
// SAI: Dictionary không thread-safe
static readonly Dictionary<string, int> Counter = new();

// ĐÚNG: dùng collection thread-safe
static readonly ConcurrentDictionary<string, int> Counter = new();
Counter.AddOrUpdate("hits", 1, (_, old) => old + 1);
`),
      h('Quy tắc vàng'),
      ul(
        'Đã async thì async tới cùng (từ controller xuống tới DB): không trộn code đồng bộ chặn thread.',
        'Không dùng `.Result` hoặc `.Wait()`, vì dễ gây thread starvation hoặc deadlock.',
        'Trả về `Task`, không dùng `async void` (chỉ dùng cho event handler).',
        'Nhận `CancellationToken` ở endpoint và truyền xuống mọi lời gọi I/O: khi client hủy request, server dừng việc dư thừa.',
        'Với ASP.NET Core không có SynchronizationContext, nên không cần `ConfigureAwait(false)` trong code ứng dụng.'
      ),
      warn('Khi chạy song song (`Task.WhenAll`) với EF Core, đừng dùng cùng một `DbContext` trên nhiều task: `DbContext` không thread-safe.')
    ],
    takeaways: [
      '`Future` → `Task`, `Stream` → `IAsyncEnumerable`, `Future.wait` → `Task.WhenAll`.',
      'Server là đa luồng: bảo vệ state dùng chung.',
      'Luôn async tới cùng và truyền `CancellationToken`.'
    ],
    practice: 'Viết một console app gọi 3 API công khai song song bằng `Task.WhenAll`, đo thời gian so với gọi tuần tự, rồi thêm timeout bằng `CancellationTokenSource`.',
    links: [
      { title: 'Asynchronous programming', url: 'https://learn.microsoft.com/dotnet/csharp/asynchronous-programming/' },
      { title: 'Task-based async pattern', url: 'https://learn.microsoft.com/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap' }
    ]
  },
  {
    id: 'cs-delegates',
    title: 'Lambda, delegate và event',
    detail: 'Func, Action, delegate, closure và event so với callback/Stream.',
    minutes: 15,
    flutter: 'Function type của Dart (`int Function(String)`) tương ứng `Func<string, int>`. Event giống broadcast `StreamController`.',
    blocks: [
      code('csharp', raw`
Func<int, int, int> add = (a, b) => a + b;     // có giá trị trả về
Action<string> log = msg => Console.WriteLine(msg);   // không trả về
Predicate<int> isEven = n => n % 2 == 0;       // trả về bool

Console.WriteLine(add(2, 3));                  // 5
var evens = Enumerable.Range(1, 10).Where(n => isEven(n));

// method group: truyền thẳng tên method
var strings = new[] { "1", "2", "3" }.Select(int.Parse);
`),
      vs(
        raw`
typedef Mapper<T> = T Function(String);
T convert<T>(String s, Mapper<T> f) => f(s);
`,
        raw`
public delegate T Mapper<T>(string s);       // delegate tự đặt tên
T Convert<T>(string s, Func<string, T> f) => f(s);   // thường dùng Func cho gọn
`
      ),
      h('Event'),
      code('csharp', raw`
public class Downloader
{
    public event EventHandler<int>? ProgressChanged;

    public void Report(int percent) => ProgressChanged?.Invoke(this, percent);
}

var d = new Downloader();
d.ProgressChanged += (sender, percent) => Console.WriteLine($"{percent}%");
d.Report(50);
`),
      p('Trong backend hiện đại, bạn ít dùng `event` trực tiếp. Để truyền chuỗi dữ liệu bất đồng bộ, hãy dùng `IAsyncEnumerable<T>` hoặc `System.Threading.Channels` (giống `StreamController` có hàng đợi).'),
      warn('Closure bắt biến theo tham chiếu: coi chừng bắt biến lặp hoặc biến thay đổi sau đó, giống tình huống trong Dart.')
    ],
    takeaways: [
      '`Func` cho hàm có giá trị trả về, `Action` cho hàm void.',
      'Method group giúp code gọn: `.Select(int.Parse)`.',
      'Event hiếm dùng ở backend; ưu tiên `IAsyncEnumerable` và `Channel`.'
    ],
    practice: 'Viết `Retry(Func<Task<T>> action, int times)` thử lại khi lỗi và dùng nó để gọi một HTTP API.',
    links: [
      { title: 'Delegates', url: 'https://learn.microsoft.com/dotnet/csharp/programming-guide/delegates/' },
      { title: 'Events', url: 'https://learn.microsoft.com/dotnet/csharp/events-overview' }
    ]
  },
  {
    id: 'cs-exceptions',
    title: 'Exception, IDisposable và Garbage Collection',
    detail: 'try/catch/when, throw đúng cách, using, vòng đời tài nguyên và GC.',
    minutes: 25,
    flutter: 'Bạn quen `dispose()` trong `State`. Trong .NET, tương đương là `IDisposable` với `using`, và rất quan trọng trên server vì tài nguyên (kết nối DB, socket) bị giữ lâu.',
    blocks: [
      code('csharp', raw`
try
{
    await repo.SaveAsync(order);
}
catch (DbUpdateException ex) when (ex.InnerException is not null)
{
    logger.LogWarning(ex, "Save failed for order {OrderId}", order.Id);
    throw new ConflictException("Order already exists.");   // đổi sang lỗi nghiệp vụ
}
catch (Exception ex)
{
    logger.LogError(ex, "Unexpected error");
    throw;     // giữ nguyên stack trace. KHÔNG viết "throw ex;"
}
finally
{
    // luôn chạy
}

public class ConflictException(string message) : Exception(message);
`),
      h('Nguyên tắc xử lý lỗi'),
      ul(
        'Chỉ catch khi bạn có thể xử lý hoặc bổ sung ngữ cảnh. Còn lại để lỗi nổi lên và xử lý tập trung bằng middleware.',
        'Dùng `throw;` để giữ stack trace, không dùng `throw ex;`.',
        'Exception tốn chi phí, đừng dùng cho luồng bình thường (ví dụ "không tìm thấy" nên trả `null` hoặc `Result`, không throw).',
        'Tạo exception nghiệp vụ riêng (NotFound, Conflict, Validation) rồi ánh xạ thành HTTP status ở một chỗ duy nhất.'
      ),
      h('IDisposable và using'),
      code('csharp', raw`
using var stream = File.OpenRead("data.json");   // tự Dispose khi hết scope
var data = await JsonSerializer.DeserializeAsync<Config>(stream);

public class Connection : IDisposable
{
    public void Dispose() { /* đóng tài nguyên */ }
}
`),
      p('Bất cứ object nào implement `IDisposable` (file, stream, connection, `HttpResponseMessage`...) đều cần được dispose. Với DI, container tự dispose các service mà nó tạo, nên bạn chỉ dispose thủ công những gì bạn tự `new`.'),
      warn('Đừng `new HttpClient()` mỗi request: gây cạn socket. Hãy inject `HttpClient` qua `IHttpClientFactory` hoặc typed client.'),
      h('Garbage Collection'),
      ul(
        'GC phân thế hệ 0, 1, 2: object mới sống ở gen 0 và được dọn rất nhanh.',
        'Object lớn (từ khoảng 85KB) vào Large Object Heap, dọn đắt hơn.',
        'GC chỉ quản lý bộ nhớ managed. File, socket, kết nối DB là tài nguyên unmanaged, cần `Dispose`.',
        'Tránh giữ tham chiếu sống lâu (static list, cache không giới hạn): đó là nguồn memory leak phổ biến.'
      )
    ],
    takeaways: [
      '`throw;` giữ stack trace, `throw ex;` làm mất.',
      'Mọi `IDisposable` đều phải được dispose: dùng `using`.',
      'Không tạo `HttpClient` mới cho mỗi request; dùng `IHttpClientFactory`.'
    ],
    practice: 'Tạo `NotFoundException` và `ConflictException`, ném chúng ở service và ghi chú sẽ ánh xạ thành 404 và 409 ra sao ở bài middleware.',
    links: [
      { title: 'Exception handling', url: 'https://learn.microsoft.com/dotnet/csharp/fundamentals/exceptions/' },
      { title: 'Garbage collection', url: 'https://learn.microsoft.com/dotnet/standard/garbage-collection/fundamentals' }
    ]
  },
  {
    id: 'cs-modern',
    title: 'Pattern matching và C# hiện đại',
    detail: 'switch expression, property pattern, record, collection expression và các tính năng mới.',
    minutes: 20,
    flutter: 'Dart 3 đã có pattern, record và switch expression. C# có tất cả từ lâu và còn mạnh hơn ở property/relational pattern.',
    blocks: [
      code('csharp', raw`
decimal Fee(Order o) => o switch
{
    { Total: >= 1_000_000m } => 0m,          // relational pattern
    { Customer.IsVip: true } => 5_000m,      // property pattern lồng nhau
    _ => 10_000m
};

string Describe(object? value) => value switch
{
    null => "null",
    int n when n < 0 => "số âm",
    int n => $"số {n}",
    string { Length: 0 } => "chuỗi rỗng",
    string s => s,
    _ => "khác"
};
`),
      h('Những cú pháp nên dùng thường xuyên'),
      code('csharp', raw`
if (user is not null && user.Age is >= 18 and < 60) { /* ... */ }

var list = [1, 2, 3];
int[] more = [..list, 4, 5];                  // spread

string json = """
    { "name": "An", "age": 30 }
    """;                                       // raw string literal, không cần escape

global using System.Text.Json;                // global using: khai báo một lần cho cả project
`),
      h('Một số tính năng gần đây'),
      ul(
        'C# 12: primary constructor cho class, collection expression `[..]`.',
        'C# 13: các cải tiến cho `params` (nhận collection) và lock mới.',
        'C# 14 (đi cùng .NET 10): `field` keyword trong property, extension members, null-conditional assignment (`a?.B = x`).',
        'Bạn không cần thuộc hết. Hãy đọc bảng "What is new" mỗi khi nâng version .NET.'
      ),
      tip('Khi review code, ưu tiên `is not null`, switch expression và record vì chúng làm intent rõ hơn so với chuỗi `if/else`.')
    ],
    takeaways: [
      'Switch expression + pattern thay cho chuỗi `if/else` dài.',
      'Raw string literal rất hợp cho JSON/SQL nhiều dòng.',
      'Theo dõi "What is new in C#" để cập nhật tính năng mới.'
    ],
    practice: 'Viết hàm tính phí giao dịch bằng switch expression với các luật: miễn phí trên 1 triệu, giảm cho VIP, phí cố định còn lại.',
    links: [
      { title: 'Pattern matching', url: 'https://learn.microsoft.com/dotnet/csharp/fundamentals/functional/pattern-matching' },
      { title: 'What is new in C#', url: 'https://learn.microsoft.com/dotnet/csharp/whats-new/' }
    ]
  }
]
