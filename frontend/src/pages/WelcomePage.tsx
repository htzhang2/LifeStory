import { useNavigate } from "react-router-dom"

function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-3xl text-center">

        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
          📖
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          My Life Story
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-600">
          Preserve your memories, experiences, and stories
          for yourself and the people you love.
        </p>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">

          <h2 className="text-2xl font-semibold text-gray-900">
            Your story belongs to you.
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            We will gently guide you through your life story,
            one question at a time. You can write as much or
            as little as you like.
          </p>

          <button
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => navigate("/basic-info")}
          >
            Start My Story
          </button>

        </div>

        <p className="mt-8 text-sm text-gray-500">
          Take your time. You can save your story and come back anytime.
        </p>

      </div>
    </div>
  )
}

export default WelcomePage