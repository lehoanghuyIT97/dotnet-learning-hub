using DotNetLearning.Api.Data;
using DotNetLearning.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<LearningDbContext>(options =>
{
    if (databaseProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required for SqlServer.");
        options.UseSqlServer(connectionString);
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
    await db.Database.EnsureCreatedAsync();
}

app.UseCors("Frontend");
app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Ok(new { name = ".NET Learning Hub API", status = "running", databaseProvider }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

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

record ProgressUpdate(bool Completed);
record NoteRequest(string? Title, string? Content);
