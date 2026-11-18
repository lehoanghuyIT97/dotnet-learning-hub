using DotNetLearning.Api.Data;
using DotNetLearning.Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);

// Azure SQL is the default. Set DatabaseProvider=Sqlite only for a local file database.
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "SqlServer";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var useSqlServer = databaseProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase);

if (useSqlServer && string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Azure SQL connection string is missing. Set ConnectionStrings__DefaultConnection " +
        "in backend/DotNetLearning.Api/.env for local runs, or on the App Service when deployed. " +
        "Example: Server=tcp:<server>.database.windows.net,1433;Initial Catalog=<database>;" +
        "User ID=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");
}

builder.Services.AddDbContext<LearningDbContext>(options =>
{
    if (useSqlServer)
    {
        options.UseSqlServer(connectionString, sql =>
        {
            sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
            sql.CommandTimeout(30);
        });
    }
    else
    {
        options.UseSqlite(connectionString ?? "Data Source=learninghub.db");
    }
});

var allowedOrigins = builder.Configuration["AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LearningDbContext>();
    try
    {
        await db.Database.EnsureCreatedAsync();
    }
    catch (Exception ex)
    {
        var server = "(not set)";
        if (useSqlServer && !string.IsNullOrWhiteSpace(connectionString))
        {
            server = new SqlConnectionStringBuilder(connectionString).DataSource;
        }

        throw new InvalidOperationException(
            $"Cannot open the database (provider={databaseProvider}, server={server}). " +
            "For Azure SQL, confirm the connection string, allow Azure services on the SQL firewall, " +
            "and give the login permission to create tables.",
            ex);
    }
}

app.UseCors("Frontend");
app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Ok(new
{
    name = ".NET Learning Hub API",
    status = "running",
    databaseProvider,
    databaseConfigured = !string.IsNullOrWhiteSpace(connectionString)
}));

app.MapGet("/health", async (LearningDbContext db) =>
{
    try
    {
        var connected = await db.Database.CanConnectAsync();
        return connected
            ? Results.Ok(new { status = "healthy", database = "connected", databaseProvider })
            : Results.Json(new { status = "unhealthy", database = "disconnected", databaseProvider }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { status = "unhealthy", database = "disconnected", databaseProvider, error = ex.GetBaseException().Message },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.MapGet("/api/progress", async (LearningDbContext db) =>
    Results.Ok(await db.ProgressItems.ToListAsync()));

app.MapPut("/api/progress/{itemId}", async (string itemId, ProgressUpdate request, LearningDbContext db) =>
{
    var item = await db.ProgressItems.FirstOrDefaultAsync(x => x.ItemId == itemId);
    if (item is null)
    {
        item = new ProgressItem { ItemId = itemId };
        db.ProgressItems.Add(item);
    }
    item.Completed = request.Completed;
    item.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(item);
});

app.MapGet("/api/notes", async (LearningDbContext db) =>
    Results.Ok(await db.Notes.OrderByDescending(x => x.UpdatedAt).ToListAsync()));

app.MapPost("/api/notes", async (NoteRequest request, LearningDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title) && string.IsNullOrWhiteSpace(request.Content))
        return Results.BadRequest(new { message = "Ghi chú không được để trống." });
    var note = new Note
    {
        Title = string.IsNullOrWhiteSpace(request.Title) ? "Ghi chú mới" : request.Title.Trim(),
        Content = request.Content ?? "",
        UpdatedAt = DateTime.UtcNow
    };
    db.Notes.Add(note);
    await db.SaveChangesAsync();
    return Results.Created($"/api/notes/{note.Id}", note);
});

app.MapPut("/api/notes/{id:int}", async (int id, NoteRequest request, LearningDbContext db) =>
{
    var note = await db.Notes.FindAsync(id);
    if (note is null) return Results.NotFound();
    note.Title = string.IsNullOrWhiteSpace(request.Title) ? "Ghi chú mới" : request.Title.Trim();
    note.Content = request.Content ?? "";
    note.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(note);
});

app.MapDelete("/api/notes/{id:int}", async (int id, LearningDbContext db) =>
{
    var note = await db.Notes.FindAsync(id);
    if (note is null) return Results.NotFound();
    db.Notes.Remove(note);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

static void LoadDotEnv()
{
    var candidates = new List<string>
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(Directory.GetCurrentDirectory(), "backend", "DotNetLearning.Api", ".env")
    };

    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    for (var i = 0; i < 6 && dir is not null; i++, dir = dir.Parent)
        candidates.Add(Path.Combine(dir.FullName, ".env"));

    var path = candidates.FirstOrDefault(File.Exists);
    if (path is null) return;

    foreach (var rawLine in File.ReadAllLines(path))
    {
        var line = rawLine.Trim();
        if (line.Length == 0 || line.StartsWith('#')) continue;

        var separator = line.IndexOf('=');
        if (separator <= 0) continue;

        var key = line[..separator].Trim();
        var value = line[(separator + 1)..].Trim();
        if (value.Length >= 2 && ((value.StartsWith('"') && value.EndsWith('"')) || (value.StartsWith('\'') && value.EndsWith('\''))))
            value = value[1..^1];

        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            Environment.SetEnvironmentVariable(key, value);
    }
}

record ProgressUpdate(bool Completed);
record NoteRequest(string? Title, string? Content);
