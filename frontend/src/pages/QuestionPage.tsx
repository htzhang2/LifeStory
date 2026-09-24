import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useStory } from "../context/StoryContext"
import { saveAnswer } from "../api/lifeStoryApi"
import { transcribeAudio } from "../api/lifeStoryApi"

type Question = {
  title: string
  description: string
  question: string
}

const questions: Question[] = [
  {
    title: "Let's start with your childhood",
    question: "Where were you born?",
    description:
      "Tell us about the place where your life began. You can share anything you remember.",
  },
  {
    title: "Your early years",
    question: "What do you remember about the place where you grew up?",
    description:
      "Think about your home, neighborhood, school, friends, or anything else that stands out.",
  },
  {
    title: "Your family",
    question: "What was your family like when you were growing up?",
    description:
      "Tell us about your parents, brothers, sisters, grandparents, or other people who were important to you.",
  },
]

function QuestionPage() {
  const navigate = useNavigate()
  const { questionNumber } = useParams()

  const currentQuestionNumber = Number(questionNumber ?? 1)
  const questionIndex = currentQuestionNumber - 1

  const currentQuestion = questions[questionIndex]
  
  const { storyId, answers, setAnswer } = useStory()
  const [localAnswer, setLocalAnswer] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] =
    useState<MediaRecorder | null>(null)

  const [isTranscribing, setIsTranscribing] = useState(false)

  useEffect(() => {
    setLocalAnswer(answers[currentQuestionNumber] ?? "")
    }, [currentQuestionNumber])

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Your questions are complete
          </h1>

          <p className="mt-4 text-gray-600">
            Thank you for sharing your story.
          </p>

          <button
            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const totalQuestions = questions.length
  const progress = (currentQuestionNumber / totalQuestions) * 100

  async function handleStartRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      const recorder = new MediaRecorder(stream)

      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, {
          type: recorder.mimeType,
        })

        stream.getTracks().forEach((track) => track.stop())

        console.log("Recorded audio:", audioBlob)
        
        // We'll send this to the backend in the next step.
        try {
          setIsTranscribing(true)

          const text = await transcribeAudio(audioBlob)

          setLocalAnswer(text)
        } catch (error) {
          console.error("Transcription failed:", error)
          alert("Unable to transcribe your recording.")
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()

      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error("Unable to access microphone:", error)
      alert("Unable to access your microphone.")
    }
}

  function handleStopRecording() {
    if (!mediaRecorder) {
      return
    }

    mediaRecorder.stop()

    setMediaRecorder(null)
    setIsRecording(false)
  }

  async function handleContinue() {
    const trimmedAnswer = localAnswer.trim()

    if (!trimmedAnswer) {
      return
    }

    if (storyId === null) {
      console.error("No life story ID")
      return
    }

    try {
      const savedAnswer = await saveAnswer(storyId, {
        questionNumber: currentQuestionNumber,
        question: currentQuestion.question,
        answer: trimmedAnswer,
      })

      console.log("Answer saved:", savedAnswer)

      // Keep the answer in React state too.
      setAnswer(currentQuestionNumber, trimmedAnswer)

      if (currentQuestionNumber < totalQuestions) {
        navigate(`/question/${currentQuestionNumber + 1}`)
      }
      else {
        navigate("/story")
      }
    } catch (error) {
      console.error("Failed to save answer:", error)
      alert("Unable to save your answer. Please try again.")
    }
  }

  function handleBack() {
    if (currentQuestionNumber === 1) {
      navigate("/")
      return
    }

    navigate(`/question/${currentQuestionNumber - 1}`)
  }

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              My Life Story
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Question {currentQuestionNumber} of {totalQuestions}
            </p>
          </div>

          <button
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-200"
            onClick={() => navigate("/")}
          >
            Save & Exit
          </button>
        </div>

        {/* Progress */}
        <div className="mb-10 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 sm:p-10">

          <p className="text-base font-medium text-blue-600">
            {currentQuestion.title}
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
            {currentQuestion.question}
          </h1>

          <p className="mt-5 text-lg leading-8 text-gray-600">
            {currentQuestion.description}
          </p>

          {/* Voice controls */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => console.log("Listen to question")}
            >
              🔊 Listen to Question
            </button>

            <button
              type="button"
              onClick={
                isRecording
                  ? handleStopRecording
                  : handleStartRecording
              }
              className={`rounded-xl px-6 py-4 text-lg font-semibold ${
                isRecording
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              {isRecording ? "⏹ Stop Recording" : "🎤 Speak"}
            </button>

            {isTranscribing && (
              <p className="text-lg text-gray-600">
                Transcribing your recording...
              </p>
            )}
          </div>

          {/* Answer */}
          <div className="mt-8">
            <label
              htmlFor="answer"
              className="block text-lg font-semibold text-gray-900"
            >
              Your answer
            </label>

            <textarea
              id="answer"
              rows={8}
              value={localAnswer}
              onChange={(event) => setLocalAnswer(event.target.value)}
              placeholder="Tell us about it..."
              className="mt-3 w-full resize-y rounded-xl border border-gray-300 bg-white p-5 text-lg leading-7 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              onClick={handleBack}
            >
              ← Back
            </button>

            <button
              disabled={!localAnswer.trim()}
              className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={handleContinue}
            >
              Save & Continue →
            </button>
          </div>
        </div>

        {/* Encouragement */}
        <p className="mt-8 text-center text-sm text-gray-500">
          There are no right or wrong answers. Just tell your story.
        </p>

      </div>
    </div>
  )
}

export default QuestionPage