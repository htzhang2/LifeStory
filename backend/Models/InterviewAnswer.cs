namespace backend.Models
{
    public class InterviewAnswer
    {
        public int Id { get; set; }

        // foreign key
        public int LifeStoryId { get; set; }

        // navigation property
        //public LifeStory LifeStory { get; set; } = null!;

        public int QuestionNumber { get; set; }

        public string Question { get; set; } = string.Empty;

        public string Answer { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
