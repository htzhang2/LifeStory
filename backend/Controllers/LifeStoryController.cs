using backend.Data;
using backend.Dto;
using backend.Models;
using backend.Service;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LifeStoryController : ControllerBase
    {
        private readonly LifeStoryDbContext _db;
        private readonly OpenAiStoryService _aiService;


        private readonly ILogger<LifeStoryController> _logger;

        public LifeStoryController(
            LifeStoryDbContext db,
            OpenAiStoryService aiService,
            ILogger<LifeStoryController> logger)
        {
            _db = db;
            _aiService = aiService;
            _logger = logger;
        }

        [HttpGet("all")]
        public async Task<IEnumerable<LifeStory>> GetAll()
        {
            var lifeStories = await _db.LifeStories.ToListAsync();
            
            return lifeStories;
            
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LifeStory>> Get(int id)
        {
            var lifeStory = await _db.LifeStories.FirstOrDefaultAsync(story => story.Id == id);

            if (lifeStory == null)
            {
                return NotFound();
            }

            return Ok(lifeStory);

        }
        [HttpGet("{id}/detail")]
        public async Task<ActionResult<StoryDetailResponse>> GetStoryDetails(int id)
        {
            var lifeStory = await _db.LifeStories.FirstOrDefaultAsync(story => story.Id == id);

            if (lifeStory == null)
            {
                return NotFound();
            }

            var questionAnswers = await _db.InterviewAnswers.Where(ia => ia.LifeStoryId == id).ToListAsync();

            var result = new StoryDetailResponse();

            result.storyMeta = lifeStory;

            if (questionAnswers != null && questionAnswers.Any())
            {
                result.answers = new List<SaveAnswerRequest>();

                foreach (var answer in questionAnswers)
                {
                    var answerDetail = new SaveAnswerRequest(answer.QuestionNumber, answer.Question, answer.Answer);

                    result.answers.Add(answerDetail);
                }
            }
            
            return Ok(result);

        }
        [HttpPost]
        public async Task<ActionResult<LifeStory>> Create(CreateLifeStoryRequest request)
        {
            var lifeStory = new LifeStory
            {
                Title = request.Title,
                AuthorName = request.AuthorName,
                BirthYear = request.BirthYear,
                BirthPlace = request.BirthPlace,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.LifeStories.Add(lifeStory);
            await _db.SaveChangesAsync();

            return Ok(lifeStory);
        }

        [HttpPost("{id}/answers")]
        public async Task<ActionResult<InterviewAnswer>> SaveAnswer(
            int id,
            SaveAnswerRequest request)
        {
            var lifeStory = await _db.LifeStories.FindAsync(id);

            if (lifeStory == null)
            {
                return NotFound("Life story not found.");
            }

            var answer = new InterviewAnswer
            {
                LifeStoryId = id,
                QuestionNumber = request.QuestionNumber,
                Question = request.Question,
                Answer = request.Answer,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.InterviewAnswers.Add(answer);

            lifeStory.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(answer);
        }

        [HttpGet("{id}/answers")]
        public async Task<ActionResult<IEnumerable<InterviewAnswer>>> GetAnswers(
            int id)
        {
            var lifeStoryExists = await _db.LifeStories
                .AnyAsync(x => x.Id == id);

            if (!lifeStoryExists)
            {
                return NotFound("Life story not found.");
            }

            var answers = await _db.InterviewAnswers
                .Where(x => x.LifeStoryId == id)
                .OrderBy(x => x.QuestionNumber)
                .ToListAsync();

            if (!answers.Any())
            {
                return NotFound("Questions and answers not found.");
            }
            return Ok(answers);
        }

        [HttpPost("{id}/chapters/{chapterNumber}/generate")]
        public async Task<ActionResult<string>> GenerateChapter(
    int id,
    int chapterNumber)
        {
            var lifeStory = await _db.LifeStories
                .FindAsync(id);

            if (lifeStory == null)
            {
                return NotFound("Life story not found.");
            }

            var answers = await _db.InterviewAnswers
                .Where(x => x.LifeStoryId == id)
                .OrderBy(x => x.QuestionNumber)
                .Select(x => new
                {
                    x.Question,
                    x.Answer
                })
                .ToListAsync();

            if (answers.Count == 0)
            {
                return BadRequest("No interview answers found.");
            }

            var chapterTitle = chapterNumber switch
            {
                1 => "My Childhood",
                _ => $"Chapter {chapterNumber}"
            };

            var chapter = await _aiService.GenerateChapterAsync(
                chapterTitle,
                answers.Select(x => (x.Question, x.Answer)));

            return Ok(new
            {
                chapterNumber,
                title = chapterTitle,
                content = chapter
            });
        }
    }
}
