namespace backend.Service
{
    using backend.Data;
    using backend.Models;
    using Microsoft.EntityFrameworkCore;
    using QuestPDF.Fluent;
    using QuestPDF.Helpers;
    using QuestPDF.Infrastructure;
    using QuestPDF.Drawing;

    public class ChapterPdfService
    {
        private readonly PhotoStorageService _photoStorageService;
        private readonly LifeStoryDbContext _db;

        private static bool _chineseFontRegistered;
        private static readonly object FontLock = new();

        public ChapterPdfService(
            PhotoStorageService photoStorageService,
            LifeStoryDbContext db)
        {
            _photoStorageService = photoStorageService;
            _db = db;

            EnsureChineseFontRegistered();
        }

        private static void EnsureChineseFontRegistered()
        {
            if (_chineseFontRegistered)
            {
                return;
            }

            lock (FontLock)
            {
                if (_chineseFontRegistered)
                {
                    return;
                }

                var fontPath = Path.Combine(
                    AppContext.BaseDirectory,
                    "Fonts",
                    "NotoSansCJKsc-Regular.otf");

                if (!File.Exists(fontPath))
                {
                    throw new FileNotFoundException(
                        "Chinese font file was not found. " +
                        "Please place NotoSansCJKsc-Regular.otf " +
                        "in the backend/Fonts directory and configure " +
                        "it to copy to the output directory.",
                        fontPath);
                }

                using var fontStream = File.OpenRead(fontPath);
                FontManager.RegisterFont(fontStream);

                _chineseFontRegistered = true;
            }
        }

        public async Task<byte[]> GenerateStoryPdfAsync(
            int storyId,
            IReadOnlyList<Chapter> chapters)
        {
            // Load photos for all chapters.
            var chapterIds = chapters
                .Select(c => c.Id)
                .ToList();

            var chapterPhotos = await _db.ChapterPhotos
                .Where(x => chapterIds.Contains(x.ChapterId))
                .OrderBy(x => x.ChapterId)
                .ThenBy(x => x.DisplayOrder)
                .ToListAsync();

            // Download photo images before creating the PDF.
            var photoImages = new Dictionary<int, byte[]>();

            foreach (var photo in chapterPhotos)
            {
                if (string.IsNullOrWhiteSpace(photo.OriginalBlobName))
                {
                    continue;
                }

                photoImages[photo.Id] =
                    await _photoStorageService.DownloadAsync(
                        photo.OriginalBlobName);
            }

            var document = Document.Create(container =>
            {
                foreach (var chapter in chapters)
                {
                    var photos = chapterPhotos
                        .Where(x => x.ChapterId == chapter.Id)
                        .OrderBy(x => x.DisplayOrder)
                        .ToList();

                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);

                        page.MarginHorizontal(
                            2.2f,
                            Unit.Centimetre);

                        page.MarginVertical(
                            2.5f,
                            Unit.Centimetre);

                        // Use the Chinese-capable font throughout the page.
                        // Lato remains a fallback for any unsupported glyphs.
                        page.DefaultTextStyle(style => style
                            .FontFamily("Noto Sans CJK SC", "Lato")
                            .FontSize(12)
                            .LineHeight(1.65f));

                        page.Header()
                            .PaddingBottom(10)
                            .AlignCenter()
                            .Text(chapter.Title)
                            .FontSize(10)
                            .FontColor(Colors.Grey.Darken1);

                        page.Content()
                            .Column(column =>
                            {
                                column.Spacing(18);

                                column.Item()
                                    .PaddingTop(20)
                                    .PaddingBottom(25)
                                    .AlignCenter()
                                    .Text(chapter.Title)
                                    .FontSize(30)
                                    .Bold();

                                var paragraphs = chapter.Content
                                    .Split(
                                        new[]
                                        {
                                            "\r\n\r\n",
                                            "\n\n"
                                        },
                                        StringSplitOptions.RemoveEmptyEntries)
                                    .Select(x => x.Trim())
                                    .Where(x =>
                                        !string.IsNullOrWhiteSpace(x));

                                foreach (var paragraph in paragraphs)
                                {
                                    column.Item()
                                        .Text(paragraph)
                                        .FontSize(12)
                                        .LineHeight(1.7f);
                                }

                                foreach (var photo in photos)
                                {
                                    if (!photoImages.TryGetValue(
                                        photo.Id,
                                        out var imageBytes))
                                    {
                                        continue;
                                    }

                                    column.Item().PageBreak();

                                    column.Item()
                                        .Column(photoColumn =>
                                        {
                                            photoColumn.Spacing(14);

                                            photoColumn.Item()
                                                .AlignCenter()
                                                .Width(
                                                    15.5f,
                                                    Unit.Centimetre)
                                                .MaxHeight(480)
                                                .Image(imageBytes)
                                                .FitArea();

                                            if (!string.IsNullOrWhiteSpace(
                                                photo.Caption))
                                            {
                                                photoColumn.Item()
                                                    .PaddingTop(12)
                                                    .PaddingHorizontal(15)
                                                    .Text(photo.Caption)
                                                    .FontSize(17)
                                                    .Bold()
                                                    .AlignCenter();
                                            }

                                            if (!string.IsNullOrWhiteSpace(
                                                photo.Memory))
                                            {
                                                photoColumn.Item()
                                                    .PaddingTop(4)
                                                    .PaddingHorizontal(20)
                                                    .Text(photo.Memory)
                                                    .FontSize(12)
                                                    .LineHeight(1.7f)
                                                    .AlignCenter();
                                            }
                                        });
                                }
                            });

                        page.Footer()
                            .PaddingTop(10)
                            .AlignCenter()
                            .Text(text =>
                            {
                                text.Span("Chapter ");
                                text.Span(
                                    chapter.ChapterNumber.ToString());

                                text.Span("  —  ");
                                text.CurrentPageNumber();
                                text.Span(" —");
                            });
                    });
                }
            });

            return document.GeneratePdf();
        }
    }
}