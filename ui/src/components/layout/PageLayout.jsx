import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import ChatFloatingButton from "./ChatFloatingButton";

export default function PageLayout({ children }) {
  const { pathname } = useLocation();
  const isChatPage = pathname === "/chat";

  // Chat page renders its own full-screen layout with sidebar
  if (isChatPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <ChatFloatingButton />
    </div>
  );
}
