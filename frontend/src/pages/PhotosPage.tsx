import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  getStoryPhotos,
  getStoryPhoto,
  updateStoryPhoto,
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

  useEffect(() => {
    if (storyId === null) {
      setIsLoading(false)
      return
    }

    const currentStoryId = storyId

    async function loadPhotos() {
      try {
        setError("")

        const photoList =
          await getStoryPhotos(currentStoryId)

        const photosWithUrls: PhotoWithUrl[] = []

        for (const photo of photoList) {
          const photoWithUrl =
            await getStoryPhoto(
              currentStoryId,
              photo.id
            )

          photosWithUrls.push(photoWithUrl)
        }

        setPhotos(photosWithUrls)
      } catch (err) {
        console.error("Failed to load photos:", err)

        setError("Failed to load photos.")
      } finally {
        setIsLoading(false)
      }
    }

    loadPhotos()
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

  async function handleSave(photoId: number) {
    if (storyId === null) {
      setError("No life story was found.")
      return
    }

    try {
      setError("")
      setIsSaving(true)

      const updatedPhoto =
        await updateStoryPhoto(
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
      console.error(err)

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            My Photos
          </h1>

          <p className="mt-2 text-gray-600">
            Add photos and preserve the memories behind them.
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
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <p className="text-gray-600">
          Loading photos...
        </p>
      )}

      {!isLoading &&
        !error &&
        photos.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <h2 className="text-xl font-semibold">
              No photos yet
            </h2>

            <p className="mt-2 text-gray-600">
              Add an old family photo or another picture
              that tells part of your life story.
            </p>

            <button
              onClick={() =>
                navigate("/photos/upload")
              }
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              Add Your First Photo
            </button>
          </div>
        )}

      {!isLoading &&
        !error &&
        photos.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => {
              const isEditing =
                editingPhotoId === photo.id

              return (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border bg-white shadow-sm"
                >
                  <div className="bg-gray-50">
                    <img
                      src={photo.url}
                      alt={
                        photo.caption ||
                        "Life story photo"
                      }
                      className="h-64 w-full object-cover"
                    />
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
                              setEditCaption(
                                e.target.value
                              )
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
                              setEditMemory(
                                e.target.value
                              )
                            }
                            disabled={isSaving}
                            rows={6}
                            placeholder="What do you remember about this photo?"
                            className="mt-2 w-full rounded-lg border px-3 py-2 leading-6 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="mt-5 flex gap-3">
                          <button
                            onClick={() =>
                              handleSave(photo.id)
                            }
                            disabled={isSaving}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSaving
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            onClick={
                              handleCancelEdit
                            }
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

                        <div className="mt-5">
                          <button
                            onClick={() =>
                              handleEdit(photo)
                            }
                            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            Edit
                          </button>
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
