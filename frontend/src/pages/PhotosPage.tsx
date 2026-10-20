import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  getStoryPhotos,
  getStoryPhoto,
  updateStoryPhoto,
  setCoverPhoto,
  getLifeStory,
  type StoryPhoto,
} from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

type PhotoWithUrl = StoryPhoto & {
  url: string
  urlExpiresAt: string
}

export default function PhotosPage() {
  const { storyId } = useStory()
  const navigate = useNavigate()

  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [editingPhotoId, setEditingPhotoId] =
    useState<number | null>(null)

  const [editCaption, setEditCaption] = useState("")
  const [editMemory, setEditMemory] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [coverPhotoId, setCoverPhotoId] =
    useState<number | null>(null)
  const [isSavingCover, setIsSavingCover] = useState(false)

  useEffect(() => {
    if (storyId === null) {
      setPhotos([])
      setCoverPhotoId(null)
      setIsLoading(false)
      return
    }

    const currentStoryId = storyId
    let cancelled = false

    async function loadPhotos() {
      setIsLoading(true)

      try {
        setError("")

        const [story, photoList] = await Promise.all([
          getLifeStory(currentStoryId),
          getStoryPhotos(currentStoryId),
        ])

        const photosWithUrls: PhotoWithUrl[] =
          await Promise.all(
            photoList.map((photo) =>
              getStoryPhoto(currentStoryId, photo.id)
            )
          )

        if (cancelled) return

        setCoverPhotoId(story.coverPhotoId ?? null)
        setPhotos(photosWithUrls)
      } catch (err) {
        if (cancelled) return

        console.error("Failed to load photos:", err)
        setError("Failed to load photos.")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadPhotos()

    return () => {
      cancelled = true
    }
  }, [storyId])

  function handleEdit(photo: PhotoWithUrl) {
    setEditingPhotoId(photo.id)
    setEditCaption(photo.caption)
    setEditMemory(photo.memory)
    setError("")
  }

  function handleCancelEdit() {
    setEditingPhotoId(null)
    setEditCaption("")
    setEditMemory("")
  }

  async function handleSetCoverPhoto(
    photoId: number | null
  ) {
    if (storyId === null) {
      setError("No life story was found.")
      return
    }

    try {
      setError("")
      setIsSavingCover(true)

      await setCoverPhoto(storyId, photoId)

      setCoverPhotoId(photoId)
    } catch (err) {
      console.error("Failed to update cover photo:", err)

      setError(
        "Failed to update the cover photo. Please try again."
      )
    } finally {
      setIsSavingCover(false)
    }
  }

  async function handleSave(photoId: number) {
    if (storyId === null) {
      setError("No life story was found.")
      return
    }

    try {
      setError("")
      setIsSaving(true)

      const updatedPhoto = await updateStoryPhoto(
        storyId,
        photoId,
        editCaption,
        editMemory
      )

      setPhotos((previous) =>
        previous.map((photo) =>
          photo.id === photoId
            ? {
                ...photo,
                caption: updatedPhoto.caption,
                memory: updatedPhoto.memory,
                updatedAt: updatedPhoto.updatedAt,
              }
            : photo
        )
      )

      setEditingPhotoId(null)
      setEditCaption("")
      setEditMemory("")
    } catch (err) {
      console.error("Failed to save photo:", err)

      setError(
        "Failed to save the photo information. Please try again."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (storyId === null) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-bold">
          No Life Story Found
        </h1>

        <p className="mt-3 text-gray-600">
          Please start a life story before adding photos.
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
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Photos</h1>

          <p className="mt-2 text-gray-600">
            Add photos, preserve your memories, and choose
            the cover photo for your autobiography.
          </p>
        </div>

        <button
          onClick={() => navigate("/photos/upload")}
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          + Add Photo
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {coverPhotoId !== null && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-green-800">
            Your book cover is set to the selected photo.
          </p>

          <button
            onClick={() => handleSetCoverPhoto(null)}
            disabled={isSavingCover}
            className="self-start rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            {isSavingCover ? "Updating..." : "Clear Cover"}
          </button>
        </div>
      )}

      {isLoading && (
        <p className="text-gray-600">Loading photos...</p>
      )}

      {!isLoading && photos.length === 0 && !error && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h2 className="text-xl font-semibold">No photos yet</h2>

          <p className="mt-2 text-gray-600">
            Add an old family photo or another picture that
            tells part of your life story.
          </p>

          <button
            onClick={() => navigate("/photos/upload")}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Add Your First Photo
          </button>
        </div>
      )}

      {!isLoading && photos.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => {
            const isEditing = editingPhotoId === photo.id
            const isCover = coverPhotoId === photo.id

            return (
              <div
                key={photo.id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                  isCover
                    ? "border-green-500 ring-1 ring-green-500"
                    : "border-gray-200"
                }`}
              >
                <div className="relative bg-gray-50">
                  <img
                    src={photo.url}
                    alt={photo.caption || "Life story photo"}
                    className="h-64 w-full object-cover"
                  />

                  {isCover && (
                    <span className="absolute left-3 top-3 rounded-full bg-green-700 px-3 py-1 text-sm font-semibold text-white shadow">
                      Book Cover
                    </span>
                  )}
                </div>

                <div className="p-5">
                  {isEditing ? (
                    <>
                      <div>
                        <label
                          htmlFor={`caption-${photo.id}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Caption
                        </label>

                        <input
                          id={`caption-${photo.id}`}
                          type="text"
                          value={editCaption}
                          onChange={(e) =>
                            setEditCaption(e.target.value)
                          }
                          disabled={isSaving}
                          placeholder="Describe this photo"
                          className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="mt-5">
                        <label
                          htmlFor={`memory-${photo.id}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Memory
                        </label>

                        <textarea
                          id={`memory-${photo.id}`}
                          value={editMemory}
                          onChange={(e) =>
                            setEditMemory(e.target.value)
                          }
                          disabled={isSaving}
                          rows={6}
                          placeholder="What do you remember about this photo?"
                          className="mt-2 w-full rounded-lg border px-3 py-2 leading-6 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleSave(photo.id)}
                          disabled={isSaving}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {photo.caption ? (
                        <p className="font-medium text-gray-900">
                          {photo.caption}
                        </p>
                      ) : (
                        <p className="italic text-gray-400">
                          No caption yet
                        </p>
                      )}

                      {photo.memory ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                          {photo.memory}
                        </p>
                      ) : (
                        <p className="mt-3 italic text-sm text-gray-400">
                          No memory added yet
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleEdit(photo)}
                          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        {isCover ? (
                          <button
                            onClick={() =>
                              handleSetCoverPhoto(null)
                            }
                            disabled={isSavingCover}
                            className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSavingCover
                              ? "Updating..."
                              : "Remove as Cover"}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleSetCoverPhoto(photo.id)
                            }
                            disabled={isSavingCover}
                            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSavingCover
                              ? "Updating..."
                              : "Set as Cover"}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => navigate("/story")}
          className="rounded-lg border px-5 py-3 hover:bg-gray-50"
        >
          ← Back to Story
        </button>
      </div>
    </div>
  )
}
