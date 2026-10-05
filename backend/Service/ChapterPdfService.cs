using backend.Models;

namespace backend.Service
{
    using QuestPDF.Fluent;
    using QuestPDF.Helpers;
    using QuestPDF.Infrastructure;

    public class ChapterPdfService
    {
        private readonly PhotoStorageService _photoStorageService;

        public ChapterPdfService(
            PhotoStorageService photoStorageService)
        {
            _photoStorageService = photoStorageService;
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

                        // Header
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

                                // Chapter title
                                column.Item()
                                    .PaddingTop(20)
                                    .PaddingBottom(25)
                                    .AlignCenter()
                                    .Text(chapter.Title)
                                    .FontSize(30)
                                    .Bold();

                                // Chapter text
                                foreach (var paragraph in paragraphs)
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
                                                .Width(15.5f, Unit.Centimetre)
                                                .MaxHeight(480)
                                                .Image(photo.ImageBytes)
                                                .FitArea();

                                            // Caption
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

                                            // Memory
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

                        // Footer
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
