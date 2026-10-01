using backend.Models;
using Microsoft.EntityFrameworkCore;
using System;

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
        public DbSet<StoryPhoto> StoryPhotos => Set<StoryPhoto>();
        public DbSet<ChapterPhoto> ChapterPhotos => Set<ChapterPhoto>();

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


            modelBuilder.Entity<StoryPhoto>()
                .HasOne<LifeStory>()
                .WithMany()
                .HasForeignKey(x => x.LifeStoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChapterPhoto>()
                .HasOne<Chapter>()
                .WithMany()
                .HasForeignKey(x => x.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChapterPhoto>()
                .HasOne<StoryPhoto>()
                .WithMany()
                .HasForeignKey(x => x.StoryPhotoId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ChapterPhoto>()
                .HasIndex(x => new
                {
                    x.ChapterId,
                    x.StoryPhotoId
                })
                .IsUnique();

            modelBuilder.Entity<ChapterPhoto>()
                .HasIndex(x => new
                {
                    x.ChapterId,
                    x.DisplayOrder
                });
        }

    }
}
