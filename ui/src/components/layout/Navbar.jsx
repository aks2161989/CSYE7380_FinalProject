import { NavLink } from "react-router-dom";
import { BarChart3, MessageSquare, TrendingUp } from "lucide-react";

const links = [
  { to: "/", label: "Portfolio", icon: BarChart3 },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/trading", label: "Trading", icon: TrendingUp },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0a0e1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20">
            BH
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-100 hidden sm:block">
            Buffett Intelligence
          </span>
        </NavLink>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-800 text-amber-400 shadow-inner"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
