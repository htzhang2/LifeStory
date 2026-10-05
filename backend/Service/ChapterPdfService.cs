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

                        page.Header()
                            .AlignCenter()
                            .Text(chapter.Title)
                            .FontSize(24)
                            .Bold();

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
                                    column.Item()
                                        .EnsureSpace(500)
                                        .Column(photoColumn =>
                                        {
                                            photoColumn.Spacing(10);

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
                                                    .Text(photo.Caption)
                                                    .FontSize(13)
                                                    .Bold()
                                                    .AlignCenter();
                                            }

                                            // Memory
                                            if (!string.IsNullOrWhiteSpace(
                                                photo.Memory))
                                            {
                                                photoColumn.Item()
                                                    .Text(photo.Memory)
                                                    .FontSize(11)
                                                    .LineHeight(1.5f);
                                            }
                                        });
                                }
                            });

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
