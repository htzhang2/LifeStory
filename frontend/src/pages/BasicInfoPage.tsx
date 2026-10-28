import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  createLifeStory,
  getLifeStory,
  updateLifeStoryDetails,
  type ContentLanguage,
} from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

function BasicInfoPage() {
  const navigate = useNavigate()
  const { storyId: storyIdParam } = useParams()
  const { setStoryId } = useStory()

  const isEditMode = storyIdParam !== undefined
  const storyId = Number(storyIdParam)
  const isValidStoryId =
    isEditMode &&
    storyIdParam?.trim() !== "" &&
    Number.isInteger(storyId) &&
    storyId > 0

  const [title, setTitle] = useState("My Life Story")
  const [authorName, setAuthorName] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [birthPlace, setBirthPlace] = useState("")
  const [dedication, setDedication] = useState("")
  const [contentLanguage, setContentLanguage] =
    useState<ContentLanguage>("en")

  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isEditMode) {
      setIsLoading(false)
      return
    }

    if (!isValidStoryId) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadStory() {
      try {
        setIsLoading(true)

        const story = await getLifeStory(storyId)

        if (cancelled) return

        setTitle(story.title ?? "")
        setAuthorName(story.authorName ?? "")
        setBirthYear(
          story.birthYear == null ? "" : String(story.birthYear)
        )
        setBirthPlace(story.birthPlace ?? "")
        setDedication(story.dedication ?? "")
        setContentLanguage(story.contentLanguage)

        setStoryId(story.id)
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load story:", error)
          alert("Unable to load story details. Please try again.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadStory()

    return () => {
      cancelled = true
    }
  }, [isEditMode, isValidStoryId, storyId, setStoryId])

  async function handleContinue() {
    const name = authorName.trim()
    const place = birthPlace.trim()
    const storyTitle = title.trim()
    const yearText = birthYear.trim()

    if (!storyTitle || !name || !place) {
      alert("Please complete the title, name, and birth place fields.")
      return
    }

    let year: number | null = null

    if (yearText) {
      year = Number(yearText)

      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > new Date().getFullYear()
      ) {
        alert("Please enter a valid birth year.")
        return
      }
    } else if (!isEditMode) {
      alert("Please enter your birth year.")
      return
    }

    if (isEditMode && !isValidStoryId) {
      alert("The story ID in the URL is invalid.")
      return
    }

    try {
      setIsSaving(true)

      if (isEditMode) {
        const updatedStory = await updateLifeStoryDetails(storyId, {
          title: storyTitle,
          authorName: name,
          birthYear: year,
          birthPlace: place,
          dedication: dedication.trim() || null,
          contentLanguage,
        })

        setStoryId(updatedStory.id)

        alert("Story details updated successfully.")

        // Return to the page the user came from.
        navigate(-1)
      } else {
        const story = await createLifeStory(
          storyTitle,
          name,
          year,
          place,
          contentLanguage,
          dedication.trim() || null
        )

        setStoryId(story.id)
        navigate("/question/1")
      }
    } catch (error) {
      console.error(
        isEditMode
          ? "Failed to update story details:"
          : "Failed to create life story:",
        error
      )

      alert(
        isEditMode
          ? "Unable to update your story. Please try again."
          : "Unable to create your story. Please try again."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditMode && !isValidStoryId) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Invalid Story ID
          </h1>
          <p className="mt-3 text-gray-600">
            The story ID in the URL is invalid.
          </p>
          <button
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-lg text-gray-600">
          Loading story details...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            📖
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
            {isEditMode ? "Edit Story Details" : "About You"}
          </h1>

          <p className="mt-4 text-lg leading-7 text-gray-600">
            {isEditMode
              ? "Update the basic information about your life story."
              : "Let's start with a few basic details about your life."}
          </p>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div>
            <label
              htmlFor="title"
              className="block text-lg font-semibold text-gray-900"
            >
              Story title
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Life Story"
            />
          </div>

          <div className="mt-8">
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
              required
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
              min={1900}
              max={new Date().getFullYear()}
              required={!isEditMode}
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="For example, 1971"
            />

            {isEditMode && (
              <p className="mt-2 text-sm text-gray-500">
                Leave blank if you prefer not to include your birth year.
              </p>
            )}
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
              required
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="For example, Qingdao, China"
            />
          </div>

          <div className="mt-8">
            <label
              htmlFor="dedication"
              className="block text-lg font-semibold text-gray-900"
            >
              Who would you like to dedicate your life story to?
            </label>

            <textarea
              id="dedication"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="For example: To my wife and children, with love. May these memories always keep us connected."
            />

            <p className="mt-2 text-sm text-gray-500">
              Optional. You can dedicate your story to family, friends, or future generations.
            </p>
          </div>

          <div className="mt-8">
            <label
              htmlFor="contentLanguage"
              className="block text-lg font-semibold text-gray-900"
            >
              What language would you like your story written in?
            </label>

            <select
              id="contentLanguage"
              value={contentLanguage}
              onChange={(e) =>
                setContentLanguage(e.target.value as ContentLanguage)
              }
              className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="zh-CN">简体中文 (Simplified Chinese)</option>
            </select>

            <p className="mt-2 text-sm text-gray-500">
              This setting controls the language of your interview questions,
              generated chapters, and PDFs.
            </p>
          </div>

          <button
            className="mt-10 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleContinue}
            disabled={isLoading || isSaving}
          >
            {isSaving
              ? isEditMode
                ? "Saving Changes..."
                : "Creating Your Story..."
              : isEditMode
                ? "Save Changes"
                : "Continue"}
          </button>

          {isEditMode && (
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() => navigate(-1)}
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          You can change these details later.
        </p>
      </div>
    </div>
  )
}

export default BasicInfoPage
