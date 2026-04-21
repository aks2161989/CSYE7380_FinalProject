import { NavLink } from "react-router-dom";
import { BarChart3, MessageSquare, TrendingUp, FlaskConical, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import warrenLogo from "../../assets/warren-logo.png";

const links = [
  { to: "/", label: "Portfolio", icon: BarChart3 },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/trading", label: "Trading", icon: TrendingUp },
  { to: "/evaluation", label: "Evaluation", icon: FlaskConical },
];

export default function Navbar() {
  const { dark, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0d1520]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <img src={warrenLogo} alt="Warren" className="h-10 w-auto object-contain" />
          <span className="text-lg font-semibold tracking-tight text-slate-900 hidden sm:block dark:text-slate-100">
            Buffett Intelligence
          </span>
        </NavLink>

        {/* Nav links + theme toggle */}
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-100 text-red-600 shadow-sm dark:bg-slate-800 dark:text-red-400 dark:shadow-inner"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
