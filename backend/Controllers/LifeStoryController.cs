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
        private readonly ChapterPdfService _chapterPdfService;

        private readonly ILogger<LifeStoryController> _logger;

        public LifeStoryController(
            LifeStoryDbContext db,
            OpenAiStoryService aiService,
            ChapterPdfService chapterPdfService,
            ILogger<LifeStoryController> logger)
        {
            _db = db;
            _aiService = aiService;
            _chapterPdfService = chapterPdfService;
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
        public async Task<ActionResult<Chapter>> GenerateChapter(
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

            var photos = await _db.StoryPhotos
                .Where(x => x.LifeStoryId == id)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new
                {
                    x.Id,
                    x.Caption,
                    x.Memory
                })
                .ToListAsync();

            var chapterTitle = chapterNumber switch
            {
                1 => "My Childhood",
                _ => $"Chapter {chapterNumber}"
            };

            // Ask AI to generate the chapter and select relevant photos.
            var result =
                await _aiService.GenerateChapterAsync(
                    chapterTitle,
                    answers.Select(x => (
                        x.Question,
                        x.Answer
                    )),
                    photos.Select(x => (
                        x.Id,
                        x.Caption,
                        x.Memory
                    )));

            var chapter = await _db.Chapters
                .FirstOrDefaultAsync(x =>
                    x.LifeStoryId == id &&
                    x.ChapterNumber == chapterNumber);

            if (chapter == null)
            {
                chapter = new Chapter
                {
                    LifeStoryId = id,
                    ChapterNumber = chapterNumber,
                    Title = chapterTitle,
                    Content = result.Content,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.Chapters.Add(chapter);
            }
            else
            {
                chapter.Title = chapterTitle;
                chapter.Content = result.Content;
                chapter.UpdatedAt = DateTime.UtcNow;
            }

            lifeStory.UpdatedAt = DateTime.UtcNow;

            // Save first so a newly created Chapter gets its database ID.
            await _db.SaveChangesAsync();

            // Remove previous automatic photo assignments.
            // This is important when the user regenerates the chapter.
            var existingChapterPhotos =
                await _db.ChapterPhotos
                    .Where(x => x.ChapterId == chapter.Id)
                    .ToListAsync();

            _db.ChapterPhotos.RemoveRange(existingChapterPhotos);

            // Only allow photo IDs that actually belong to this LifeStory.
            var validPhotoIds = photos
                .Select(x => x.Id)
                .ToHashSet();

            var selectedPhotos = result.Photos
                .Where(x => validPhotoIds.Contains(x.PhotoId))
                .GroupBy(x => x.PhotoId)
                .Select(x => x.First())
                .OrderBy(x => x.DisplayOrder)
                .ToList();

            // Create the automatic ChapterPhoto associations.
            for (var i = 0; i < selectedPhotos.Count; i++)
            {
                _db.ChapterPhotos.Add(
                    new ChapterPhoto
                    {
                        ChapterId = chapter.Id,
                        StoryPhotoId = selectedPhotos[i].PhotoId,
                        DisplayOrder = i + 1
                    });
            }

            await _db.SaveChangesAsync();

            return Ok(chapter);
        }

        [HttpGet("{id}/chapters/{chapterNumber}")]
        public async Task<ActionResult<Chapter>> GetChapter(
            int id,
            int chapterNumber)
        {
            var chapter = await _db.Chapters
                .FirstOrDefaultAsync(x =>
                    x.LifeStoryId == id &&
                    x.ChapterNumber == chapterNumber);

            if (chapter == null)
            {
                return NotFound("Chapter not found.");
            }

            return Ok(chapter);
        }

        [HttpGet("{id}/chapters/{chapterNumber}/pdf")]
        public async Task<IActionResult> DownloadChapterPdf(
            int id,
            int chapterNumber)
        {
            var chapter = await _db.Chapters
                .FirstOrDefaultAsync(x =>
                    x.LifeStoryId == id &&
                    x.ChapterNumber == chapterNumber);

            if (chapter == null)
            {
                return NotFound("Chapter not found.");
            }

            var chapterPhotos = await (
                from cp in _db.ChapterPhotos
                join sp in _db.StoryPhotos
                    on cp.StoryPhotoId equals sp.Id
                where cp.ChapterId == chapter.Id
                      && sp.LifeStoryId == id
                orderby cp.DisplayOrder
                select new ChapterPdfPhoto
                {
                    DisplayOrder = cp.DisplayOrder,
                    OriginalBlobName = sp.OriginalBlobName,
                    Caption = sp.Caption,
                    Memory = sp.Memory
                }
            ).ToListAsync();

            var pdf =
                await _chapterPdfService.GenerateAsync(
                    chapter,
                    chapterPhotos);

            var fileName =
                $"LifeStory-Chapter-{chapter.ChapterNumber}.pdf";

            return File(
                pdf,
                "application/pdf",
                fileName);
        }
    }
}
