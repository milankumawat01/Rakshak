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
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-border p-6">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate("/")}>
          <Shield className="w-7 h-7 text-accent" />
          <span className="text-xl font-bold text-text-primary">BhomiRakshak</span>
        </div>

        {/* User info */}
        {userName && (
          <div className="mb-6 px-4 py-3 bg-bg-input rounded-xl">
            <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
            {userEmail && <p className="text-xs text-text-muted truncate">{userEmail}</p>}
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {navItems.map(({ Icon, labelKey, path }) => {
            const isActive = currentPath === path || currentPath.startsWith(path + "/");
            return (
              <button
                key={labelKey}
                onClick={() => navigate(path)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-input"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-accent/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <Icon className="w-4.5 h-4.5" />
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-2">
          <button
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-text-muted border border-border rounded-xl hover:bg-bg-input transition-colors"
          >
            {locale === "en" ? "हिंदी" : "English"}
          </button>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-risk-red transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" /> {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-accent" />
          <span className="text-lg font-bold text-text-primary">BhomiRakshak</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className="px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg text-text-muted"
          >
            {locale === "en" ? "हिं" : "EN"}
          </button>
          <button
            onClick={() => navigate("/vault/add")}
            className="p-2 bg-gold rounded-lg active:scale-95 transition-transform"
            style={{ boxShadow: "var(--shadow-gold)" }}
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-border flex">
        {navItems.map(({ Icon, labelKey, path }) => {
          const isActive = currentPath === path || currentPath.startsWith(path + "/");
          return (
            <button
              key={labelKey}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
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
