namespace backend.Models
{
    public class HistoricalContext
    {
        public int Id { get; set; }

        public int LifeStoryId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public string Source { get; set; } = string.Empty;

        public int? StartYear { get; set; }

        public int? EndYear { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
