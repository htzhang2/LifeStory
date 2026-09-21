namespace backend.Dto
{
    public class SaveAnswerRequest
    {
        public int QuestionNumber { get; set; }

        public string Question { get; set; } = string.Empty;

        public string Answer { get; set; } = string.Empty;

        public SaveAnswerRequest(
            int questionNumber,
            string question,
            string answer)
        {
            QuestionNumber = questionNumber;
            Question = question;
            Answer = answer;
        }
    }
}
