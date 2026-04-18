import { MessageSquarePlus, Trash2, MessageSquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  collapsed,
  onToggle,
}) {
  return (
    <div
      className={`flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950/80 transition-all duration-300 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      {/* Toggle button */}
      <div className={`flex items-center border-b border-slate-800 ${collapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-3"}`}>
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            History
          </span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Collapsed state — just icons */}
      {collapsed ? (
        <>
          <div className="flex-1 overflow-y-auto py-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  conv.id === activeId
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
                title={conv.title}
              >
                <MessageSquare size={14} />
              </button>
            ))}
          </div>
          <div className="border-t border-slate-800 p-2">
            <button
              onClick={onNew}
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              title="New Chat"
            >
              <MessageSquarePlus size={16} />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {conversations.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-slate-600">
                No conversations yet
              </p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-all ${
                  conv.id === activeId
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare size={14} className="shrink-0 text-slate-500" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="shrink-0 rounded p-0.5 text-slate-600 opacity-0 transition-all hover:bg-slate-700 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* New chat button */}
          <div className="border-t border-slate-800 p-3">
            <button
              onClick={onNew}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-amber-500/40 hover:bg-slate-800 hover:text-slate-100"
            >
              <MessageSquarePlus size={16} />
              New Chat
            </button>
          </div>
        </>
      )}
    </div>
  );
}
