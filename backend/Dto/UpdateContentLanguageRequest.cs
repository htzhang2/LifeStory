namespace backend.Dto
{
    public class UpdateContentLanguageRequest
    {
        // Language used for questions, generated chapters, and PDFs.
        // "en" = English, "zh-CN" = Simplified Chinese.
        public string ContentLanguage { get; set; } = "en"; 
    }
}
