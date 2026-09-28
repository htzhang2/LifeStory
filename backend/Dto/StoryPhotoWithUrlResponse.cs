namespace backend.Dto
{
    public class StoryPhotoWithUrlResponse
    {
        public int Id { get; set; }

        public int LifeStoryId { get; set; }

        public string Caption { get; set; } = string.Empty;

        public string Memory { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public string Url { get; set; } = string.Empty;

        public DateTimeOffset UrlExpiresAt { get; set; }
    }
}
