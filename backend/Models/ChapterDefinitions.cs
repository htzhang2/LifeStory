using System;

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
            },
            new ChapterDefinition
            {
                ChapterNumber = 3,
                Title = "Early Adulthood and First Job",
                TitleZhCn = "青年时期与第一份工作",
                StartQuestion = 7,
                EndQuestion = 9
            },
            new ChapterDefinition
            {
                ChapterNumber = 4,
                Title = "Love, Marriage, and Family",
                TitleZhCn = "爱情、婚姻与家庭",
                StartQuestion = 10,
                EndQuestion = 13
            },
            new ChapterDefinition
            {
                ChapterNumber = 5,
                Title = "Career, Achievements, and Life Challenges",
                TitleZhCn = "事业、成就与人生挑战",
                StartQuestion = 14,
                EndQuestion = 17
            },
            new ChapterDefinition
            {
                ChapterNumber = 6,
                Title = "Life Today, Wisdom, and Legacy",
                TitleZhCn = "现在的生活、人生智慧与留给后代的财富",
                StartQuestion = 18,
                EndQuestion = 22
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
