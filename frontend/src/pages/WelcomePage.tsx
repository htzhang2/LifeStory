import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  getLifeStories,
  getStoryAnswers,
  type LifeStory,
} from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

function WelcomePage() {
  const navigate = useNavigate()

  const {
    setStoryId,
    loadAnswers,
    setContentLanguage,
  } = useStory()

  const [stories, setStories] = useState<LifeStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openingStoryId, setOpeningStoryId] =
    useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadStories() {
      try {
        const result = await getLifeStories()
        setStories(result)
      } catch (err) {
        console.error(err)
        setError("Could not load existing life stories.")
      } finally {
        setIsLoading(false)
      }
    }

    loadStories()
  }, [])

  async function handleContinue(story: LifeStory) {
    try {
      setError("")
      setOpeningStoryId(story.id)

      const savedAnswers = await getStoryAnswers(story.id)

      setStoryId(story.id)
      setContentLanguage(story.contentLanguage)
      loadAnswers(savedAnswers)

      navigate("/story")
    } catch (err) {
      console.error(err)
      setError(
        "Could not open this story. Please try again."
      )
    } finally {
      setOpeningStoryId(null)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
          📖
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          My Life Story
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-600">
          Preserve your memories, experiences, and stories
          for yourself and the people you love.
        </p>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            Your story belongs to you.
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            We will gently guide you through your life story,
            one question at a time. You can write as much or
            as little as you like.
          </p>

          <button
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => navigate("/basic-info")}
          >
            Start My Story
          </button>
        </div>

        <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-8 text-left shadow-sm ring-1 ring-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            Continue an Existing Story
          </h2>

          <p className="mt-2 text-gray-600">
            Open a saved story to continue working on it.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <p className="mt-6 text-gray-500">
              Loading your stories...
            </p>
          ) : stories.length === 0 ? (
            !error && (
              <p className="mt-6 text-gray-500">
                You don't have any saved stories yet.
              </p>
            )
          ) : (
            <div className="mt-6 space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <h3 className="font-semibold text-gray-900">
                    {story.title || "Untitled Life Story"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    Author: {story.authorName}
                  </p>

                  {story.birthPlace && (
                    <p className="mt-1 text-sm text-gray-500">
                      Born in {story.birthPlace}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-gray-400">
                    Last updated:{" "}
                    {new Date(story.updatedAt).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => handleContinue(story)}
                    disabled={openingStoryId !== null}
                    className="mt-4 w-full rounded-lg border border-blue-600 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {openingStoryId === story.id
                      ? "Opening..."
                      : "Continue Story"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Take your time. Your saved story will be here when
          you return.
        </p>
      </div>
    </div>
  )
}

export default WelcomePage