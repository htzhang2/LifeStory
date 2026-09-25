namespace backend.Service
{
    using Azure.Storage.Blobs;

    public class PhotoStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName;

        public PhotoStorageService(
            BlobServiceClient blobServiceClient,
            IConfiguration configuration)
        {
            _blobServiceClient = blobServiceClient;

            _containerName =
                configuration["AzureStorage:ContainerName"]
                ?? "story-photos";
        }

        public async Task<string> UploadAsync(
            Stream stream,
            string fileName,
            string contentType)
        {
            var containerClient =
                _blobServiceClient.GetBlobContainerClient(
                    _containerName);

            await containerClient.CreateIfNotExistsAsync();

            var extension = Path.GetExtension(fileName);

            var blobName =
                $"{Guid.NewGuid():N}{extension}";

            var blobClient =
                containerClient.GetBlobClient(blobName);

            await blobClient.UploadAsync(
                stream,
                overwrite: false);

            return blobClient.Uri.ToString();
        }
    }
}
