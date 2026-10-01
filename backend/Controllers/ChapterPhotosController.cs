namespace backend.Controllers
{
    using Azure.Storage.Blobs;
    using Azure.Storage.Sas;
    using backend.Data;
    using backend.Dto;
    using backend.Models;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;

    [ApiController]
    [Route("api/lifestories/{storyId}/chapters/{chapterNumber}/photos")]
    public class ChapterPhotosController : ControllerBase
    {
        private readonly LifeStoryDbContext _db;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly BlobContainerClient _containerClient;

        public ChapterPhotosController(
            LifeStoryDbContext db,
            BlobServiceClient blobServiceClient,
            BlobContainerClient containerClient)
        {
            _db = db;
            _blobServiceClient = blobServiceClient;
            _containerClient = containerClient;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChapterPhotoResponse>>> GetPhotos(
            int storyId,
            int chapterNumber,
            CancellationToken cancellationToken)
        {
            var chapter = await _db.Chapters
                .FirstOrDefaultAsync(
                    x =>
                        x.LifeStoryId == storyId &&
                        x.ChapterNumber == chapterNumber,
                    cancellationToken);

            if (chapter == null)
            {
                return NotFound("Chapter not found.");
            }

            var chapterPhotos = await _db.ChapterPhotos
                .Where(x => x.ChapterId == chapter.Id)
                .OrderBy(x => x.DisplayOrder)
                .ThenBy(x => x.Id)
                .Join(
                    _db.StoryPhotos,
                    chapterPhoto => chapterPhoto.StoryPhotoId,
                    storyPhoto => storyPhoto.Id,
                    (chapterPhoto, storyPhoto) => new
                    {
                        chapterPhoto.Id,
                        chapterPhoto.DisplayOrder,
                        PhotoId = storyPhoto.Id,
                        storyPhoto.LifeStoryId,
                        storyPhoto.OriginalBlobName,
                        storyPhoto.Caption,
                        storyPhoto.Memory,
                        storyPhoto.CreatedAt,
                        storyPhoto.UpdatedAt
                    })
                .ToListAsync(cancellationToken);

            var results = new List<ChapterPhotoResponse>();

            foreach (var photo in chapterPhotos)
            {
                var url = await CreateReadUrlAsync(
                    photo.OriginalBlobName,
                    cancellationToken);

                results.Add(new ChapterPhotoResponse
                {
                    Id = photo.Id,
                    DisplayOrder = photo.DisplayOrder,
                    PhotoId = photo.PhotoId,
                    LifeStoryId = photo.LifeStoryId,
                    Caption = photo.Caption,
                    Memory = photo.Memory,
                    CreatedAt = photo.CreatedAt,
                    UpdatedAt = photo.UpdatedAt,
                    Url = url.ToString(),
                    UrlExpiresAt = DateTime.UtcNow.AddMinutes(15)
                });
            }

            return Ok(results);
        }

        [HttpPost("{photoId:int}")]
        public async Task<ActionResult> AddPhoto(
            int storyId,
            int chapterNumber,
            int photoId,
            CancellationToken cancellationToken)
        {
            var chapter = await _db.Chapters
                .FirstOrDefaultAsync(
                    x =>
                        x.LifeStoryId == storyId &&
                        x.ChapterNumber == chapterNumber,
                    cancellationToken);

            if (chapter == null)
            {
                return NotFound("Chapter not found.");
            }

            var photo = await _db.StoryPhotos
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == photoId &&
                        x.LifeStoryId == storyId,
                    cancellationToken);

            if (photo == null)
            {
                return NotFound(
                    "Photo not found in this life story.");
            }

            var alreadyAdded = await _db.ChapterPhotos
                .AnyAsync(
                    x =>
                        x.ChapterId == chapter.Id &&
                        x.StoryPhotoId == photoId,
                    cancellationToken);

            if (alreadyAdded)
            {
                return Conflict(
                    "This photo is already attached to the chapter.");
            }

            var nextDisplayOrder =
                (await _db.ChapterPhotos
                    .Where(x => x.ChapterId == chapter.Id)
                    .Select(x => (int?)x.DisplayOrder)
                    .MaxAsync(cancellationToken) ?? -1) + 1;

            var chapterPhoto = new ChapterPhoto
            {
                ChapterId = chapter.Id,
                StoryPhotoId = photoId,
                DisplayOrder = nextDisplayOrder
            };

            _db.ChapterPhotos.Add(chapterPhoto);

            await _db.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                chapterPhoto.Id,
                chapterPhoto.ChapterId,
                chapterPhoto.StoryPhotoId,
                chapterPhoto.DisplayOrder
            });
        }

        [HttpDelete("{photoId:int}")]
        public async Task<ActionResult> RemovePhoto(
            int storyId,
            int chapterNumber,
            int photoId,
            CancellationToken cancellationToken)
        {
            var chapter = await _db.Chapters
                .FirstOrDefaultAsync(
                    x =>
                        x.LifeStoryId == storyId &&
                        x.ChapterNumber == chapterNumber,
                    cancellationToken);

            if (chapter == null)
            {
                return NotFound("Chapter not found.");
            }

            var chapterPhoto = await _db.ChapterPhotos
                .FirstOrDefaultAsync(
                    x =>
                        x.ChapterId == chapter.Id &&
                        x.StoryPhotoId == photoId,
                    cancellationToken);

            if (chapterPhoto == null)
            {
                return NotFound(
                    "Photo is not attached to this chapter.");
            }

            _db.ChapterPhotos.Remove(chapterPhoto);

            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        private async Task<Uri> CreateReadUrlAsync(
            string blobName,
            CancellationToken cancellationToken)
        {
            var blobClient =
                _containerClient.GetBlobClient(blobName);

            var startsOn =
                DateTimeOffset.UtcNow.AddMinutes(-5);

            var expiresOn =
                DateTimeOffset.UtcNow.AddMinutes(15);

            var delegationKeyResponse =
                await _blobServiceClient.GetUserDelegationKeyAsync(
                    startsOn,
                    expiresOn,
                    cancellationToken);

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerClient.Name,
                BlobName = blobName,
                Resource = "b",
                StartsOn = startsOn,
                ExpiresOn = expiresOn
            };

            sasBuilder.SetPermissions(
                BlobSasPermissions.Read);

            var sasParameters =
                sasBuilder.ToSasQueryParameters(
                    delegationKeyResponse.Value,
                    _blobServiceClient.AccountName);

            return new BlobUriBuilder(blobClient.Uri)
            {
                Sas = sasParameters
            }.ToUri();
        }
    }
}
