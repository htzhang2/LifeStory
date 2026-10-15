import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react"
import type { ReactNode } from "react"
import type {
  ContentLanguage,
  InterviewAnswer,
} from "../api/lifeStoryApi"

type StoryContextType = {
  storyId: number | null
  setStoryId: (id: number) => void
  answers: Record<number, string>
  setAnswer: (questionNumber: number, answer: string) => void
  loadAnswers: (answers: InterviewAnswer[]) => void
  contentLanguage: ContentLanguage
  setContentLanguage: (language: ContentLanguage) => void
}

const StoryContext = createContext<
  StoryContextType | undefined
>(undefined)

export function StoryProvider({
  children,
}: {
  children: ReactNode
}) {
  const [storyId, setStoryId] = useState<number | null>(null)
  const [answers, setAnswers] =
    useState<Record<number, string>>({})
  const [contentLanguage, setContentLanguage] =
    useState<ContentLanguage>("en")

  function setAnswer(
    questionNumber: number,
    answer: string
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionNumber]: answer,
    }))
  }

  const loadAnswers = useCallback(
    (savedAnswers: InterviewAnswer[]) => {
      const restoredAnswers: Record<number, string> = {}

      for (const item of savedAnswers) {
        restoredAnswers[item.questionNumber] = item.answer
      }

      setAnswers(restoredAnswers)
    },
    []
  )

  return (
    <StoryContext.Provider
      value={{
        storyId,
        setStoryId,
        answers,
        setAnswer,
        loadAnswers,
        contentLanguage,
        setContentLanguage,
      }}
    >
      {children}
    </StoryContext.Provider>
  )
}

export function useStory() {
  const context = useContext(StoryContext)

  if (!context) {
    throw new Error(
      "useStory must be used inside StoryProvider"
    )
  }

  return context
}
