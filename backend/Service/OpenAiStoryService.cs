namespace backend.Service
{
    using backend.Models;
    using OpenAI.Chat;
    using System.Text.Json;

    public class OpenAiStoryService
    {
        private readonly ChatClient _chatClient;

        public OpenAiStoryService(ChatClient chatClient)
        {
            _chatClient = chatClient;
        }

        public async Task<GeneratedChapterResult> GenerateChapterAsync(
            string chapterTitle,
            IEnumerable<(string Question, string Answer)> answers,
            IEnumerable<(int PhotoId, string Caption, string Memory)> photos)
        {
            var prompt = BuildPrompt(
                chapterTitle,
                answers,
                photos);

            var response =
                await _chatClient.CompleteChatAsync(prompt);

            var json = response.Value.Content[0].Text;
            
            var result = JsonSerializer.Deserialize<GeneratedChapterResult>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            if (result == null) 
            { 
                throw new InvalidOperationException("AI returned an invalid chapter response.");
            }
            
            return result;
        }


        private static string BuildPrompt(
            string chapterTitle,
            IEnumerable<(string Question, string Answer)> answers,
            IEnumerable<(int PhotoId, string Caption, string Memory)> photos)
        {
            var source = string.Join(
                "\n\n",
                answers.Select((x, index) =>
                    $"Question {index + 1}: {x.Question}\n" +
                    $"Answer: {x.Answer}"));

            var photoList = photos.ToList();

            var photoSource = photoList.Count > 0
                ? string.Join(
                    "\n\n",
                    photoList.Select(x =>
                        $"Photo ID: {x.PhotoId}\n" +
                        $"Caption: {x.Caption}\n" +
                        $"Memory: {x.Memory}"))
                : "No photos have been uploaded yet.";

            return
                "You are a professional autobiography editor.\n\n" +

                $"Write a complete, engaging autobiography chapter titled " +
                $"\"{chapterTitle}\" based on the interview material and " +
                "photo memories below.\n\n" +

                "Your job is to transform the material into a coherent " +
                "personal story, NOT to simply combine or repeat the " +
                "source material.\n\n" +

                "The interview material is the primary source for the " +
                "person's life story.\n\n" +

                "The photo captions and memories are additional sources " +
                "of autobiographical information. Use them when they are " +
                "relevant to this chapter.\n\n" +

                "Do NOT force every photo into the chapter. Only use " +
                "photo information when it naturally belongs in this " +
                "chapter.\n\n" +

                "Do NOT describe the appearance of a photograph unless " +
                "that information is explicitly provided in the caption " +
                "or memory.\n\n" +

                "Editorial requirements:\n\n" +

                "1. Write a continuous narrative with a clear beginning, " +
                "middle, and end.\n\n" +

                "2. Combine related information from different interview " +
                "answers and relevant photo memories into the same " +
                "paragraphs when appropriate.\n\n" +

                "3. Remove repetition and conversational phrasing.\n\n" +

                "4. Convert short answers into natural, flowing prose.\n\n" +

                "5. Add transitions between events, places, and periods " +
                "of the person's life.\n\n" +

                "6. Preserve important specific details such as names, " +
                "places, dates, family relationships, occupations, " +
                "schools, and memorable events.\n\n" +

                "7. Preserve the author's personality and point of view.\n\n" +

                "8. Write in first person, as if the person is telling " +
                "their own life story.\n\n" +

                "9. You may reorganize the order of information when " +
                "that produces a better narrative.\n\n" +

                "10. You may combine information from multiple answers " +
                "and photo memories to create a more complete " +
                "description.\n\n" +

                "11. Do NOT invent facts, memories, emotions, motivations, " +
                "conversations, people, events, or experiences.\n\n" +

                "12. Do NOT infer facts about a photograph that are not " +
                "explicitly stated in its caption or memory.\n\n" +

                "13. Do NOT add details merely to make the story more " +
                "dramatic.\n\n" +

                "14. Do NOT mention the interview, questions, answers, " +
                "photos as source material, AI, or the editing process.\n\n" +

                "15. Do NOT mention Photo IDs in the chapter content.\n\n" +

                "16. Do NOT use bullet points or numbered lists in the " +
                "chapter content.\n\n" +

                "17. Select only photos that are genuinely relevant to " +
                "this chapter.\n\n" +

                "18. A photo may be omitted if its caption and memory do " +
                "not provide enough evidence that it belongs in this " +
                "chapter.\n\n" +

                "19. Use the Photo ID exactly as provided in the source " +
                "material. Never invent a Photo ID.\n\n" +

                "20. Do not include the same Photo ID more than once.\n\n" +

                "21. Order selected photos by their relevance to the " +
                "chapter.\n\n" +

                "22. If no photos are relevant, return an empty photos array.\n\n" +

                "Return ONLY valid JSON using exactly this structure:\n\n" +

                "{\n" +
                "  \"content\": \"The complete finished chapter...\",\n" +
                "  \"photos\": [\n" +
                "    {\n" +
                "      \"photoId\": 12,\n" +
                "      \"displayOrder\": 1\n" +
                "    }\n" +
                "  ]\n" +
                "}\n\n" +

                "The \"content\" field must contain only the finished " +
                "autobiography chapter.\n\n" +

                "The \"photos\" field must contain only photos that are " +
                "relevant to this chapter.\n\n" +

                "Do NOT include Markdown code fences.\n\n" +

                "Do NOT include any text outside the JSON object.\n\n" +

                "The interview material is:\n\n" +

                source +

                "\n\nThe photo memories are:\n\n" +

                photoSource;
        }
    }
}
