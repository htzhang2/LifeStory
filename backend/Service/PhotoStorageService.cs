namespace backend.Service
{
    using Azure.Storage.Blobs;

    public class PhotoStorageService
    {
        private readonly BlobContainerClient _containerClient;

        public PhotoStorageService(
            BlobContainerClient containerClient,
            IConfiguration configuration)
        {
            _containerClient = containerClient;
        }

        public async Task<string> UploadAsync(
            Stream stream,
            string fileName,
            string contentType)
        {
            await _containerClient.CreateIfNotExistsAsync();

            var extension = Path.GetExtension(fileName);

            var blobName =
                $"{Guid.NewGuid():N}{extension}";

            var blobClient =
                _containerClient.GetBlobClient(blobName);

            await blobClient.UploadAsync(
                stream,
                overwrite: false);

            return blobName;
        }
    }
}
