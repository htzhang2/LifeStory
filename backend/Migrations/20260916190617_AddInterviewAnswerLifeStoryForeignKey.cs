using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddInterviewAnswerLifeStoryForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_InterviewAnswers_LifeStoryId",
                table: "InterviewAnswers",
                column: "LifeStoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_InterviewAnswers_LifeStories_LifeStoryId",
                table: "InterviewAnswers",
                column: "LifeStoryId",
                principalTable: "LifeStories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterviewAnswers_LifeStories_LifeStoryId",
                table: "InterviewAnswers");

            migrationBuilder.DropIndex(
                name: "IX_InterviewAnswers_LifeStoryId",
                table: "InterviewAnswers");
        }
    }
}
