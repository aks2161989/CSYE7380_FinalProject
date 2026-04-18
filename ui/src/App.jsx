import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PageLayout from "./components/layout/PageLayout";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import TradingPage from "./pages/TradingPage";

export default function App() {
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}
