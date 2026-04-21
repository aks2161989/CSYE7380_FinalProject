import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import SplashScreen from "./components/SplashScreen";
import PageLayout from "./components/layout/PageLayout";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import TradingPage from "./pages/TradingPage";
import EvaluationPage from "./pages/EvaluationPage";

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <ThemeProvider>
      {loading && <SplashScreen onComplete={() => setLoading(false)} />}
      <BrowserRouter>
        <PageLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
