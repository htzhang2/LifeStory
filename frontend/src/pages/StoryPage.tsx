import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  generateChapter,
  getChapter,
  updateChapter,
} from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

export default function StoryPage() {
  const { storyId } = useStory()
  const navigate = useNavigate()

  const [chapterTitle, setChapterTitle] = useState("")
  const [chapterContent, setChapterContent] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasChapter, setHasChapter] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (storyId === null) {
      setIsLoading(false)
      return
    }

    async function loadChapter() {
      try {
        setError("")

        const result = await getChapter(
          storyId ?? 1,
          1
        )

        setChapterTitle(result.title)
        setChapterContent(result.content)
        setHasChapter(true)
      } catch {
        // Chapter does not exist yet.
        setHasChapter(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadChapter()
  }, [storyId])

  async function handleGenerate() {
    if (storyId === null) {
      return
    }

    try {
      setError("")
      setIsGenerating(true)

      const result = await generateChapter(
        storyId,
        1
      )

      setChapterTitle(result.title)
      setChapterContent(result.content)
      setHasChapter(true)
      setIsEditing(false)
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
    if (storyId === null) {
      return
    }

    try {
      setError("")
      setIsSaving(true)

      const result = await updateChapter(
        storyId,
        1,
        chapterTitle,
        chapterContent
      )

      setChapterTitle(result.title)
      setChapterContent(result.content)
      setHasChapter(true)
      setIsEditing(false)
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
      <div className="mx-auto max-w-4xl p-8">
        <p className="text-gray-600">
          Loading your story...
        </p>
      </div>
    )
  }

  if (storyId === null) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-bold">
          No Life Story Found
        </h1>

        <p className="mt-3 text-gray-600">
          Please start a new life story first.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Start a Life Story
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          My Life Story
        </h1>

        <p className="mt-2 text-gray-600">
          Your memories are becoming a story.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* No chapter yet */}
      {!hasChapter && (
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Create Your First Chapter
          </h2>

          <p className="mt-3 text-gray-600">
            We will use the memories you provided during
            the interview to create the beginning of your
            autobiography.
          </p>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating
              ? "Creating Chapter..."
              : "Create My Chapter"}
          </button>
        </div>
      )}

      {/* Chapter */}
      {hasChapter && (
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) =>
                setChapterTitle(e.target.value)
              }
              className="mb-6 w-full rounded-lg border px-4 py-3 text-2xl font-semibold outline-none focus:border-blue-500"
            />
          ) : (
            <h2 className="mb-6 text-3xl font-semibold">
              {chapterTitle}
            </h2>
          )}

          {/* Content */}
          {isEditing ? (
            <textarea
              value={chapterContent}
              onChange={(e) =>
                setChapterContent(e.target.value)
              }
              rows={20}
              className="w-full rounded-lg border px-4 py-3 leading-7 outline-none focus:border-blue-500"
            />
          ) : (
            <div className="whitespace-pre-wrap text-lg leading-8 text-gray-800">
              {chapterContent}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving..."
                    : "Save Chapter"}
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="rounded-lg border px-5 py-3 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                >
                  Edit Chapter
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-lg border px-5 py-3 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating
                    ? "Regenerating..."
                    : "Regenerate"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={handleEditMemories}
          className="rounded-lg border px-5 py-3 hover:bg-gray-50"
        >
          Edit My Memories
        </button>

        <button
          onClick={handlePhotos}
          className="rounded-lg border px-5 py-3 hover:bg-gray-50"
        >
          My Photos
        </button>
      </div>
    </div>
  )
}