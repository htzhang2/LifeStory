namespace backend.Models
{
    public class ChapterPhoto
    {
        public int Id { get; set; }

        public int ChapterId { get; set; }

        public int StoryPhotoId { get; set; }

        public int DisplayOrder { get; set; }
    }
}
