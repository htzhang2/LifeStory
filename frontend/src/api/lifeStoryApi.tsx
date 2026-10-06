const API_BASE_URL = "https://localhost:7197/api"

export type LifeStory = {
  id: number
  title: string
  authorName: string
  birthYear: number | null
  birthPlace: string
  createdAt: string
  updatedAt: string
}

export type SaveAnswerRequest = {
  questionNumber: number
  question: string
  answer: string
}

export type InterviewAnswer = {
  id: number
  lifeStoryId: number
  questionNumber: number
  question: string
  answer: string
  createdAt: string
  updatedAt: string
}

export async function saveAnswer(
  storyId: number,
  request: SaveAnswerRequest
): Promise<InterviewAnswer> {
  const response = await fetch(
    `${API_BASE_URL}/LifeStory/${storyId}/answers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to save answer")
  }

  return response.json()
}

export async function createLifeStory(
  title: string,
  authorName: string,
  birthYear: number | null,
  birthPlace: string
): Promise<LifeStory> {
  const response = await fetch(`${API_BASE_URL}/LifeStory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      authorName,
      birthYear,
      birthPlace
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to create life story")
  }

  return response.json()
}

export type Chapter = {
  id: number
  lifeStoryId: number
  chapterNumber: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export async function getChapters(
  storyId: number
): Promise<Chapter[]> {
  const response = await fetch(
    `${API_BASE_URL}/LifeStory/${storyId}/chapters`
  )

  if (!response.ok) {
    throw new Error("Failed to load chapters")
  }

  return response.json()
}

export async function generateChapter(
  storyId: number,
  chapterNumber: number
): Promise<Chapter> {
  const response = await fetch(
    `${API_BASE_URL}/LifeStory/${storyId}/chapters/${chapterNumber}/generate`,
    {
      method: "POST",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to generate chapter")
  }

  return response.json()
}

export async function updateChapter(
  storyId: number,
  chapterNumber: number,
  title: string,
  content: string
): Promise<Chapter> {
  const response = await fetch(
    `${API_BASE_URL}/lifestories/${storyId}/chapters/${chapterNumber}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
      }),
    }
  )

  if (!response.ok) {
    const message = await response.text()

    throw new Error(
      message || "Failed to update chapter"
    )
  }

  return response.json()
}

export async function getChapter(
  storyId: number,
  chapterNumber: number
): Promise<Chapter> {
  const response = await fetch(
    `${API_BASE_URL}/LifeStory/${storyId}/chapters/${chapterNumber}`
  )

  if (!response.ok) {
    throw new Error("Failed to get chapter")
  }

  return response.json()
}

export async function transcribeAudio(
  audioBlob: Blob
): Promise<string> {
  const formData = new FormData()

  const extension =
    audioBlob.type.includes("webm")
      ? "webm"
      : "audio"

  formData.append(
    "audio",
    audioBlob,
    `recording.${extension}`
  )

  const response = await fetch(
    `${API_BASE_URL}/transcription`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error("Failed to transcribe audio")
  }

  const result = await response.json()

  return result.text
}

export type StoryPhoto = {
  id: number
  lifeStoryId: number
  originalBlobName: string
  caption: string
  memory: string
  createdAt: string
  updatedAt: string
}

export async function uploadStoryPhoto(
  storyId: number,
  file: File
): Promise<StoryPhoto> {
  const formData = new FormData()

  formData.append("photo", file)

  const response = await fetch(
    `${API_BASE_URL}/lifestories/${storyId}/photos`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error("Failed to upload photo")
  }

  return response.json()
}

export async function getStoryPhotos(
  storyId: number
): Promise<StoryPhoto[]> {
  const response = await fetch(
    `${API_BASE_URL}/lifestories/${storyId}/photos`
  )

  if (!response.ok) {
    throw new Error("Failed to load photos")
  }

  return response.json()
}

export type StoryPhotoWithUrl = StoryPhoto & {
  url: string
  urlExpiresAt: string
}

export async function getStoryPhoto(
  storyId: number,
  photoId: number
): Promise<StoryPhotoWithUrl> {
  const response = await fetch(
    `${API_BASE_URL}/lifestories/${storyId}/photos/${photoId}`
  )

  if (!response.ok) {
    throw new Error("Failed to load photo")
  }

  return response.json()
}

export async function updateStoryPhoto(
  storyId: number,
  photoId: number,
  caption: string,
  memory: string
): Promise<StoryPhoto> {
  const response = await fetch(
    `${API_BASE_URL}/lifestories/${storyId}/photos/${photoId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caption,
        memory,
      }),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to update photo")
  }

  return response.json()
}

export async function deleteStoryPhoto(
  storyId: number,
  photoId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/lifestories/${storyId}/photos/${photoId}`,
    {
      method: "DELETE",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to delete photo")
  }
}

export type ChapterPhoto = {
  id: number
  displayOrder: number
  photoId: number
  lifeStoryId: number
  caption: string
  memory: string
  createdAt: string
  updatedAt: string
  url: string
  urlExpiresAt: string
}

export async function getChapterPhotos(
  storyId: number,
  chapterNumber: number
): Promise<ChapterPhoto[]> {
  const response = await fetch(
    `${API_BASE_URL}/lifestories/${storyId}/chapters/${chapterNumber}/photos`
  )

  if (!response.ok) {
    throw new Error("Failed to load chapter photos")
  }

  return response.json()
}


export async function downloadChapterPdf(
  storyId: number,
  chapterNumber: number
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/LifeStory/${storyId}/chapters/${chapterNumber}/pdf`
  )

  if (!response.ok) {
    const message = await response.text()

    throw new Error(
      message || "Failed to download chapter PDF"
    )
  }

  return response.blob()
}

export type ChapterDefinition = {
  chapterNumber: number
  title: string
  startQuestion: number
  endQuestion: number
}

export async function getChapterDefinitions(): Promise<
  ChapterDefinition[]
> {
  const response = await fetch(
    `${API_BASE_URL}/chapter-definitions`
  )

  if (!response.ok) {
    throw new Error(
      "Failed to load chapter definitions"
    )
  }

  return response.json()
}
