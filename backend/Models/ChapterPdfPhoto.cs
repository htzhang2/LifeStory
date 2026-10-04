namespace backend.Models
{
    public class ChapterPdfPhoto
    {
        public int DisplayOrder { get; set; }

        public string OriginalBlobName { get; set; } = string.Empty;

        public string Caption { get; set; } = string.Empty;

        public string Memory { get; set; } = string.Empty;
    }
}
