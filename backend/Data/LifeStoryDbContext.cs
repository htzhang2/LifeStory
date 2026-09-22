using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class LifeStoryDbContext : DbContext
    {
        public LifeStoryDbContext(DbContextOptions<LifeStoryDbContext> options)
        : base(options)
        {
        }

        public DbSet<LifeStory> LifeStories => Set<LifeStory>();

        public DbSet<InterviewAnswer> InterviewAnswers => Set<InterviewAnswer>();
        public DbSet<HistoricalContext> HistoricalContexts => Set<HistoricalContext>();
        public DbSet<Chapter> Chapters => Set<Chapter>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InterviewAnswer>()
                .HasOne<LifeStory>()
                .WithMany()
                .HasForeignKey(x => x.LifeStoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<HistoricalContext>()
                .HasOne<LifeStory>()
                .WithMany()
                .HasForeignKey(x => x.LifeStoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Chapter>()
                .HasOne<LifeStory>()
                .WithMany()
                .HasForeignKey(x => x.LifeStoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Chapter>()
                .HasIndex(x => new
                {
                    x.LifeStoryId,
                    x.ChapterNumber
                })
                .IsUnique();
        }

    }
}
