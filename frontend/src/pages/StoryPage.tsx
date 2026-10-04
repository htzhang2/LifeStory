import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  generateChapter,
  getChapter,
  getChapterPhotos,
  updateChapter,
  downloadChapterPdf,
  type ChapterPhoto,
} from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

export default function StoryPage() {
  const { storyId } = useStory()
  const navigate = useNavigate()

  const [chapterTitle, setChapterTitle] = useState("")
  const [chapterContent, setChapterContent] = useState("")
  const [chapterPhotos, setChapterPhotos] =
    useState<ChapterPhoto[]>([])

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

    const currentStoryId = storyId

    async function loadStory() {
      try {
        setError("")

        const result = await getChapter(
          currentStoryId,
          1
        )

        setChapterTitle(result.title)
        setChapterContent(result.content)
        setHasChapter(true)

        const photos = await getChapterPhotos(
          currentStoryId,
          1
        )

        setChapterPhotos(photos)
      } catch {
        // The chapter may not exist yet.
        setHasChapter(false)
        setChapterPhotos([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStory()
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

      // The backend automatically selects the photos
      // that belong to this chapter.
      const photos = await getChapterPhotos(
        storyId,
        1
      )

      setChapterPhotos(photos)
    } catch (err) {
      console.error(err)

      setError(
        "Failed to generate the chapter. Please try again."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownloadPdf() {
    if (storyId === null) {
      return
    }

    try {
      setError("")

      const blob = await downloadChapterPdf(
        storyId,
        1
      )

      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "My-Life-Story-Chapter-1.pdf"

      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)

      setError(
        "Failed to download the chapter PDF. Please try again."
      )
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          My Life Story
        </h1>

        <p className="mt-2 text-gray-600">
          Your memories are becoming a story.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!hasChapter && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Prepare Your First Chapter
            </h2>

            <p className="mt-2 text-gray-600">
              Review your memories and add any photos you
              would like LifeStory to consider when creating
              your chapter.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">
                Your Memories
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                Review or edit the memories you provided
                during the interview.
              </p>

              <button
                onClick={handleEditMemories}
                className="mt-5 rounded-lg border px-5 py-3 hover:bg-gray-50"
              >
                Edit My Memories
              </button>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">
                Your Photos
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                Add photos and describe the memories behind
                them. LifeStory will automatically select
                photos that are relevant to this chapter.
              </p>

              <button
                onClick={handlePhotos}
                className="mt-5 rounded-lg border px-5 py-3 hover:bg-gray-50"
              >
                Add / Manage Photos
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-xl border bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-semibold">
              Ready to create your chapter?
            </h3>

            <p className="mt-2 text-gray-600">
              LifeStory will turn your memories into a
              continuous first-person story and automatically
              choose relevant photos.
            </p>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-6 rounded-lg bg-blue-600 px-7 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating
                ? "Creating Chapter..."
                : "Create My Chapter"}
            </button>
          </div>
        </>
      )}

      {hasChapter && (
        <div className="rounded-xl border bg-white p-8 shadow-sm">
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

          {!isEditing && chapterPhotos.length > 0 && (
            <div className="mt-12 border-t pt-10">
              <h3 className="mb-6 text-2xl font-semibold">
                Photos
              </h3>

              <div className="space-y-10">
                {chapterPhotos.map((photo) => (
                  <div key={photo.id}>
                    <div className="overflow-hidden rounded-xl bg-gray-50">
                      <img
                        src={photo.url}
                        alt={
                          photo.caption ||
                          "Life story photo"
                        }
                        className="max-h-[600px] w-full object-contain"
                      />
                    </div>

                    {photo.caption && (
                      <p className="mt-4 text-lg font-medium text-gray-900">
                        {photo.caption}
                      </p>
                    )}

                    {photo.memory && (
                      <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-gray-600">
                        {photo.memory}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  onClick={() =>
                    setIsEditing(false)
                  }
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

                <button
                  onClick={handleDownloadPdf}
                  className="rounded-lg border px-5 py-3 hover:bg-gray-50"
                >
                  Download PDF
                </button>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="mt-8 border-t pt-8">
              <button
                onClick={handlePhotos}
                className="rounded-lg border px-5 py-3 hover:bg-gray-50"
              >
                Manage My Photos
              </button>
            </div>
          )}
        </div>
      )}

      {hasChapter && (
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
      )}
    </div>
  )
}
