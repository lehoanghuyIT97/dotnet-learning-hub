using DotNetLearning.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DotNetLearning.Api.Data;

public class LearningDbContext(DbContextOptions<LearningDbContext> options)
    : DbContext(options)
{
    public DbSet<ProgressItem> ProgressItems => Set<ProgressItem>();
    public DbSet<Note> Notes => Set<Note>();
}
