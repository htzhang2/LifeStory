namespace backend.Controllers
{
    using backend.Service;
    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/[controller]")]
    public class TranscriptionController : ControllerBase
    {
        private readonly OpenAiTranscriptionService _transcriptionService;

        public TranscriptionController(
            OpenAiTranscriptionService transcriptionService)
        {
            _transcriptionService = transcriptionService;
        }

        [HttpPost]
        public async Task<IActionResult> Transcribe(
            IFormFile audio)
        {
            if (audio == null || audio.Length == 0)
            {
                return BadRequest("Audio file is required.");
            }

            await using var stream = audio.OpenReadStream();

            var text = await _transcriptionService.TranscribeAsync(
                stream,
                audio.FileName);

            return Ok(new
            {
                text
            });
        }
    }
}
