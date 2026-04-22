import Navbar from "./Navbar";
import ChatFloatingButton from "./ChatFloatingButton";

export default function PageLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <ChatFloatingButton />
    </div>
  );
}
