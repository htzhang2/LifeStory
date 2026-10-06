import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  generateChapter,
  getChapter,
  getChapterDefinitions,
  getChapterPhotos,
  getChapters,
  updateChapter,
  type Chapter,
  type ChapterDefinition,
  type ChapterPhoto,
} from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

export default function StoryPage() {
  const { storyId } = useStory()
  const navigate = useNavigate()

  const [definitions, setDefinitions] =
    useState<ChapterDefinition[]>([])

  const [chapters, setChapters] =
    useState<Chapter[]>([])

  const [selectedChapterNumber, setSelectedChapterNumber] =
    useState<number | null>(null)

  const [chapterTitle, setChapterTitle] = useState("")
  const [chapterContent, setChapterContent] = useState("")

  const [chapterPhotos, setChapterPhotos] =
    useState<ChapterPhoto[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [error, setError] = useState("")

  useEffect(() => {
    if (storyId === null) {
      setIsLoading(false)
      return
    }

    const currentStoryId = storyId

    async function loadStory() {
      try {
        setError("")

        const [
          chapterDefinitions,
          existingChapters,
        ] = await Promise.all([
          getChapterDefinitions(),
          getChapters(currentStoryId),
        ])

        setDefinitions(chapterDefinitions)
        setChapters(existingChapters)

        if (chapterDefinitions.length > 0) {
          const firstChapter =
            chapterDefinitions[0]

          setSelectedChapterNumber(
            firstChapter.chapterNumber
          )

          const existingChapter =
            existingChapters.find(
              x =>
                x.chapterNumber ===
                firstChapter.chapterNumber
            )

          if (existingChapter) {
            setChapterTitle(existingChapter.title)
            setChapterContent(existingChapter.content)

            const photos =
              await getChapterPhotos(
                currentStoryId,
                firstChapter.chapterNumber
              )

            setChapterPhotos(photos)
          } else {
            setChapterTitle("")
            setChapterContent("")
            setChapterPhotos([])
          }
        }
      } catch (err) {
        console.error(err)
        setError("Failed to load your story.")
      } finally {
        setIsLoading(false)
      }
    }

    loadStory()
  }, [storyId])

  async function handleSelectChapter(
    chapterNumber: number
  ) {
    if (storyId === null) {
      return
    }

    try {
      setError("")
      setSelectedChapterNumber(chapterNumber)
      setIsEditing(false)

      const existingChapter =
        chapters.find(
          x => x.chapterNumber === chapterNumber
        )

      if (!existingChapter) {
        setChapterTitle("")
        setChapterContent("")
        setChapterPhotos([])
        return
      }

      const result = await getChapter(
        storyId,
        chapterNumber
      )

      setChapterTitle(result.title)
      setChapterContent(result.content)

      const photos =
        await getChapterPhotos(
          storyId,
          chapterNumber
        )

      setChapterPhotos(photos)
    } catch (err) {
      console.error(err)
      setError("Failed to load the chapter.")
    }
  }

  async function handleGenerate() {
    if (
      storyId === null ||
      selectedChapterNumber === null
    ) {
      return
    }

    try {
      setError("")
      setIsGenerating(true)

      const result = await generateChapter(
        storyId,
        selectedChapterNumber
      )

      setChapterTitle(result.title)
      setChapterContent(result.content)
      setIsEditing(false)

      const photos =
        await getChapterPhotos(
          storyId,
          selectedChapterNumber
        )

      setChapterPhotos(photos)

      const updatedChapters =
        await getChapters(storyId)

      setChapters(updatedChapters)
    } catch (err) {
      console.error(err)

      setError(
        "Failed to generate the chapter. Please try again."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (
      storyId === null ||
      selectedChapterNumber === null
    ) {
      return
    }

    try {
      setError("")
      setIsSaving(true)

      const result = await updateChapter(
        storyId,
        selectedChapterNumber,
        chapterTitle,
        chapterContent
      )

      setChapterTitle(result.title)
      setChapterContent(result.content)
      setIsEditing(false)

      const updatedChapters =
        await getChapters(storyId)

      setChapters(updatedChapters)
    } catch (err) {
      console.error(err)

      setError(
        "Failed to save the chapter. Please try again."
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditMemories() {
    navigate("/question/1")
  }

  function handlePhotos() {
    navigate("/photos")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          Loading your story...
        </p>
      </div>
    )
  }

  if (storyId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          Please start your story first.
        </p>
      </div>
    )
  }

  const selectedDefinition =
    definitions.find(
      x =>
        x.chapterNumber ===
        selectedChapterNumber
    ) ?? null

  const selectedChapter =
    chapters.find(
      x =>
        x.chapterNumber ===
        selectedChapterNumber
    ) ?? null

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-6">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Your Story
          </h1>

          <p className="mt-2 text-gray-600">
            Turn your memories into chapters of your
            life story.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Chapter List */}
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Chapters
          </h2>

          <div className="space-y-4">
            {definitions.map(definition => {
              const chapter =
                chapters.find(
                  x =>
                    x.chapterNumber ===
                    definition.chapterNumber
                )

              const isSelected =
                selectedChapterNumber ===
                definition.chapterNumber

              return (
                <div
                  key={definition.chapterNumber}
                  className={`rounded-xl border bg-white p-5 ${
                    isSelected
                      ? "border-gray-900"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <div className="text-sm text-gray-500">
                        Chapter{" "}
                        {definition.chapterNumber}
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900">
                        {definition.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Questions{" "}
                        {definition.startQuestion}
                        {"–"}
                        {definition.endQuestion}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">

                      {chapter ? (
                        <span className="text-sm font-medium text-green-600">
                          Created
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Not created
                        </span>
                      )}

                      <button
                        onClick={() =>
                          handleSelectChapter(
                            definition.chapterNumber
                          )
                        }
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        {chapter
                          ? "Read Chapter"
                          : "Create Chapter"}
                      </button>

                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Chapter */}
        {selectedDefinition && (
          <div className="rounded-xl bg-white p-6 shadow-sm">

            {/* Chapter Header */}
            <div className="mb-6">
              <div className="text-sm text-gray-500">
                Chapter{" "}
                {selectedDefinition.chapterNumber}
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDefinition.title}
              </h2>
            </div>

            {/* Chapter Does Not Exist */}
            {!selectedChapter ? (
              <div>
                <p className="mb-6 text-gray-600">
                  Your answers to questions{" "}
                  {selectedDefinition.startQuestion}
                  {"–"}
                  {selectedDefinition.endQuestion}
                  {" "}
                  will be used to create this chapter.
                </p>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating
                    ? "Creating Chapter..."
                    : "Create My Chapter"}
                </button>
              </div>
            ) : (
              <>
                {/* Editing */}
                {isEditing ? (
                  <div className="space-y-4">

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Chapter Title
                      </label>

                      <input
                        value={chapterTitle}
                        onChange={e =>
                          setChapterTitle(
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 p-3 focus:border-gray-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Chapter
                      </label>

                      <textarea
                        value={chapterContent}
                        onChange={e =>
                          setChapterContent(
                            e.target.value
                          )
                        }
                        rows={18}
                        className="w-full rounded-lg border border-gray-300 p-3 focus:border-gray-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-lg bg-black px-5 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {isSaving
                          ? "Saving..."
                          : "Save"}
                      </button>

                      <button
                        onClick={() =>
                          setIsEditing(false)
                        }
                        disabled={isSaving}
                        className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chapter Content */}
                    <div className="prose max-w-none whitespace-pre-wrap text-gray-800">
                      {chapterContent}
                    </div>

                    {/* Chapter Photos */}
                    {chapterPhotos.length > 0 && (
                      <div className="mt-10 border-t pt-8">

                        <h3 className="mb-5 text-xl font-semibold text-gray-900">
                          Photos
                        </h3>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          {chapterPhotos.map(photo => (
                            <div
                              key={photo.id}
                              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                              <img
                                src={photo.url}
                                alt={
                                  photo.caption ||
                                  "Story photo"
                                }
                                className="h-auto w-full object-cover"
                              />

                              {photo.caption && (
                                <div className="p-4">
                                  <p className="text-sm text-gray-600">
                                    {photo.caption}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chapter Actions */}
                    <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">

                      <button
                        onClick={() =>
                          setIsEditing(true)
                        }
                        className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit Chapter
                      </button>

                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isGenerating
                          ? "Regenerating..."
                          : "Regenerate"}
                      </button>

                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Memories and Photos */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">

          <button
            onClick={handleEditMemories}
            className="rounded-xl border border-gray-200 bg-white p-5 text-left hover:border-gray-400"
          >
            <h3 className="font-semibold text-gray-900">
              Your Memories
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Edit your interview answers
            </p>
          </button>

          <button
            onClick={handlePhotos}
            className="rounded-xl border border-gray-200 bg-white p-5 text-left hover:border-gray-400"
          >
            <h3 className="font-semibold text-gray-900">
              Your Photos
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add or manage your photos
            </p>
          </button>

        </div>

      </div>
    </div>
  )
}
