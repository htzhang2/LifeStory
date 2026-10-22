namespace backend.Service
{
    using backend.Data;
    using backend.Models;
    using Microsoft.EntityFrameworkCore;
    using QuestPDF.Drawing;
    using QuestPDF.Fluent;
    using QuestPDF.Helpers;
    using QuestPDF.Infrastructure;
    using System;

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
            LifeStory story,
            IReadOnlyList<Chapter> chapters,
            string language = "en")
        {
            var chapterPhotos = await LoadChapterPhotosAsync(chapters);

            var storyPhotos = await _db.StoryPhotos.Where(x => x.LifeStoryId == story.Id)
                .ToListAsync();

            var photoImages = await DownloadPhotoImagesAsync(
                storyPhotos);

            byte[]? coverImage = SelectCoverPhoto(story, photoImages);

            var document = Document.Create(container =>
            {
                AddCoverPage(container, language, coverImage);

                AddTableOfContents(container, chapters, language);

                foreach (var chapter in chapters)
                {
                    var photos = chapterPhotos
                        .Where(x => x.ChapterId == chapter.Id)
                        .OrderBy(x => x.DisplayOrder)
                        .ToList();

                    AddChapterPage(
                        container,
                        chapter,
                        photos,
                        photoImages,
                        $"chapter-{chapter.Id}");
                }
            });

            return document.GeneratePdf();
        }

        private async Task<List<ChapterPhoto>> LoadChapterPhotosAsync(
            IReadOnlyList<Chapter> chapters)
        {
            var chapterIds = chapters
                .Select(x => x.Id)
                .ToList();

            return await _db.ChapterPhotos
                .Where(x => chapterIds.Contains(x.ChapterId))
                .OrderBy(x => x.ChapterId)
                .ThenBy(x => x.DisplayOrder)
                .ToListAsync();
        }

        private async Task<Dictionary<int, byte[]>>
            DownloadPhotoImagesAsync(
                IEnumerable<StoryPhoto> storyPhotos)
        {
            var images = new Dictionary<int, byte[]>();

            foreach (var photo in storyPhotos)
            {
                if (string.IsNullOrWhiteSpace(photo.OriginalBlobName))
                {
                    continue;
                }

                images[photo.Id] =
                    await _photoStorageService.DownloadAsync(
                        photo.OriginalBlobName);
            }

            return images;
        }

        private static byte[]? SelectCoverPhoto(
            LifeStory story,
            IReadOnlyDictionary<int, byte[]> photoImages)
        {
            byte[]? coverImage = null;

            if (story.CoverPhotoId.HasValue)
            {
                if (photoImages.TryGetValue(story.CoverPhotoId.Value, out var imageBytes))
                {
                    coverImage = imageBytes;

                }
            }

            return coverImage;
        }

        private static void AddCoverPage(
            IDocumentContainer container,
            string language,
            byte[]? coverImage)
        {
            var isChinese = string.Equals(
                language,
                "zh-CN",
                StringComparison.OrdinalIgnoreCase);

            var coverLabel = isChinese
                ? "家庭回忆录"
                : "A FAMILY MEMOIR";

            var coverTitle = isChinese
                ? "我的人生故事"
                : "My Life Story";

            var coverSubtitle = isChinese
                ? "回忆、亲情与人生旅程"
                : "Memories, Family, and the Journey of a Lifetime";

            var coverClosing = isChinese
                ? "珍藏回忆，传承给下一代"
                : "A collection of memories to pass down";

            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);

                page.DefaultTextStyle(style => style
                    .FontFamily("Noto Sans CJK SC", "Lato"));

                
                page.Content()
                    .Background(Colors.Grey.Lighten4)
                    .Padding(2, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(20);

                        // Cover label
                        column.Item()
                            .PaddingTop(45)
                            .AlignCenter()
                            .Text(coverLabel)
                            .FontSize(11)
                            .Bold()
                            .FontColor(Colors.Brown.Darken2);

                        // Decorative divider
                        column.Item()
                            .PaddingHorizontal(35)
                            .LineHorizontal(1)
                            .LineColor(Colors.Brown.Lighten2);

                        // Main title
                        column.Item()
                            .PaddingTop(10)
                            .AlignCenter()
                            .Text(coverTitle)
                            .FontSize(isChinese ? 32 : 36)
                            .Bold()
                            .FontColor(Colors.Brown.Darken3)
                            .AlignCenter();

                        // Subtitle
                        column.Item()
                            .PaddingTop(2)
                            .PaddingHorizontal(15)
                            .AlignCenter()
                            .Text(coverSubtitle)
                            .FontSize(15)
                            .FontColor(Colors.Grey.Darken2)
                            .AlignCenter();

                        // Optional cover photo
                        if (coverImage is { Length: > 0 })
                        {
                            column.Item()
                                .PaddingTop(15)
                                .ExtendHorizontal()
                                .AlignCenter()
                                .AlignMiddle()
                                .Height(8, Unit.Centimetre)
                                .Image(coverImage)
                                .FitArea();
                        }

                        // Closing text
                        column.Item()
                            .PaddingTop(20)
                            .AlignCenter()
                            .Text(coverClosing)
                            .FontSize(12)
                            .Italic()
                            .FontColor(Colors.Brown.Darken2);
                    });
            });
        }

        private static void AddTableOfContents(
            IDocumentContainer container,
            IReadOnlyList<Chapter> chapters,
            string language)
        {
            var isChinese = language == "zh-CN";

            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);

                page.DefaultTextStyle(style => style
                    .FontFamily("Noto Sans CJK SC", "Lato")
                    .FontSize(12));

                page.Content()
                    .Column(column =>
                    {
                        column.Spacing(18);

                        column.Item()
                            .PaddingBottom(12)
                            .Text(isChinese ? "目录" : "Table of Contents")
                            .FontSize(24)
                            .Bold();

                        foreach (var chapter in chapters)
                        {
                            var sectionName = $"chapter-{chapter.Id}";

                            column.Item().Row(row =>
                            {
                                row.RelativeItem()
                                    .Text($"{chapter.ChapterNumber}. {chapter.Title}");

                                row.ConstantItem(40)
                                    .AlignRight()
                                    .Text(text =>
                                    {
                                        text.BeginPageNumberOfSection(sectionName);
                                        text.Span("-");
                                        text.EndPageNumberOfSection(sectionName);
                                    });
                            });
                        }
                    });
            });
        }

        private static void AddChapterPage(
            IDocumentContainer container,
            Chapter chapter,
            IReadOnlyList<ChapterPhoto> photos,
            IReadOnlyDictionary<int, byte[]> photoImages,
            string sectionName)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);

                page.MarginHorizontal(2.2f, Unit.Centimetre);
                page.MarginVertical(2.5f, Unit.Centimetre);

                page.DefaultTextStyle(style => style
                    .FontFamily("Noto Sans CJK SC", "Lato")
                    .FontSize(11)
                    .LineHeight(1.6f));

                page.Header()
                    .PaddingBottom(8)
                    .AlignCenter()
                    .Text(chapter.Title)
                    .FontSize(9)
                    .FontColor(Colors.Grey.Medium);

                page.Content()
                    .Section(sectionName)
                    .Column(column =>
                    {
                        column.Spacing(18);

                        column.Item()
                            .ShowEntire()
                            .PaddingTop(15)
                            .PaddingBottom(20)
                            .AlignCenter()
                            .Text(chapter.Title)
                            .FontSize(26)
                            .Bold();

                        var paragraphs = chapter.Content
                            .Split(
                                new[] { "\r\n\r\n", "\n\n" },
                                StringSplitOptions.RemoveEmptyEntries)
                            .Select(x => x.Trim())
                            .Where(x => !string.IsNullOrWhiteSpace(x));

                        foreach (var paragraph in paragraphs)
                        {
                            column.Item()
                                .PaddingBottom(8)
                                .Text(paragraph)
                                .FontSize(11)
                                .LineHeight(1.6f);
                        }

                        foreach (var photo in photos)
                        {
                            if (!photoImages.TryGetValue(
                                photo.StoryPhotoId,
                                out var imageBytes))
                            {
                                continue;
                            }

                            AddPhotoPage(column, photo, imageBytes);
                        }
                    });

                AddPageFooter(page.Footer());
            });
        }

        private static void AddPhotoPage(
            ColumnDescriptor column,
            ChapterPhoto photo,
            byte[] imageBytes)
        {
            // Give each photo its own page.
            column.Item().PageBreak();

            // Keep the photo and its caption/memory together.
            column.Item()
                .ShowEntire()
                .Column(photoColumn =>
                {
                    photoColumn.Spacing(14);

                    photoColumn.Item()
                        .AlignCenter()
                        .Width(15.5f, Unit.Centimetre)
                        .MaxHeight(400)
                        .Image(imageBytes)
                        .FitArea();

                    if (!string.IsNullOrWhiteSpace(photo.Caption))
                    {
                        photoColumn.Item()
                            .PaddingTop(8)
                            .PaddingHorizontal(15)
                            .Text(photo.Caption)
                            .FontSize(16)
                            .Bold()
                            .AlignCenter();
                    }

                    if (!string.IsNullOrWhiteSpace(photo.Memory))
                    {
                        photoColumn.Item()
                            .PaddingTop(4)
                            .PaddingHorizontal(20)
                            .Text(photo.Memory)
                            .FontSize(11)
                            .LineHeight(1.6f)
                            .AlignCenter();
                    }
                });
        }

        private static void AddPageFooter(
            IContainer footer)
        {
            footer
                .PaddingTop(8)
                .AlignCenter()
                .Text(text =>
                {
                    text.CurrentPageNumber();
                });
        }
    }
}