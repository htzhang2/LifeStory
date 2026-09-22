import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { generateChapter } from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

function StoryPage() {
  const navigate = useNavigate()
  const { storyId } = useStory()

  const [chapter, setChapter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    if (storyId === null) {
      alert("No life story found.")
      return
    }

    try {
      setIsGenerating(true)

      const result = await generateChapter(storyId, 1)

      setChapter(result.content)
    } catch (error) {
      console.error("Failed to generate chapter:", error)
      alert("Unable to generate your chapter.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            📖
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
            Your Story
          </h1>

          <p className="mt-4 text-lg leading-7 text-gray-600">
            Your memories are ready to become a chapter.
          </p>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">

          {!chapter && !isGenerating && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                My Childhood
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                We'll use your answers to create a first-person
                autobiography chapter while preserving your memories
                and voice.
              </p>

              <button
                onClick={handleGenerate}
                className="mt-8 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create My Chapter
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="py-12 text-center">
              <div className="text-4xl">✍️</div>

              <h2 className="mt-6 text-2xl font-semibold text-gray-900">
                Writing Your Chapter...
              </h2>

              <p className="mt-3 text-lg text-gray-600">
                We're bringing your memories together.
              </p>
            </div>
          )}

          {chapter && !isGenerating && (
            <div>
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  My Childhood
                </h2>
              </div>

              <div className="mt-8 whitespace-pre-wrap text-lg leading-9 text-gray-800">
                {chapter}
              </div>

              <div className="mt-10 flex gap-4 border-t border-gray-200 pt-6">
                <button
                  onClick={handleGenerate}
                  className="rounded-xl border border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Regenerate
                </button>

                <button
                  onClick={() => navigate("/question/1")}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
                >
                  Edit My Memories
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default StoryPage