import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, FolderLock, ScanSearch,
  Clock, LogOut, Plus, UserCircle,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";

const navItems = [
  { Icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
  { Icon: FolderLock, labelKey: "nav.vault", path: "/vault" },
  { Icon: ScanSearch, labelKey: "nav.verify", path: "/verify" },
  { Icon: Clock, labelKey: "nav.history", path: "/history" },
  { Icon: UserCircle, labelKey: "nav.profile", path: "/profile" },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userName, userEmail } = useAuth();
  const { t, locale, setLocale } = useT();

  const currentPath = location.pathname;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 p-6" style={{ backgroundColor: "var(--color-navy-deep)" }}>
        <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate("/")}>
          <Shield className="w-7 h-7" style={{ color: "var(--color-gold)" }} />
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>BhumiRakshak</span>
            <span className="text-xs italic" style={{ fontFamily: "var(--font-display)", color: "var(--color-teal)" }}>Land Verification</span>
          </div>
        </div>

        {/* User info */}
        {userName && (
          <div className="mb-6 px-4 py-3 border border-white/10 rounded-sm">
            <p className="text-sm font-bold text-white truncate uppercase tracking-wide">{userName}</p>
            {userEmail && <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{userEmail}</p>}
          </div>
        )}

        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ Icon, labelKey, path }) => {
            const isActive = currentPath === path || currentPath.startsWith(path + "/");
            return (
              <button
                key={labelKey}
                onClick={() => navigate(path)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? ""
                    : "hover:bg-white/5"
                }`}
                style={{
                  color: isActive ? "var(--color-gold)" : "rgba(255,255,255,0.6)",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-white/20 rounded-sm transition-colors hover:border-white/40"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {locale === "en" ? "हिंदी" : "English"}
          </button>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <LogOut className="w-4 h-4" /> {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-white/10 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "var(--color-navy-deep)" }}>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
          <span className="text-base font-bold text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>BhumiRakshak</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className="px-2.5 py-1.5 text-xs font-bold border border-white/20 rounded-sm uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {locale === "en" ? "हिं" : "EN"}
          </button>
          <button
            onClick={() => navigate("/vault/add")}
            className="p-2 rounded-sm active:scale-95 transition-transform"
            style={{ backgroundColor: "var(--color-gold)", boxShadow: "var(--shadow-gold)" }}
          >
            <Plus className="w-5 h-5" style={{ color: "var(--color-navy)" }} />
          </button>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 flex" style={{ backgroundColor: "var(--color-navy-deep)" }}>
        {navItems.map(({ Icon, labelKey, path }) => {
          const isActive = currentPath === path || currentPath.startsWith(path + "/");
          return (
            <button
              key={labelKey}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors"
              style={{ color: isActive ? "var(--color-gold)" : "rgba(255,255,255,0.5)" }}
            >
              <Icon className="w-5 h-5" />
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-bg-base md:pt-10 pt-20 pb-24 md:pb-10">
        {children}
      </main>
    </div>
  );
}
