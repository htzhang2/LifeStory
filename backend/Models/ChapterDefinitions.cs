namespace backend.Models
{
    public static class ChapterDefinitions
    {
        private static readonly List<ChapterDefinition> Definitions = 
        [
            new ChapterDefinition 
            { 
                ChapterNumber = 1,
                Title = "My Childhood",
                TitleZhCn = "我的童年",
                StartQuestion = 1,
                EndQuestion = 3
            },
            new ChapterDefinition
            {
                ChapterNumber = 2,
                Title = "My School Years",
                TitleZhCn = "我的学生时代",
                StartQuestion = 4,
                EndQuestion = 6
            }
        ];

        public static ChapterDefinition? GetChapter(
            int chapterNumber)
        {
            return Definitions.FirstOrDefault(x => x.ChapterNumber == chapterNumber);
        }

        public static IReadOnlyList<ChapterDefinition> GetAll()
        {
            return Definitions;
        }

        public static string GetTitle(
            int chapterNumber,
            string? contentLanguage)
        {
            var chapter = GetChapter(chapterNumber);

            if (chapter == null)
            {
                return string.Empty;
            }

            return contentLanguage == "zh-CN" 
                ? chapter.TitleZhCn
                : chapter.Title;
        }
    }
}
