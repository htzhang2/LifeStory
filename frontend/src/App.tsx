import { BrowserRouter, Routes, Route } from "react-router-dom"
import WelcomePage from "./pages/WelcomePage"
import BasicInfoPage from "./pages/BasicInfoPage"
import QuestionPage from "./pages/QuestionPage"
import { StoryProvider } from "./context/StoryContext"
import StoryPage from "./pages/StoryPage"

function App() {
  return (
    <StoryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route
            path="/basic-info"
            element={<BasicInfoPage />}
          />
          <Route
            path="/question/:questionNumber"
            element={<QuestionPage />}
          />
          <Route path="/story" element={<StoryPage />} />
        </Routes>
      </BrowserRouter>
    </StoryProvider>
  )
}

export default App