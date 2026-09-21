using backend.Models;

namespace backend.Dto
{
    public class StoryDetailResponse
    {
        public LifeStory storyMeta { get; set; }

        public List<SaveAnswerRequest> answers { get; set; }


    }
}
