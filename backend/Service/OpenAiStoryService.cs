namespace backend.Service
{
    using OpenAI.Chat;

    public class OpenAiStoryService
    {
        private readonly ChatClient _chatClient;

        public OpenAiStoryService(ChatClient chatClient)
        {
            _chatClient = chatClient;
        }

        public async Task<string> GenerateChapterAsync(
            string chapterTitle,
            IEnumerable<(string Question, string Answer)> answers)
        {
            var prompt = BuildPrompt(chapterTitle, answers);

            var response = await _chatClient.CompleteChatAsync(prompt);

            return response.Value.Content[0].Text;
        }

        private static string BuildPrompt(
            string chapterTitle,
            IEnumerable<(string Question, string Answer)> answers)
        {
            var source = string.Join(
                "\n\n",
                answers.Select((x, index) =>
                    $"Question {index + 1}: {x.Question}\n" +
                    $"Answer: {x.Answer}"));

            return $"""
                You are a professional autobiography editor.

                Write a complete, engaging autobiography chapter titled
                "{chapterTitle}" based on the interview material below.

                Your job is to transform the interview answers into a
                coherent personal story, NOT to simply combine or repeat
                the answers.

                Editorial requirements:

                1. Write a continuous narrative with a clear beginning,
                   middle, and end.

                2. Combine related information from different answers
                   into the same paragraphs when appropriate.

                3. Remove repetition and conversational phrasing.

                4. Convert short answers into natural, flowing prose.

                5. Add transitions between events, places, and periods
                   of the person's life.

                6. Preserve important specific details such as names,
                   places, dates, family relationships, occupations,
                   schools, and memorable events.

                7. Preserve the author's personality and point of view.

                8. Write in first person, as if the person is telling
                   their own life story.

                9. You may reorganize the order of information when that
                   produces a better narrative.

                10. You may combine information from multiple answers
                    to create a more complete description.

                11. Do NOT invent facts, memories, emotions, motivations,
                    conversations, people, events, or experiences.

                12. Do NOT add details merely to make the story more
                    dramatic.

                13. Do NOT mention the interview, questions, answers,
                    AI, or editing process.

                14. Do NOT use bullet points or numbered lists.

                15. Return only the finished chapter.

                The source material is:

                {source}
                """;
        }
    }
}
