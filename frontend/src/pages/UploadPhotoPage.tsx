import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { uploadStoryPhoto } from "../api/lifeStoryApi"
import { useStory } from "../context/StoryContext"

export default function UploadPhotoPage() {
  const { storyId } = useStory()
  const navigate = useNavigate()

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setError("")

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        "Only JPEG, PNG, GIF and WebP images are supported."
      )

      setFile(null)
      setPreviewUrl("")
      return
    }

    // Validate file size
    const maxFileSize = 20 * 1024 * 1024

    if (selectedFile.size > maxFileSize) {
      setError("Photo must be 20 MB or smaller.")

      setFile(null)
      setPreviewUrl("")
      return
    }

    setFile(selectedFile)

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
  }

  async function handleUpload() {
    if (storyId === null) {
      setError("No life story was found.")
      return
    }

    if (!file) {
      setError("Please select a photo first.")
      return
    }

    try {
      setError("")
      setIsUploading(true)

      await uploadStoryPhoto(
        storyId,
        file
      )

      navigate("/photos")
    } catch (err) {
      console.error(err)

      setError(
        "Failed to upload the photo. Please try again."
      )
    } finally {
      setIsUploading(false)
    }
  }

  function handleCancel() {
    navigate("/photos")
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
    <div className="mx-auto max-w-3xl p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Add a Photo
        </h1>

        <p className="mt-2 text-gray-600">
          Add a photo that is part of your life story.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* File selection */}
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <label
          htmlFor="photo"
          className="block text-lg font-medium"
        >
          Choose a photo
        </label>

        <p className="mt-2 text-sm text-gray-500">
          JPEG, PNG, or WebP. Maximum size: 20 MB.
        </p>

        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="mt-5 block w-full cursor-pointer rounded-lg border p-3"
        />

        {/* Preview */}
        {previewUrl && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-medium">
              Preview
            </h2>

            <div className="overflow-hidden rounded-xl border bg-gray-50">
              <img
                src={previewUrl}
                alt="Selected photo preview"
                className="max-h-[500px] w-full object-contain"
              />
            </div>

            {file && (
              <p className="mt-3 text-sm text-gray-500">
                {file.name}
              </p>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading
              ? "Uploading..."
              : "Upload Photo"}
          </button>

          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="rounded-lg border px-6 py-3 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
