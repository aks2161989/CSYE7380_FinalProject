import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, BarChart3, TrendingUp } from "lucide-react";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import SampleQuestions from "../components/chat/SampleQuestions";
import ChatSidebar from "../components/chat/ChatSidebar";
import { sendMessage } from "../services/api";

const CONVERSATIONS_KEY = "buffett-conversations";
const ACTIVE_KEY = "buffett-active-chat";
const SIDEBAR_KEY = "buffett-sidebar-collapsed";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs) {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  } catch {}
}

function loadActiveId() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

function saveActiveId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

function deriveTitle(messages) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  return first.content.length > 40
    ? first.content.slice(0, 40) + "..."
    : first.content;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(loadActiveId);
  const [loading, setLoading] = useState(false);
  const [animatingIdx, setAnimatingIdx] = useState(null);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "true"
  );
  const bottomRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeId);
  const messages = activeConv?.messages || [];

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function toggleSidebar() {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  }

  function handleNew() {
    const id = generateId();
    const newConv = { id, title: "New Chat", messages: [], createdAt: Date.now() };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(id);
    setAnimatingIdx(null);
  }

  function handleSelect(id) {
    setActiveId(id);
    setAnimatingIdx(null);
  }

  function handleDelete(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  }

  async function handleSend(question) {
    let currentId = activeId;
    if (!currentId) {
      const id = generateId();
      const newConv = { id, title: question.slice(0, 40), messages: [], createdAt: Date.now() };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(id);
      currentId = id;
    }

    const userMsg = { role: "user", content: question };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c;
        const newMsgs = [...c.messages, userMsg];
        return { ...c, messages: newMsgs, title: deriveTitle(newMsgs) };
      })
    );

    setLoading(true);

    try {
      const result = await sendMessage(question);
      const assistantMsg = {
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentId) return c;
          const newMsgs = [...c.messages, assistantMsg];
          setAnimatingIdx(newMsgs.length - 1);
          return { ...c, messages: newMsgs, title: deriveTitle(newMsgs) };
        })
      );
    } catch {
      const errorMsg = {
        role: "assistant",
        content:
          "Sorry, something went wrong. Make sure the FastAPI server is running (uvicorn server:app --port 8000).",
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentId) return c;
          return { ...c, messages: [...c.messages, errorMsg] };
        })
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex">
      {/* Sidebar — full screen height */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        collapsed={collapsed}
        onToggle={toggleSidebar}
      />

      {/* Main area — navbar + chat */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Inline navbar for chat page */}
        <nav className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0a0e1a]/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-xs font-bold text-slate-950">
              BH
            </Link>
            <span className="text-base font-semibold text-slate-100">
              Warren AI
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
              <BarChart3 size={14} /> Portfolio
            </Link>
            <Link to="/trading" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
              <TrendingUp size={14} /> Trading
            </Link>
          </div>
        </nav>

        {/* Chat content */}
        <div className="flex flex-1 flex-col min-h-0">
          {messages.length === 0 ? (
            <SampleQuestions onSelect={handleSend} />
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    message={msg}
                    animate={i === animatingIdx}
                  />
                ))}
                {loading && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                      <Loader2 size={16} className="animate-spin" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          )}
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
