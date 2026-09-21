import { createContext, useContext, useState } from "react"

type StoryContextType = {
  storyId: number | null
  setStoryId: (id: number) => void
  answers: Record<number, string>
  setAnswer: (questionNumber: number, answer: string) => void
}

const StoryContext = createContext<StoryContextType | undefined>(undefined)

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [storyId, setStoryId] = useState<number | null>(null)

  function setAnswer(questionNumber: number, answer: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionNumber]: answer,
    }))
  }

  return (
    <StoryContext.Provider value={{
      storyId,
      setStoryId,
      answers,
      setAnswer
      }}>
      {children}
    </StoryContext.Provider>
  )
}

export function useStory() {
  const context = useContext(StoryContext)

  if (!context) {
    throw new Error("useStory must be used inside StoryProvider")
  }

  return context
}