namespace backend.Models
{
    public class StoryPhoto
    {
        public int Id { get; set; }

        public int LifeStoryId { get; set; }

        public string OriginalBlobUrl { get; set; } = string.Empty;

        public string Caption { get; set; } = string.Empty;

        public string Memory { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
