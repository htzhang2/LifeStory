namespace backend.Models
{
    public class LifeStory
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // navigation property
        /*
        public ICollection<InterviewAnswer> InterviewAnswers { get; set; }
            = new List<InterviewAnswer>();
        */
    }
}
