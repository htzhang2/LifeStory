namespace backend.Dto
{
    public class CreateLifeStoryRequest
    {
        public string Title { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public int? BirthYear { get; set; }

        public string BirthPlace { get; set; } = string.Empty;
    }
}
