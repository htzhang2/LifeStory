using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InterviewAnswerController : ControllerBase
    {
        private readonly LifeStoryDbContext _db;

        private readonly ILogger<InterviewAnswerController> _logger;

        public InterviewAnswerController(
            LifeStoryDbContext db,
            ILogger<InterviewAnswerController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet("all")]
        public async Task<IEnumerable<InterviewAnswer>> GetAll()
        {
            var interviewAnswers = await _db.InterviewAnswers.ToListAsync();
            
            return interviewAnswers;
            
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InterviewAnswer>> Get(int id)
        {
            var interviewAnswer = await _db.InterviewAnswers.FirstOrDefaultAsync(answer => answer.Id == id);

            if (interviewAnswer == null)
            {
                return NotFound();
            }

            return Ok(interviewAnswer);

        }

        [HttpPost]
        public async Task<ActionResult<InterviewAnswer>> Create(InterviewAnswer interviewAnswer)
        {
            interviewAnswer.CreatedAt = DateTime.UtcNow;
            interviewAnswer.UpdatedAt = DateTime.UtcNow;

            _db.InterviewAnswers.Add(interviewAnswer);
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception {ex.Message}");
                return BadRequest(ex);
            }

            return Ok(interviewAnswer);
        }
    }
}
