using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddChapterPhoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChapterPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChapterId = table.Column<int>(type: "int", nullable: false),
                    StoryPhotoId = table.Column<int>(type: "int", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChapterPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChapterPhotos_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChapterPhotos_StoryPhotos_StoryPhotoId",
                        column: x => x.StoryPhotoId,
                        principalTable: "StoryPhotos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChapterPhotos_ChapterId_DisplayOrder",
                table: "ChapterPhotos",
                columns: new[] { "ChapterId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ChapterPhotos_ChapterId_StoryPhotoId",
                table: "ChapterPhotos",
                columns: new[] { "ChapterId", "StoryPhotoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChapterPhotos_StoryPhotoId",
                table: "ChapterPhotos",
                column: "StoryPhotoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChapterPhotos");
        }
    }
}
