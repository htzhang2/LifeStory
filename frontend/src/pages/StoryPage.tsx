import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  getChapter,
  generateChapter,
  updateChapter,
  getStoryPhotos,
  getStoryPhoto,
  uploadStoryPhoto,
  updateStoryPhoto,
  deleteStoryPhoto,
  type StoryPhoto,
} from "../api/lifeStoryApi"

import { useStory } from "../context/StoryContext"

type PhotoUrlMap = Record<number, string>

export default function StoryPage() {
  const navigate = useNavigate()

  const { storyId } = useStory()

  const [chapter, setChapter] = useState("")
  const [chapterTitle, setChapterTitle] = useState(
    "My Childhood"
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [photos, setPhotos] = useState<StoryPhoto[]>([])
  const [photoUrls, setPhotoUrls] = useState<PhotoUrlMap>({})

  const [isUploadingPhoto, setIsUploadingPhoto] =
    useState(false)

  const [editingPhotoId, setEditingPhotoId] =
    useState<number | null>(null)

  const [photoCaption, setPhotoCaption] =
    useState("")

  const [photoMemory, setPhotoMemory] =
    useState("")

  const [isSavingPhoto, setIsSavingPhoto] =
    useState(false)

  /*
   * Load chapter and photos when the page opens.
   */
  useEffect(() => {
    if (storyId === null) {
      setIsLoading(false)
      return
    }

    async function loadStory() {
      try {
        setIsLoading(true)

        /*
         * Load chapter.
         */
        try {
          const result = await getChapter(
            storyId ?? 1,
            1
          )

          setChapter(result.content)
          setChapterTitle(
            result.title || "My Childhood"
          )
        } catch (error) {
          /*
           * A missing chapter is normal for a new story.
           */
          console.log(
            "No chapter exists yet."
          )
        }

        /*
         * Load photos.
         */
        try {
          const photoList =
            await getStoryPhotos(storyId ?? 1)

          setPhotos(photoList)

          /*
           * Get a temporary SAS URL for each photo.
           */
          const photoUrlEntries =
            await Promise.all(
              photoList.map(async (photo) => {
                try {
                  const photoWithUrl =
                    await getStoryPhoto(
                      storyId ?? 1,
                      photo.id
                    )

                  return [
                    photo.id,
                    photoWithUrl.url,
                  ] as const
                } catch (error) {
                  console.error(
                    `Failed to load photo ${photo.id}:`,
                    error
                  )

                  return null
                }
              })
            )

          const urls: PhotoUrlMap = {}

          for (const entry of photoUrlEntries) {
            if (entry !== null) {
              urls[entry[0]] = entry[1]
            }
          }

          setPhotoUrls(urls)
        } catch (error) {
          console.error(
            "Failed to load photos:",
            error
          )
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadStory()
  }, [storyId])

  /*
   * Generate Chapter 1.
   */
  async function handleGenerateChapter() {
    if (storyId === null) {
      return
    }

    try {
      setIsGenerating(true)

      const result = await generateChapter(
        storyId,
        1
      )

      setChapter(result.content)
      setChapterTitle(
        result.title || "My Childhood"
      )

      setIsEditing(false)
    } catch (error) {
      console.error(
        "Failed to generate chapter:",
        error
      )

      alert(
        "Unable to generate your chapter."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  /*
   * Save edited chapter.
   */
  async function handleSaveChapter() {
    if (storyId === null) {
      return
    }

    try {
      setIsSaving(true)

      const result = await updateChapter(
        storyId,
        1,
        chapterTitle,
        chapter
      )

      setChapter(result.content)
      setChapterTitle(
        result.title || "My Childhood"
      )

      setIsEditing(false)
    } catch (error) {
      console.error(
        "Failed to save chapter:",
        error
      )

      alert(
        "Unable to save your chapter."
      )
    } finally {
      setIsSaving(false)
    }
  }

  /*
   * Start editing a photo.
   */
  function handleEditPhoto(photo: StoryPhoto) {
    setEditingPhotoId(photo.id)
    setPhotoCaption(photo.caption)
    setPhotoMemory(photo.memory)
  }

  /*
   * Cancel photo editing.
   */
  function handleCancelPhotoEdit() {
    setEditingPhotoId(null)
    setPhotoCaption("")
    setPhotoMemory("")
  }

  /*
   * Upload a photo.
   */
  async function handlePhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file || storyId === null) {
      return
    }

    /*
     * Basic client-side validation.
     */
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please select a JPEG, PNG, or WebP image."
      )

      event.target.value = ""
      return
    }

    const maxFileSize =
      20 * 1024 * 1024

    if (file.size > maxFileSize) {
      alert(
        "Please select an image smaller than 20 MB."
      )

      event.target.value = ""
      return
    }

    try {
      setIsUploadingPhoto(true)

      /*
       * Upload original photo.
       */
      const uploaded =
        await uploadStoryPhoto(
          storyId,
          file
        )

      setPhotos((current) => [
        ...current,
        uploaded,
      ])

      /*
       * Get secure temporary URL.
       */
      const photoWithUrl =
        await getStoryPhoto(
          storyId,
          uploaded.id
        )

      setPhotoUrls((current) => ({
        ...current,
        [uploaded.id]:
          photoWithUrl.url,
      }))
    } catch (error) {
      console.error(
        "Failed to upload photo:",
        error
      )

      alert(
        "Unable to upload your photo."
      )
    } finally {
      setIsUploadingPhoto(false)

      /*
       * Allow selecting the same file again.
       */
      event.target.value = ""
    }
  }

  /*
   * Save photo caption and memory.
   */
  async function handleSavePhoto(
    photoId: number
  ) {
    if (storyId === null) {
      return
    }

    try {
      setIsSavingPhoto(true)

      const updated =
        await updateStoryPhoto(
          storyId,
          photoId,
          photoCaption,
          photoMemory
        )

      setPhotos((current) =>
        current.map((photo) =>
          photo.id === photoId
            ? updated
            : photo
        )
      )

      handleCancelPhotoEdit()
    } catch (error) {
      console.error(
        "Failed to save photo:",
        error
      )

      alert(
        "Unable to save photo information."
      )
    } finally {
      setIsSavingPhoto(false)
    }
  }

  /*
   * Delete photo.
   */
  async function handleDeletePhoto(
    photoId: number
  ) {
    if (storyId === null) {
      return
    }

    const confirmed =
      window.confirm(
        "Delete this photo from your story?"
      )

    if (!confirmed) {
      return
    }

    try {
      await deleteStoryPhoto(
        storyId,
        photoId
      )

      setPhotos((current) =>
        current.filter(
          (photo) =>
            photo.id !== photoId
        )
      )

      setPhotoUrls((current) => {
        const next = { ...current }

        delete next[photoId]

        return next
      })

      if (editingPhotoId === photoId) {
        handleCancelPhotoEdit()
      }
    } catch (error) {
      console.error(
        "Failed to delete photo:",
        error
      )

      alert(
        "Unable to delete photo."
      )
    }
  }

  /*
   * No story ID means the user reached this page
   * without creating a story.
   */
  if (storyId === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              No Story Found
            </h1>

            <p className="mt-3 text-gray-600">
              Please start your life story first.
            </p>

            <button
              onClick={() =>
                navigate("/")
              }
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Start My Story
            </button>
          </div>
        </div>
      </div>
    )
  }

  /*
   * Loading state.
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-gray-600">
              Loading your story...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-12">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            My Life Story
          </h1>

          <p className="mt-3 text-lg text-gray-600">
            Your memories, shaped into your story.
          </p>
        </div>

        {/* Chapter */}
        <section className="mt-10 rounded-2xl bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {chapterTitle}
              </h2>

              <p className="mt-1 text-gray-500">
                Chapter 1
              </p>
            </div>

            <div className="flex gap-3">
              {chapter && !isEditing && (
                <button
                  onClick={() =>
                    setIsEditing(true)
                  }
                  className="rounded-xl bg-gray-100 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Edit
                </button>
              )}

              <button
                onClick={
                  handleGenerateChapter
                }
                disabled={isGenerating}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating
                  ? "Writing..."
                  : chapter
                    ? "Regenerate"
                    : "Create My Chapter"}
              </button>
            </div>
          </div>

          {/* Chapter content */}
          {isEditing ? (
            <div className="mt-8">

              <label className="block text-sm font-semibold text-gray-700">
                Chapter Title
              </label>

              <input
                value={chapterTitle}
                onChange={(event) =>
                  setChapterTitle(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
              />

              <label className="mt-6 block text-sm font-semibold text-gray-700">
                Chapter
              </label>

              <textarea
                value={chapter}
                onChange={(event) =>
                  setChapter(
                    event.target.value
                  )
                }
                rows={20}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-4 leading-7 text-gray-800 focus:border-blue-500 focus:outline-none"
              />

              <div className="mt-5 flex gap-3">
                <button
                  onClick={
                    handleSaveChapter
                  }
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
                  className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : chapter ? (
            <div className="mt-8 whitespace-pre-wrap leading-8 text-gray-800">
              {chapter}
            </div>
          ) : (
            <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center">
              <p className="text-gray-600">
                Your chapter has not been created yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                We will use the memories you shared
                during the interview to create it.
              </p>
            </div>
          )}
        </section>

        {/* Photos */}
        <section className="mt-10 rounded-2xl bg-white p-8 shadow-sm">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Photos
            </h2>

            <p className="mt-2 text-gray-600">
              Add old family photos and write down
              what you remember about them.
            </p>
          </div>

          {/* Upload */}
          <div className="mt-6">
            <label
              htmlFor="photo-upload"
              className={`inline-block rounded-xl px-6 py-4 text-lg font-semibold ${
                isUploadingPhoto
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              {isUploadingPhoto
                ? "Uploading..."
                : "📷 Add Photo"}
            </label>

            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={
                handlePhotoSelected
              }
              disabled={
                isUploadingPhoto
              }
            />
          </div>

          {/* Photo list */}
          {photos.length > 0 && (
            <div className="mt-10 space-y-10">

              {photos.map((photo) => {
                const imageUrl =
                  photoUrls[photo.id]

                const isEditingPhoto =
                  editingPhotoId ===
                  photo.id

                return (
                  <div
                    key={photo.id}
                    className="rounded-2xl border border-gray-200 p-6"
                  >

                    {/* Image */}
                    {imageUrl ? (
                      <div className="overflow-hidden rounded-xl bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={
                            photo.caption ||
                            "Life story photo"
                          }
                          className="mx-auto max-h-[600px] w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100">
                        <p className="text-gray-500">
                          Loading photo...
                        </p>
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditingPhoto ? (
                      <div className="mt-6">

                        <label className="block text-sm font-semibold text-gray-700">
                          Caption
                        </label>

                        <input
                          value={
                            photoCaption
                          }
                          onChange={(event) =>
                            setPhotoCaption(
                              event.target.value
                            )
                          }
                          placeholder="Who or what is in this photo?"
                          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                        />

                        <label className="mt-5 block text-sm font-semibold text-gray-700">
                          What do you remember?
                        </label>

                        <textarea
                          value={
                            photoMemory
                          }
                          onChange={(event) =>
                            setPhotoMemory(
                              event.target.value
                            )
                          }
                          rows={6}
                          placeholder="Write anything you remember about this photo..."
                          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 leading-7 focus:border-blue-500 focus:outline-none"
                        />

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              handleSavePhoto(
                                photo.id
                              )
                            }
                            disabled={
                              isSavingPhoto
                            }
                            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSavingPhoto
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            onClick={
                              handleCancelPhotoEdit
                            }
                            disabled={
                              isSavingPhoto
                            }
                            className="rounded-xl bg-gray-100 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Photo information */
                      <div className="mt-5">

                        {photo.caption && (
                          <h3 className="text-xl font-semibold text-gray-900">
                            {photo.caption}
                          </h3>
                        )}

                        {photo.memory && (
                          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
                            {photo.memory}
                          </p>
                        )}

                        {!photo.caption &&
                          !photo.memory && (
                            <p className="text-gray-500">
                              Add a caption or
                              memory for this
                              photo.
                            </p>
                          )}

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              handleEditPhoto(
                                photo
                              )
                            }
                            className="rounded-xl bg-gray-100 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            Edit Photo
                          </button>

                          <button
                            onClick={() =>
                              handleDeletePhoto(
                                photo.id
                              )
                            }
                            className="rounded-xl bg-red-50 px-5 py-3 font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {photos.length === 0 && (
            <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center">
              <div className="text-4xl">
                📷
              </div>

              <p className="mt-3 font-medium text-gray-700">
                No photos yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add an old family photo to preserve
                the memories connected to it.
              </p>
            </div>
          )}
        </section>

        {/* Bottom actions */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 pb-12">

          <button
            onClick={() =>
              navigate("/question/1")
            }
            className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200"
          >
            Edit My Memories
          </button>

        </div>
      </div>
    </div>
  )
}