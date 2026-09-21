import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createLifeStory } from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

function BasicInfoPage() {
  const navigate = useNavigate()
  const { setStoryId } = useStory()

  const [authorName, setAuthorName] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [birthPlace, setBirthPlace] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  async function handleContinue() {
    const name = authorName.trim()
    const place = birthPlace.trim()

    if (!name || !birthYear || !place) {
      alert("Please complete all fields.")
      return
    }

    const year = Number(birthYear)

    if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
      alert("Please enter a valid birth year.")
      return
    }

    try {
      setIsCreating(true)

      const story = await createLifeStory(
        "My Life Story",
        name,
        year,
        place
      )

      setStoryId(story.id)

      console.log("Created life story:", story)

      navigate("/question/1")
    } catch (error) {
      console.error("Failed to create life story:", error)
      alert("Unable to create your story. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            📖
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
            About You
          </h1>

          <p className="mt-4 text-lg leading-7 text-gray-600">
            Let's start with a few basic details about your life.
          </p>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">

          <div>
            <label
              htmlFor="authorName"
              className="block text-lg font-semibold text-gray-900"
            >
              What is your name?
            </label>

            <input
              id="authorName"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div className="mt-8">
            <label
              htmlFor="birthYear"
              className="block text-lg font-semibold text-gray-900"
            >
              What year were you born?
            </label>

            <input
              id="birthYear"
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="For example, 1971"
            />
          </div>

          <div className="mt-8">
            <label
              htmlFor="birthPlace"
              className="block text-lg font-semibold text-gray-900"
            >
              Where were you born?
            </label>

            <input
              id="birthPlace"
              type="text"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="For example, Qingdao, China"
            />
          </div>

          <button
            className="mt-10 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={handleContinue}
            disabled={isCreating}
          >
            {isCreating ? "Creating Your Story..." : "Continue"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          You can change these details later.
        </p>

      </div>
    </div>
  )
}

export default BasicInfoPage