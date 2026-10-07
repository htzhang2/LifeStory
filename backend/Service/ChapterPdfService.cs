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
            using var stream = new MemoryStream();

            // Load all ChapterPhoto records for this story.
            var chapterIds = chapters
                .Select(x => x.Id)
                .ToList();

            var chapterPhotos = await _db.ChapterPhotos
                .Where(x => chapterIds.Contains(x.ChapterId))
                .OrderBy(x => x.ChapterId)
                .ThenBy(x => x.DisplayOrder)
                .ToListAsync();

            // ChapterPhoto only contains StoryPhotoId, so load
            // the StoryPhoto records explicitly.
            var storyPhotoIds = chapterPhotos
                .Select(x => x.StoryPhotoId)
                .Distinct()
                .ToList();

            var storyPhotos = await _db.StoryPhotos
                .Where(x =>
                    x.LifeStoryId == storyId &&
                    storyPhotoIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id);

            // Download all photo blobs before creating the PDF.
            var photosByChapter =
                new Dictionary<int, List<PdfPhoto>>();

            foreach (var chapter in chapters)
            {
                var photos = new List<PdfPhoto>();

                var chapterPhotoRecords =
                    chapterPhotos
                        .Where(x => x.ChapterId == chapter.Id)
                        .OrderBy(x => x.DisplayOrder);

                foreach (var chapterPhoto in chapterPhotoRecords)
                {
                    if (!storyPhotos.TryGetValue(
                        chapterPhoto.StoryPhotoId,
                        out var storyPhoto))
                    {
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(
                        storyPhoto.OriginalBlobName))
                    {
                        continue;
                    }

                    var imageBytes =
                        await _photoStorageService.DownloadAsync(
                            storyPhoto.OriginalBlobName);

                    photos.Add(
                        new PdfPhoto
                        {
                            ImageBytes = imageBytes,
                            Caption = storyPhoto.Caption,
                            Memory = storyPhoto.Memory
                        });
                }

                photosByChapter[chapter.Id] = photos;
            }

            var document =
                Document.Create(container =>
                {
                    foreach (var chapter in chapters)
                    {
                        var photos =
                            photosByChapter[chapter.Id];

                        var paragraphs = chapter.Content
                            .Split(
                                new[] { "\r\n\r\n", "\n\n" },
                                StringSplitOptions.RemoveEmptyEntries)
                            .Select(x => x.Trim())
                            .Where(x =>
                                !string.IsNullOrWhiteSpace(x))
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

                            // Header
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

                                    // Chapter title
                                    column.Item()
                                        .PaddingTop(20)
                                        .PaddingBottom(25)
                                        .AlignCenter()
                                        .Text(chapter.Title)
                                        .FontSize(30)
                                        .Bold();

                                    // Chapter text
                                    foreach (var paragraph
                                        in paragraphs)
                                    {
                                        column.Item()
                                            .Text(paragraph)
                                            .FontSize(12)
                                            .LineHeight(1.7f);
                                    }

                                    // Photos
                                    foreach (var photo in photos)
                                    {
                                        column.Item()
                                            .PageBreak();

                                        column.Item()
                                            .Column(photoColumn =>
                                            {
                                                photoColumn.Spacing(14);

                                                // Photo
                                                photoColumn.Item()
                                                    .AlignCenter()
                                                    .Width(
                                                        15.5f,
                                                        Unit.Centimetre)
                                                    .MaxHeight(480)
                                                    .Image(
                                                        photo.ImageBytes)
                                                    .FitArea();

                                                // Caption
                                                if (!string.IsNullOrWhiteSpace(
                                                    photo.Caption))
                                                {
                                                    photoColumn.Item()
                                                        .PaddingTop(12)
                                                        .PaddingHorizontal(15)
                                                        .Text(
                                                            photo.Caption)
                                                        .FontSize(17)
                                                        .Bold()
                                                        .AlignCenter();
                                                }

                                                // Memory
                                                if (!string.IsNullOrWhiteSpace(
                                                    photo.Memory))
                                                {
                                                    photoColumn.Item()
                                                        .PaddingTop(4)
                                                        .PaddingHorizontal(20)
                                                        .Text(
                                                            photo.Memory)
                                                        .FontSize(12)
                                                        .LineHeight(1.7f)
                                                        .AlignCenter();
                                                }
                                            });
                                    }
                                });

                            // Footer
                            page.Footer()
                                .PaddingTop(10)
                                .AlignCenter()
                                .Text(text =>
                                {
                                    text.Span("Chapter ");
                                    text.Span(
                                        chapter.ChapterNumber
                                            .ToString());

                                    text.Span("  —  ");

                                    text.CurrentPageNumber();

                                    text.Span(" —");
                                });
                        });
                    }
                });

            document.GeneratePdf(stream);

            return stream.ToArray();
        }

        public async Task<byte[]> GenerateAsync(
            Chapter chapter,
            IEnumerable<ChapterPdfPhoto> chapterPhotos)
        {
            var photos = new List<PdfPhoto>();

            foreach (var chapterPhoto in chapterPhotos)
            {
                var imageBytes =
                    await _photoStorageService.DownloadAsync(
                        chapterPhoto.OriginalBlobName);

                photos.Add(
                    new PdfPhoto
                    {
                        ImageBytes = imageBytes,
                        Caption = chapterPhoto.Caption,
                        Memory = chapterPhoto.Memory
                    });
            }

            var paragraphs = chapter.Content
                .Split(
                    new[] { "\r\n\r\n", "\n\n" },
                    StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();

            var document =
                Document.Create(container =>
                {
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

                                foreach (var paragraph in paragraphs)
                                {
                                    column.Item()
                                        .Text(paragraph)
                                        .FontSize(12)
                                        .LineHeight(1.7f);
                                }

                                foreach (var photo in photos)
                                {
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
                                                .Image(
                                                    photo.ImageBytes)
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
                                text.Span("— ");
                                text.CurrentPageNumber();
                                text.Span(" —");
                            });
                    });
                });

            return document.GeneratePdf();
        }

        private class PdfPhoto
        {
            public byte[] ImageBytes { get; set; } = [];

            public string Caption { get; set; } = string.Empty;

            public string Memory { get; set; } = string.Empty;
        }
    }
}
