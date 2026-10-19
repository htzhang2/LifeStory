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
                "You are an accomplished memoirist and autobiography editor.\n\n" +

                $"Write a vivid, engaging, first-person autobiography chapter " +
                $"for the chapter titled \"{chapterTitle}\", using the interview " +
                "answers and photo memories provided below.\n\n" +

                "IMPORTANT TITLE RULE:\n" +
                "- The application displays the chapter title separately.\n" +
                "- Do NOT include the chapter title in the generated content.\n" +
                "- Do NOT add a title, heading, subtitle, or chapter-number heading " +
                "at the beginning of the content.\n" +
                "- Start directly with the first paragraph of the autobiography.\n" +
                "- Do NOT repeat the chapter title as the opening sentence.\n" +
                "- The content field must contain only the narrative prose, " +
                "not the chapter title or any heading.\n\n" +

                "WRITING STYLE:\n" +
                "- Write a genuine personal story, not a summary or a list of facts.\n" +
                "- Develop specific remembered events into vivid scenes when " +
                "the source provides enough detail.\n" +
                "- Use concrete details, natural dialogue only when supplied, " +
                "sensory descriptions when supported, and a strong sense of place.\n" +
                "- Build emotional depth by showing the significance and " +
                "consequences of real experiences.\n" +
                "- Vary sentence length and narrative pace. Give important " +
                "moments room to unfold.\n" +
                "- Begin with an engaging, source-supported scene or observation " +
                "when possible, rather than automatically summarizing childhood.\n" +
                "- End with a meaningful reflection or transition grounded in " +
                "the author's experiences.\n" +
                "- Connect related memories into a coherent narrative. Preserve " +
                "the author's personality, cultural background, and point of view.\n" +
                "- Avoid repetitive facts, generic statements, clichés, and " +
                "unnecessary padding. Prefer depth over length.\n\n" +

                "FACTUAL ACCURACY:\n" +
                "- The interview answers are the primary source. Photo captions " +
                "and memories provide additional information when relevant.\n" +
                "- Preserve names, dates, places, relationships, occupations, " +
                "and other important details accurately.\n" +
                "- Never invent events, dialogue, thoughts, emotions, motives, " +
                "sensory details, people, or personal experiences.\n" +
                "- Do not infer details about a photograph beyond what its " +
                "caption or memory explicitly supports.\n" +
                "- Do not invent historical context or unsupported causal links.\n" +
                "- Do not mention the interview, AI, editing process, or Photo IDs " +
                "in the chapter content.\n" +
                "- Use continuous prose, without bullet points or numbered lists.\n\n" +

                "PHOTO SELECTION:\n" +
                "- Select only photos genuinely relevant to this chapter.\n" +
                "- Use only the supplied Photo IDs. Never invent or duplicate IDs.\n" +
                "- Order selected photos by relevance, assigning displayOrder " +
                "values starting at 1 with no gaps.\n" +
                "- If no photos are relevant, return an empty photos array.\n\n" +

                "OUTPUT REQUIREMENTS:\n" +
                "Return ONLY valid JSON with exactly this structure:\n\n" +
                "{\n" +
                "  \"content\": \"The complete finished chapter prose, without a title or heading...\",\n" +
                "  \"photos\": [\n" +
                "    {\n" +
                "      \"photoId\": 12,\n" +
                "      \"displayOrder\": 1\n" +
                "    }\n" +
                "  ]\n" +
                "}\n\n" +

                "The content field must contain only the finished chapter prose, " +
                "starting directly with its first paragraph and excluding the title. " +
                "The photos field must contain only relevant selected photos. " +
                "Escape JSON strings correctly. Do not include Markdown fences " +
                "or any text outside the JSON object.\n\n" +

                "INTERVIEW MATERIAL:\n\n" +
                source +
                "\n\nPHOTO MEMORIES:\n\n" +
                photoSource;
        }

    }
}
