const API_BASE_URL = "https://localhost:7197/api"

export type LifeStory = {
  id: number
  title: string
  authorName: string
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
  authorName: string
): Promise<LifeStory> {
  const response = await fetch(`${API_BASE_URL}/LifeStory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      authorName,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to create life story")
  }

  return response.json()
}