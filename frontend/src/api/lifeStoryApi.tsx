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