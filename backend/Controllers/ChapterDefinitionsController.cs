namespace backend.Controllers
{
    using backend.Models;
    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/chapter-definitions")]
    public class ChapterDefinitionsController : ControllerBase
    {
        [HttpGet]
        public ActionResult<IReadOnlyList<ChapterDefinition>> GetAll()
        {
            return Ok(ChapterDefinitions.GetAll());
        }

        [HttpGet("{chapterNumber}")]
        public ActionResult<ChapterDefinition> Get(
            int chapterNumber)
        {
            var definition =
                ChapterDefinitions.GetChapter(chapterNumber);

            if (definition == null)
            {
                return NotFound("Chapter definition not found.");
            }

            return Ok(definition);
        }
    }

}
