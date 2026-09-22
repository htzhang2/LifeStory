namespace backend.Models
{
    public class Chapter
    {
        public int Id { get; set; }

        public int LifeStoryId { get; set; }

        public int ChapterNumber { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
