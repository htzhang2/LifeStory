namespace backend.Models
{
    public class LifeStory
    {
        public int Id { get; set; }

        // Language used for questions, generated chapters, and PDFs.
        // "en" = English, "zh-CN" = Simplified Chinese.
        public string ContentLanguage { get; set; } = "en";

        public string Title { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public int? BirthYear { get; set; }

        public string BirthPlace { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // navigation property
        /*
        public ICollection<InterviewAnswer> InterviewAnswers { get; set; }
            = new List<InterviewAnswer>();
        */
    }
}
