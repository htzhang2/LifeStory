# LifeStory

**LifeStory is an AI-assisted web application for preserving personal and family memories as an autobiography.**

Instead of asking users to write an autobiography from scratch, LifeStory guides them through questions, collects memories and photos, and uses AI to turn them into organized autobiography chapters.

![LifeStory](docs/screenshots/story-page.png)

## Features

* Guided autobiography questions
* Personal memories and photo management
* AI-generated autobiography chapters
* Automatic photo selection for each chapter
* Chapter editing and regeneration
* Complete autobiography PDF generation
* Azure Blob Storage for photos

## How It Works

```text
Questions → Memories → Photos → AI Chapter Generation
                                      ↓
                              Relevant Photos
                                      ↓
                              Complete PDF
```

Users don't manually assign photos to chapters. During chapter generation, AI selects relevant photos based on their captions and memories.

![Generated Chapter](docs/screenshots/chapter.png)

## Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
* **Backend:** ASP.NET Core .NET 8, Entity Framework Core
* **Database:** SQL Server / Azure SQL
* **Storage:** Azure Blob Storage
* **AI:** OpenAI API
* **PDF:** QuestPDF

## Project Structure

```text
LifeStory/
├── frontend/
└── backend/
```

## Status

LifeStory is an actively developed personal project. The current focus is the core workflow of collecting memories, generating chapters with AI, automatically associating photos, and producing a complete autobiography PDF.

## Roadmap

* More autobiography chapters
* Chinese language support
* Audio memories
* Improved photo organization
* AI-assisted photo analysis
* Historical and cultural context

## License

License information will be added later.
