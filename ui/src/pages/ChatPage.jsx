import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, FlaskConical, Sun, Moon } from 'lucide-react';
import warrenAvatar from '../assets/warren-avatar-sm.png';
import warrenLogo from '../assets/warren-logo.png';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import SampleQuestions from '../components/chat/SampleQuestions';
import ChatSidebar from '../components/chat/ChatSidebar';
import { useTheme } from '../context/ThemeContext';
import { sendMessage } from '../services/api';

const CONVERSATIONS_KEY = 'buffett-conversations';
const ACTIVE_KEY = 'buffett-active-chat';
const SIDEBAR_KEY = 'buffett-sidebar-collapsed';

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
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New Chat';
  return first.content.length > 40
    ? first.content.slice(0, 40) + '...'
    : first.content;
}

export default function ChatPage() {
  const { dark, toggle } = useTheme();
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(loadActiveId);
  const [loading, setLoading] = useState(false);
  const [animatingIdx, setAnimatingIdx] = useState(null);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true',
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function toggleSidebar() {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  }

  function handleNew() {
    const id = generateId();
    const newConv = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
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
      const newConv = {
        id,
        title: question.slice(0, 40),
        messages: [],
        createdAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(id);
      currentId = id;
    }

    const userMsg = { role: 'user', content: question };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c;
        const newMsgs = [...c.messages, userMsg];
        return { ...c, messages: newMsgs, title: deriveTitle(newMsgs) };
      }),
    );

    setLoading(true);

    try {
      const currentConv = conversations.find((c) => c.id === currentId);
      const history = (currentConv?.messages || []).map(({ role, content }) => ({ role, content }));
      const result = await sendMessage(question, history);
      const assistantMsg = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        stock_data: result.stock_data,
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentId) return c;
          const newMsgs = [...c.messages, assistantMsg];
          setAnimatingIdx(newMsgs.length - 1);
          return { ...c, messages: newMsgs, title: deriveTitle(newMsgs) };
        }),
      );
    } catch {
      const errorMsg = {
        role: 'assistant',
        content:
          'Sorry, something went wrong. Make sure the FastAPI server is running (uvicorn server:app --port 8000).',
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentId) return c;
          return { ...c, messages: [...c.messages, errorMsg] };
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='fixed inset-0 flex bg-slate-50 dark:bg-[#0d1520]'>
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
      <div className='flex flex-1 flex-col min-w-0'>
        {/* Inline navbar for chat page */}
        <nav className='flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-6 dark:border-slate-800 dark:bg-[#0d1520]/80'>
          <div className='flex items-center gap-2'>
            <Link to='/' className='flex items-center gap-2'>
              <img src={warrenLogo} alt="Warren" className='h-9 w-auto object-contain' />
            </Link>
            <div>
              <span className='block text-sm font-semibold text-slate-900 dark:text-slate-100'>
                Warren likes Burger
              </span>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            <Link
              to='/'
              className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            >
              <BarChart3 size={16} /> <span className='hidden sm:inline'>Portfolio</span>
            </Link>
            <Link
              to='/trading'
              className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            >
              <TrendingUp size={16} /> <span className='hidden sm:inline'>Trading</span>
            </Link>
            <Link
              to='/evaluation'
              className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            >
              <FlaskConical size={16} /> <span className='hidden sm:inline'>Evaluation</span>
            </Link>
            <button
              onClick={toggle}
              className='ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              aria-label='Toggle theme'
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </nav>

        {/* Chat content */}
        <div className='flex flex-1 flex-col min-h-0'>
          {messages.length === 0 ? (
            <SampleQuestions onSelect={handleSend} />
          ) : (
            <div className='flex-1 overflow-y-auto px-6 py-6'>
              <div className='mx-auto max-w-3xl space-y-6'>
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    message={msg}
                    animate={i === animatingIdx}
                  />
                ))}
                {loading && (
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden animate-pulse'>
                      <img
                        src={warrenAvatar}
                        alt='Warren AI'
                        className='h-7 w-7 object-contain'
                      />
                    </div>
                    <div className='rounded-2xl rounded-tl-sm bg-slate-200 px-4 py-3 dark:bg-slate-800'>
                      <div className='flex gap-1'>
                        <span className='h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:0ms]' />
                        <span className='h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:150ms]' />
                        <span className='h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:300ms]' />
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
