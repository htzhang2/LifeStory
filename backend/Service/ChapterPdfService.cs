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

            var document =
                Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(2, Unit.Centimetre);

                        page.DefaultTextStyle(
                            style => style
                                .FontSize(12)
                                .LineHeight(1.5f));

                        // Header
                        page.Header()
                            .AlignCenter()
                            .Text(chapter.Title)
                            .FontSize(24)
                            .Bold();

                        // Content
                        page.Content()
                            .PaddingVertical(20)
                            .Column(column =>
                            {
                                column.Spacing(25);

                                // Chapter text
                                column.Item()
                                    .Text(chapter.Content);

                                // Photos
                                foreach (var photo in photos)
                                {
                                    // Start every photo on a new page
                                    column.Item()
                                        .PageBreak();

                                    column.Item()
                                        .Column(photoColumn =>
                                        {
                                            photoColumn.Spacing(12);

                                            // Photo
                                            photoColumn.Item()
                                                .AlignCenter()
                                                .Width(16, Unit.Centimetre)
                                                .MaxHeight(500)
                                                .Image(photo.ImageBytes)
                                                .FitArea();

                                            // Caption
                                            if (!string.IsNullOrWhiteSpace(
                                                photo.Caption))
                                            {
                                                photoColumn.Item()
                                                    .PaddingTop(8)
                                                    .Text(photo.Caption)
                                                    .FontSize(16)
                                                    .Bold()
                                                    .AlignCenter();
                                            }

                                            // Memory
                                            if (!string.IsNullOrWhiteSpace(
                                                photo.Memory))
                                            {
                                                photoColumn.Item()
                                                    .PaddingTop(4)
                                                    .Text(photo.Memory)
                                                    .FontSize(12)
                                                    .LineHeight(1.6f)
                                                    .AlignCenter();
                                            }
                                        });
                                }
                            });

                        // Footer
                        page.Footer()
                            .AlignCenter()
                            .Text(text =>
                            {
                                text.Span("Page ");
                                text.CurrentPageNumber();
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
