import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useStory } from "../context/StoryContext"
import {
  saveAnswer,
  transcribeAudio,
  getLifeStory,
  getStoryAnswers,
  type ContentLanguage,
} from "../api/lifeStoryApi"

type Question = {
  title: string
  description: string
  question: string
}

const questionsByLanguage: Record<ContentLanguage, Question[]> = {
  en: [
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
    {
      title: "Your school years",
      question: "What do you remember about your school?",
      description:
        "Tell us about your school, teachers, classmates, or anything that made your school years memorable.",
    },
    {
      title: "Your school friends",
      question: "Who were your closest friends when you were young?",
      description:
        "Tell us about your friends, what you did together, and any memories that still stand out.",
    },
    {
      title: "Growing up",
      question: "What did you enjoy doing when you were a child?",
      description:
        "Think about games, hobbies, reading, sports, exploring, helping your family, or anything else you enjoyed.",
    },
    {
      title: "Life after school",
      question: "What did you do after finishing school?",
      description:
        "Tell us whether you continued studying, started working, learned a trade, or took another path. Share the experiences that shaped this stage of your life.",
    },
    {
      title: "Your first job",
      question: "What was your first job or major responsibility?",
      description:
        "Describe what you did, the people you worked with, what you learned, and any memorable experiences from that time.",
    },
    {
      title: "Your hopes and dreams",
      question: "What were your hopes and dreams when you were young?",
      description:
        "Share what you hoped your future would be like, what mattered most to you, and whether your life turned out as you expected.",
    },
    {
      title: "Important relationships",
      question: "Who were the most important people in your life during this period?",
      description:
        "Tell us about people who influenced you, supported you, or changed the direction of your life. They might have been a partner, friend, relative, mentor, or someone else.",
    },
    {
      title: "Love and partnership",
      question: "Who were the most important people in your life during this period?",
      description:
        "Tell us about people who influenced you, supported you, or changed the direction of your life. They might have been a partner, friend, relative, mentor, or someone else.",
    },
    {
      title: "Building a family",
      question: "What was it like building or caring for a family, if that was part of your life?",
      description:
        "Share your experiences of marriage, raising children, caring for relatives, or creating a home. Tell us about the joys, responsibilities, and challenges you remember.",
    },
    {
      title: "Family traditions and memories",
      question: "What family traditions or moments together do you remember most?",
      description:
        "Think about holidays, meals, celebrations, visits, family trips, or simple everyday moments that became special memories.",
    },
    {
      title: "Your working life",
      question: "What work or responsibilities played the biggest role in your life?",
      description:
        "Tell us about your career, business, household responsibilities, caregiving, or other work that shaped your daily life.",
    },
    {
      title: "Proud moments",
      question: "What accomplishment or moment in your life made you especially proud?",
      description:
        "It could be a professional achievement, helping your family, overcoming a difficulty, learning something new, or making a difference to someone.",
    },
    {
      title: "Lessons learned",
      question: "What important lessons did you learn from your work and life experiences?",
      description:
        "Share only what you feel comfortable sharing. You might describe a setback, a major change, a family responsibility, or a challenge that tested your strength.",
    },
    {
      title: "Difficult times",
      question: "What was one of the most difficult periods in your life, and how did you get through it?",
      description:
        "Think about lessons involving responsibility, relationships, money, perseverance, kindness, or making important decisions.",
    },
    {
      title: "Life today",
      question: "What does your life look like today, and what brings you happiness?",
      description:
        "Tell us about your daily life, the people you spend time with, your interests, and the little things that make life meaningful.",
    },
    {
      title: "Values and beliefs",
      question: "What values or beliefs have guided you throughout your life?",
      description:
        "Think about what you believe matters most, such as family, honesty, hard work, kindness, independence, or perseverance. Have your beliefs changed over time?",
    },
    {
      title: "Advice for younger generations",
      question: "What advice would you like to pass on to your children, grandchildren, or younger generations?",
      description:
        "Share what you wish you had known when you were young, including lessons about relationships, work, money, family, and finding happiness.",
    },
    {
      title: "What you hope to leave behind",
      question: "What would you most like your family to remember about you?",
      description:
        "It might be a story, a family tradition, a value you lived by, something you accomplished, or the way you cared for others.",
    },
    {
      title: "Hopes for the future",
      question: "What are your hopes for your family and for the generations to come?",
      description:
        "Share your wishes for your family's happiness, health, relationships, opportunities, and future. End with any final thoughts you would like to leave in your autobiography.",
    }
  ],

  "zh-CN": [
    {
      title: "让我们从童年开始",
      question: "您出生在哪里？",
      description:
        "请介绍一下您生命开始的地方，也可以分享任何您记得的事情。",
    },
    {
      title: "童年的早期时光",
      question: "您还记得自己成长的地方是什么样子吗？",
      description:
        "可以回忆一下您的家、周围的街区、学校、朋友，或任何让您印象深刻的事情。",
    },
    {
      title: "您的家庭",
      question: "您小时候的家庭是什么样的？",
      description:
        "请讲讲您的父母、兄弟姐妹、祖父母，或其他对您很重要的人。",
    },
    {
      title: "您的学生时代",
      question: "您对上学时的学校有什么印象？",
      description:
        "可以聊聊学校、老师、同学，或学生时代任何让您难忘的事情。",
    },
    {
      title: "学生时代的朋友",
      question: "您年轻时最要好的朋友是谁？",
      description:
        "请讲讲您的朋友、你们一起做过的事情，以及至今仍让您记忆犹新的往事。",
    },
    {
      title: "成长中的快乐时光",
      question: "您小时候最喜欢做什么？",
      description:
        "可以回忆游戏、爱好、阅读、运动、探索新事物、帮家里做事，或任何您喜欢的活动。",
    },
    {
      title: "毕业后的生活",
      question: "您完成学业后做了什么？",
      description:
        "请讲讲您毕业后是继续学习、开始工作、学习一门手艺，还是选择了其他道路。也可以分享塑造了您这一人生阶段的经历。",
    },
    {
      title: "您的第一份工作",
      question: "您的第一份工作或第一项重要责任是什么？",
      description:
        "请介绍您当时做什么、与哪些人共事、学到了什么，以及那段时间有哪些难忘的经历。",
    },
    {
      title: "您的希望与梦想",
      question: "您年轻时有什么希望和梦想？",
      description:
        "请分享您当时对未来的期待、最看重的事情，以及后来的人生是否如您所想。",
    },
    {
      title: "生命中重要的人",
      question: "在人生的这一阶段，哪些人对您最重要？",
      description:
        "请讲讲那些影响过您、支持过您，或改变了您人生方向的人。他们可能是伴侣、朋友、亲戚、导师，或其他重要的人。",
    },
    {
      title: "爱情与伴侣",
      question: "您是否有过一段让您至今仍怀念的感情或爱情故事？",
      description:
        "如果您愿意分享，可以讲讲你们如何相识、是什么让你们走到一起，或一段重要感情带给您的体会。如果这道问题不适合您的经历，也可以分享其他有意义的往事。",
    },
    {
      title: "组建家庭",
      question: "如果组建家庭或照顾家人是您人生的一部分，那段经历是什么样的？",
      description:
        "可以分享婚姻生活、养育子女、照顾亲人或经营家庭的经历，也可以讲讲其中的快乐、责任和挑战。",
    },
    {
      title: "家庭传统与难忘回忆",
      question: "您最怀念哪些家庭传统或家人团聚的时刻？",
      description:
        "可以回忆节日、家庭聚餐、庆祝活动、探亲、家庭旅行，或那些后来成为珍贵回忆的平凡日常。",
    },
    {
      title: "您的工作与事业",
      question: "哪些工作或责任在人生中占据了最重要的位置？",
      description:
        "请讲讲您的职业、事业、家庭责任、照顾家人，或其他影响您日常生活的重要工作。",
    },
    {
      title: "值得骄傲的时刻",
      question: "人生中有哪些成就或时刻让您特别感到骄傲？",
      description:
        "这可以是工作上的成就、对家庭的付出、克服困难、学习新事物，或为他人带来积极影响。",
    },
    {
      title: "人生中的困难时期",
      question: "您人生中最艰难的时期之一是什么？您是如何度过的？",
      description:
        "您可以只分享自己愿意讲述的部分，例如一次挫折、重大变化、家庭责任，或考验您毅力的困难。",
    },
    {
      title: "人生的经验与教训",
      question: "您从工作和人生经历中学到了哪些重要的道理？",
      description:
        "可以谈谈您对责任、人际关系、金钱、坚持、善良，或重要人生选择的体会。",
    },
    {
      title: "现在的生活",
      question: "您现在的生活是什么样的？什么事情让您感到快乐？",
      description:
        "请讲讲您现在的日常生活、经常相处的人、兴趣爱好，以及那些让您觉得生活有意义的小事。",
    },
    {
      title: "价值观与信念",
      question: "哪些价值观或信念一直指引着您的人生？",
      description:
        "可以谈谈您最看重的东西，例如家庭、诚信、勤奋、善良、独立或坚持。随着岁月流逝，您的想法和信念是否发生过变化？",
    },
    {
      title: "给年轻一代的建议",
      question: "您有什么人生建议想留给子女、孙辈或年轻一代？",
      description:
        "请分享您年轻时希望早点明白的道理，例如如何处理人际关系、工作、金钱、家庭，以及如何寻找真正的幸福。",
    },
    {
      title: "希望留下的精神财富",
      question: "您最希望家人记住您什么？",
      description:
        "可以是一段故事、一项家庭传统、一种您始终坚持的价值观、一项成就，或您关爱他人的方式。",
    },
    {
      title: "对未来的期望",
      question: "您对家人以及未来几代人有什么期望？",
      description:
        "请分享您对家人的幸福、健康、人际关系、发展机会和未来的期望。最后，也可以写下您希望留在这本自传中的话。",
    }
  ],
}

function QuestionPage() {
  const navigate = useNavigate()
  const { questionNumber } = useParams()

  const currentQuestionNumber = Number(questionNumber ?? 1)

  const { storyId, answers, setAnswer, loadAnswers } = useStory()

  const [contentLanguage, setContentLanguage] =
    useState<ContentLanguage>("en")
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] =
    useState<MediaRecorder | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [localAnswer, setLocalAnswer] = useState("")

  const questions = questionsByLanguage[contentLanguage]
  const questionIndex = currentQuestionNumber - 1
  const currentQuestion = questions[questionIndex]

  // Load the saved language and answers for this story.
  useEffect(() => {
    if (storyId === null) return

    let cancelled = false

    async function loadSavedStory() {
      try {
        const [story, savedAnswers] = await Promise.all([
          getLifeStory(storyId!),
          getStoryAnswers(storyId!),
        ])

        if (cancelled) return

        setContentLanguage(story.contentLanguage ?? "en")
        loadAnswers(savedAnswers)
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load saved story:", error)
          alert("Unable to load your saved story. Please try again.")
        }
      }
    }

    void loadSavedStory()

    return () => {
      cancelled = true
    }
  }, [storyId, loadAnswers])

  // Load the saved answer when the question changes.
  useEffect(() => {
    setLocalAnswer(answers[currentQuestionNumber] ?? "")
  }, [currentQuestionNumber, answers])

  // Stop speech when leaving a question or unmounting the page.
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
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

  function handleListenToQuestion() {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported by this browser.")
      return
    }

    window.speechSynthesis.cancel()

    const speechText = [
      currentQuestion.title,
      currentQuestion.question,
      currentQuestion.description,
    ].join(". ")

    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.lang =
      contentLanguage === "zh-CN" ? "zh-CN" : "en-US"
    utterance.rate = 0.9

    window.speechSynthesis.speak(utterance)
  }

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

    if (!trimmedAnswer || isTranscribing || isRecording) {
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

      setAnswer(currentQuestionNumber, trimmedAnswer)

      if (currentQuestionNumber < totalQuestions) {
        navigate(`/question/${currentQuestionNumber + 1}`)
      } else {
        navigate("/story")
      }
    } catch (error) {
      console.error("Failed to save answer:", error)
      alert("Unable to save your answer. Please try again.")
    }
  }

  function handleBack() {
    window.speechSynthesis?.cancel()

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
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
              onClick={handleListenToQuestion}
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
              disabled={isTranscribing}
              className={`rounded-xl px-6 py-4 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
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
              type="button"
              className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              onClick={handleBack}
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={
                !localAnswer.trim() || isTranscribing || isRecording
              }
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

