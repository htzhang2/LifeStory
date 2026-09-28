namespace backend.Controllers
{
    using Azure.Storage.Blobs;
    using Azure.Storage.Sas;
    using backend.Data;
    using backend.Dto;
    using backend.Models;
    using backend.Service;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;

    [ApiController]
    [Route("api/lifestories/{storyId:int}/photos")]
    public class StoryPhotosController : ControllerBase
    {
        private readonly LifeStoryDbContext _db;
        private readonly PhotoStorageService _photoStorage;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly BlobContainerClient _containerClient;

        public StoryPhotosController(
            LifeStoryDbContext db,
            PhotoStorageService photoStorage,
            BlobServiceClient blobServiceClient,
            BlobContainerClient containerClient)
        {
            _db = db;
            _photoStorage = photoStorage;
            _blobServiceClient = blobServiceClient;
            _containerClient = containerClient;
        }

        // POST /api/lifestories/{storyId}/photos
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(21 * 1024 * 1024)]
        public async Task<ActionResult<StoryPhotoResponse>> Upload(
            int storyId,
            IFormFile photo,
            CancellationToken cancellationToken)
        {
            var storyExists = await _db.LifeStories
                .AnyAsync(x => x.Id == storyId, cancellationToken);

            if (!storyExists)
            {
                return NotFound("Life story not found.");
            }

            if (photo == null || photo.Length == 0)
            {
                return BadRequest("A photo file is required.");
            }

            const long maxFileSize = 20 * 1024 * 1024;

            if (photo.Length > maxFileSize)
            {
                return BadRequest("Photo must be 20 MB or smaller.");
            }

            var allowedContentTypes = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp"
            };

            if (!allowedContentTypes.Contains(photo.ContentType))
            {
                return BadRequest(
                    "Only JPEG, PNG, GIF and WebP images are supported.");
            }

            string blobName;

            await using (var stream = photo.OpenReadStream())
            {
                blobName = await _photoStorage.UploadAsync(
                    stream,
                    Path.GetFileName(photo.FileName),
                    photo.ContentType);
            }

            var now = DateTime.UtcNow;

            var storyPhoto = new StoryPhoto
            {
                LifeStoryId = storyId,
                OriginalBlobName = blobName,
                Caption = string.Empty,
                Memory = string.Empty,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.StoryPhotos.Add(storyPhoto);

            var story = await _db.LifeStories.FindAsync(
                new object[] { storyId },
                cancellationToken);

            if (story != null)
            {
                story.UpdatedAt = now;
            }

            await _db.SaveChangesAsync(cancellationToken);

            var response = ToResponse(storyPhoto);

            return CreatedAtAction(
                nameof(GetPhoto),
                new { storyId, photoId = storyPhoto.Id },
                response);
        }

        // GET /api/lifestories/{storyId}/photos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StoryPhotoResponse>>> GetPhotos(
            int storyId,
            CancellationToken cancellationToken)
        {
            var storyExists = await _db.LifeStories
                .AnyAsync(x => x.Id == storyId, cancellationToken);

            if (!storyExists)
            {
                return NotFound("Life story not found.");
            }

            var photos = await _db.StoryPhotos
                .Where(x => x.LifeStoryId == storyId)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            return Ok(photos.Select(ToResponse));
        }

        // GET /api/lifestories/{storyId}/photos/{photoId}
        // Returns photo metadata and a short-lived read-only SAS URL.
        [HttpGet("{photoId:int}")]
        public async Task<ActionResult<StoryPhotoWithUrlResponse>> GetPhoto(
            int storyId,
            int photoId,
            CancellationToken cancellationToken)
        {
            var photo = await _db.StoryPhotos
                .FirstOrDefaultAsync(
                    x => x.Id == photoId && x.LifeStoryId == storyId,
                    cancellationToken);

            if (photo == null)
            {
                return NotFound("Photo not found.");
            }

            var blobClient = _containerClient.GetBlobClient(
                photo.OriginalBlobName);

            // Keep the SAS brief and read-only. The start time is slightly
            // in the past to avoid clock-skew issues.
            var startsOn = DateTimeOffset.UtcNow.AddMinutes(-5);
            var expiresOn = DateTimeOffset.UtcNow.AddMinutes(15);

            var delegationKeyResponse =
                await _blobServiceClient.GetUserDelegationKeyAsync(
                    startsOn,
                    expiresOn,
                    cancellationToken);

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerClient.Name,
                BlobName = photo.OriginalBlobName,
                Resource = "b",
                StartsOn = startsOn,
                ExpiresOn = expiresOn
            };

            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            var sasParameters = sasBuilder.ToSasQueryParameters(
                delegationKeyResponse.Value,
                _blobServiceClient.AccountName);

            var sasUri = new BlobUriBuilder(blobClient.Uri)
            {
                Sas = sasParameters
            }.ToUri();

            return Ok(new StoryPhotoWithUrlResponse
            {
                Id = photo.Id,
                LifeStoryId = photo.LifeStoryId,
                Caption = photo.Caption,
                Memory = photo.Memory,
                CreatedAt = photo.CreatedAt,
                UpdatedAt = photo.UpdatedAt,
                Url = sasUri.ToString(),
                UrlExpiresAt = expiresOn
            });
        }

        // PUT /api/lifestories/{storyId}/photos/{photoId}
        [HttpPut("{photoId:int}")]
        public async Task<ActionResult<StoryPhotoResponse>> UpdatePhoto(
            int storyId,
            int photoId,
            [FromBody] UpdateStoryPhotoRequest request,
            CancellationToken cancellationToken)
        {
            var photo = await _db.StoryPhotos
                .FirstOrDefaultAsync(
                    x => x.Id == photoId && x.LifeStoryId == storyId,
                    cancellationToken);

            if (photo == null)
            {
                return NotFound("Photo not found.");
            }

            photo.Caption = request.Caption?.Trim() ?? string.Empty;
            photo.Memory = request.Memory?.Trim() ?? string.Empty;
            photo.UpdatedAt = DateTime.UtcNow;

            var story = await _db.LifeStories.FindAsync(
                new object[] { storyId },
                cancellationToken);

            if (story != null)
            {
                story.UpdatedAt = photo.UpdatedAt;
            }

            await _db.SaveChangesAsync(cancellationToken);

            return Ok(ToResponse(photo));
        }

        // DELETE /api/lifestories/{storyId}/photos/{photoId}
        [HttpDelete("{photoId:int}")]
        public async Task<IActionResult> DeletePhoto(
            int storyId,
            int photoId,
            CancellationToken cancellationToken)
        {
            var photo = await _db.StoryPhotos
                .FirstOrDefaultAsync(
                    x => x.Id == photoId && x.LifeStoryId == storyId,
                    cancellationToken);

            if (photo == null)
            {
                return NotFound("Photo not found.");
            }

            var blobClient = _containerClient.GetBlobClient(
                photo.OriginalBlobName);

            await blobClient.DeleteIfExistsAsync(
                cancellationToken: cancellationToken);

            _db.StoryPhotos.Remove(photo);

            var story = await _db.LifeStories.FindAsync(
                new object[] { storyId },
                cancellationToken);

            if (story != null)
            {
                story.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        private static StoryPhotoResponse ToResponse(StoryPhoto photo)
        {
            return new StoryPhotoResponse
            {
                Id = photo.Id,
                LifeStoryId = photo.LifeStoryId,
                OriginalBlobName = photo.OriginalBlobName,
                Caption = photo.Caption,
                Memory = photo.Memory,
                CreatedAt = photo.CreatedAt,
                UpdatedAt = photo.UpdatedAt
            };
        }
    }
}
