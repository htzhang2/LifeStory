namespace backend.Service
{
    using backend.Models;
    using backend.Data;
    using Microsoft.EntityFrameworkCore;
    using QuestPDF.Fluent;
    using QuestPDF.Helpers;
    using QuestPDF.Infrastructure;

    public class ChapterPdfService
    {
        private readonly PhotoStorageService _photoStorageService;
        private readonly LifeStoryDbContext _db;

        public ChapterPdfService(
            PhotoStorageService photoStorageService,
            LifeStoryDbContext db)
        {
            _photoStorageService = photoStorageService;
            _db = db;
        }

        public async Task<byte[]> GenerateStoryPdfAsync(
            int storyId,
            IReadOnlyList<Chapter> chapters)
        {
            // Load photos for all chapters.
            var chapterPhotos = await _db.ChapterPhotos
                .Where(x =>
                    chapters
                        .Select(c => c.Id)
                        .Contains(x.ChapterId))
                .OrderBy(x => x.ChapterId)
                .ThenBy(x => x.DisplayOrder)
                .ToListAsync();

            // Download photo images before creating the PDF.
            var photoImages = new Dictionary<int, byte[]>();

            foreach (var photo in chapterPhotos)
            {
                if (string.IsNullOrWhiteSpace(
                    photo.OriginalBlobName))
                {
                    continue;
                }

                photoImages[photo.Id] =
                    await _photoStorageService.DownloadAsync(
                        photo.OriginalBlobName);
            }

            var document =
                Document.Create(container =>
                {
                    foreach (var chapter in chapters)
                    {
                        var photos = chapterPhotos
                            .Where(x =>
                                x.ChapterId == chapter.Id)
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

                            page.DefaultTextStyle(
                                style => style
                                    .FontSize(12)
                                    .LineHeight(1.65f));

                            page.Header()
                                .PaddingBottom(10)
                                .AlignCenter()
                                .Text(chapter.Title)
                                .FontSize(10)
                                .FontColor(
                                    Colors.Grey.Darken1);

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

                                    var paragraphs =
                                        chapter.Content
                                            .Split(
                                                new[]
                                                {
                                                "\r\n\r\n",
                                                "\n\n"
                                                },
                                                StringSplitOptions
                                                    .RemoveEmptyEntries)
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

                                        column.Item()
                                            .PageBreak();

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
