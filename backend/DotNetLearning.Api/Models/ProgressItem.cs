namespace DotNetLearning.Api.Models;

public class ProgressItem
{
    public int Id { get; set; }
    public string ItemId { get; set; } = "";
    public bool Completed { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
