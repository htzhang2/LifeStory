namespace backend.Models
{
    public class ChapterPhoto
    {
        public int Id { get; set; }

        public int StoryId { get; set; }

        public int ChapterId { get; set; }

        public int StoryPhotoId { get; set; }

        public string OriginalBlobName { get; set; } = string.Empty;
        
        public string Caption { get; set; } = string.Empty;
        
        public string Memory { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }
    }
}
