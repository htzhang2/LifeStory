namespace backend.Service
{
    using OpenAI.Audio;

    public class OpenAiTranscriptionService
    {
        private readonly AudioClient _audioClient;

        public OpenAiTranscriptionService(AudioClient audioClient)
        {
            _audioClient = audioClient;
        }

        public async Task<string> TranscribeAsync(
            Stream audioStream,
            string fileName)
        {
            var tempFile = Path.Combine(
                Path.GetTempPath(),
                $"{Guid.NewGuid()}_{fileName}");

            try
            {
                await using (var fileStream = File.Create(tempFile))
                {
                    await audioStream.CopyToAsync(fileStream);
                }

                var transcription =
                    await _audioClient.TranscribeAudioAsync(tempFile);

                return transcription.Value.Text;
            }
            finally
            {
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
            }
        }
    }
}
