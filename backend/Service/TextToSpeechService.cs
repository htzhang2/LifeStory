namespace backend.Service
{
    using Microsoft.CognitiveServices.Speech;

    public class TextToSpeechService
    {
        private readonly IConfiguration _configuration;

        public TextToSpeechService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<byte[]> GenerateMp3Async(
            string text,
            string language)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                throw new ArgumentException(
                    "Text cannot be empty.",
                    nameof(text));
            }

            var voice = language switch
            {
                "en" => "en-US-JennyNeural",
                "zh-CN" => "zh-CN-XiaoxiaoNeural",
                _ => throw new ArgumentException(
                    "Supported languages are en and zh-CN.",
                    nameof(language))
            };

            var key = _configuration["Speech:Key"];
            var region = _configuration["Speech:Region"];

            if (string.IsNullOrWhiteSpace(key) ||
                string.IsNullOrWhiteSpace(region))
            {
                throw new InvalidOperationException(
                    "Azure Speech configuration is missing.");
            }

            var speechConfig =
                SpeechConfig.FromSubscription(key, region);

            speechConfig.SpeechSynthesisVoiceName = voice;

            speechConfig.SetSpeechSynthesisOutputFormat(
                SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3);

            using var synthesizer =
                new SpeechSynthesizer(speechConfig, null);

            using var result =
                await synthesizer.SpeakTextAsync(text);

            if (result.Reason != ResultReason.SynthesizingAudioCompleted)
            {
                throw new InvalidOperationException(
                    $"Speech generation failed: {result.Reason}");
            }

            return result.AudioData;
        }
    }
}
