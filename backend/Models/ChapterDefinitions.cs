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
                StartQuestion = 1,
                EndQuestion = 3
            },
            new ChapterDefinition
            {
                ChapterNumber = 2,
                Title = "My School Years",
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
    }
}
