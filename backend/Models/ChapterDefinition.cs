namespace backend.Models
{
    public class ChapterDefinition
    {
        public int ChapterNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string TitleZhCn { get; set; } = string.Empty;
        public int StartQuestion { get; set; }
        public int EndQuestion { get; set; }
    }
}
