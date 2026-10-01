namespace backend.Dto
{
    public class ChapterPhotoResponse
    {
        public int Id { get; set; }

        public int DisplayOrder { get; set; }

        public int PhotoId { get; set; }

        public int LifeStoryId { get; set; }

        public string Caption { get; set; } = string.Empty;

        public string Memory { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public string Url { get; set; } = string.Empty;

        public DateTime UrlExpiresAt { get; set; }
    }
}
