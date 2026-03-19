import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, LayoutDashboard, FolderLock, ScanSearch,
  Clock, LogOut, Plus, AlertTriangle, ChevronRight, RefreshCw
} from "lucide-react";
import { listVaultItems, listSubmissions } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { getRiskColor } from "../lib/riskColors";
import VaultCard from "../components/VaultCard";

const TABS = {
  DASHBOARD: "dashboard",
  VAULT: "vault",
  HISTORY: "history",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t, locale, setLocale } = useT();
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);

  const { data: vaultItems = [], refetch: refetchVault } = useQuery({
    queryKey: ["vault"],
    queryFn: () => listVaultItems().then((r) => r.data),
  });

  const { data: submissions = [], refetch: refetchSubmissions } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => listSubmissions().then((r) => r.data),
  });

  const attentionCount = vaultItems.filter(
    (v) => v.risk_level === "RED" || v.risk_level === "ORANGE"
  ).length;

  const thisMonth = submissions.filter((s) => {
    if (!s.created_at) return false;
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const navItems = [
    { Icon: LayoutDashboard, labelKey: "nav.dashboard", tab: TABS.DASHBOARD },
    { Icon: FolderLock, labelKey: "nav.vault", tab: TABS.VAULT },
    { Icon: ScanSearch, labelKey: "nav.verify", action: () => navigate("/verify") },
    { Icon: Clock, labelKey: "nav.history", tab: TABS.HISTORY },
  ];

  const handleRefresh = () => {
    refetchVault();
    refetchSubmissions();
  };

  const riskBadge = (level) => {
    if (!level) return null;
    const color = getRiskColor(level);
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {level}
      </span>
    );
  };

  const statusBadge = (status) => {
    const colors = {
      completed: "bg-risk-green/10 text-risk-green",
      processing: "bg-accent/10 text-accent",
      failed: "bg-risk-red/10 text-risk-red",
    };
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[status] || "bg-bg-input text-text-muted"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-border p-6">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate("/")}>
          <Shield className="w-7 h-7 text-accent" />
          <span className="text-xl font-bold text-text-primary">Rakshak</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ Icon, labelKey, tab, action }) => (
            <button
              key={labelKey}
              onClick={() => action ? action() : setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                tab && activeTab === tab
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-input"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {t(labelKey)}
            </button>
          ))}
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

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-bg-base">
        {/* Mobile nav */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold text-text-primary">Rakshak</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg text-text-muted"
            >
              {locale === "en" ? "हिं" : "EN"}
            </button>
            <button
              onClick={() => navigate("/verify")}
              className="p-2 bg-accent rounded-lg"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 mb-6 bg-bg-input rounded-xl p-1">
          {[
            { tab: TABS.DASHBOARD, label: t("nav.dashboard") },
            { tab: TABS.VAULT, label: t("nav.vault") },
            { tab: TABS.HISTORY, label: t("nav.history") },
          ].map(({ tab, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab ? "bg-bg-card text-accent shadow-sm" : "text-text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === TABS.DASHBOARD && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-text-primary">{t("nav.dashboard")}</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="p-2 text-text-muted hover:text-text-primary border border-border rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate("/verify")}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> {t("common.new_verification")}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { labelKey: "dashboard.vault_items", value: vaultItems.length, Icon: FolderLock, color: "text-accent", onClick: () => setActiveTab(TABS.VAULT) },
                { labelKey: "dashboard.attention_needed", value: attentionCount, Icon: AlertTriangle, color: "text-risk-orange", onClick: () => setActiveTab(TABS.VAULT) },
                { labelKey: "dashboard.this_month", value: thisMonth, Icon: ScanSearch, color: "text-risk-green", onClick: () => setActiveTab(TABS.HISTORY) },
              ].map(({ labelKey, value, Icon, color, onClick }) => (
                <div
                  key={labelKey}
                  onClick={onClick}
                  className="bg-bg-card rounded-2xl p-5 border border-border cursor-pointer hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">{t(labelKey)}</span>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-3xl font-bold font-mono text-text-primary">{value}</p>
                </div>
              ))}
            </div>

            {/* Recent Vault Items (top 4) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">{t("dashboard.your_vault")}</h2>
                {vaultItems.length > 0 && (
                  <button
                    onClick={() => setActiveTab(TABS.VAULT)}
                    className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {vaultItems.length === 0 ? (
                <div className="text-center py-12 text-text-muted bg-bg-card rounded-2xl border border-border">
                  <FolderLock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{t("dashboard.no_vault_items")}</p>
                  <p className="text-sm mt-1">{t("dashboard.no_vault_subtitle")}</p>
                  <button
                    onClick={() => navigate("/verify")}
                    className="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {t("common.new_verification")}
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vaultItems.slice(0, 6).map((item) => (
                    <VaultCard key={item.vault_id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity (top 5) */}
            {submissions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">{t("dashboard.recent_activity")}</h2>
                  {submissions.length > 5 && (
                    <button
                      onClick={() => setActiveTab(TABS.HISTORY)}
                      className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                    >
                      View all <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {submissions.slice(0, 5).map((s) => (
                    <div
                      key={s.submission_id}
                      className="flex items-center justify-between bg-bg-card rounded-xl px-5 py-3.5 border border-border hover:border-accent/30 cursor-pointer transition-colors"
                      onClick={() => s.submission_status === "completed" && navigate(`/vault/${s.submission_id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {s.village_name || t("dashboard.unknown")} — Plot #{s.plot_number || "—"}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {riskBadge(s.risk_level)}
                        {statusBadge(s.submission_status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Vault Tab */}
        {activeTab === TABS.VAULT && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-text-primary">{t("dashboard.your_vault")}</h1>
              <button
                onClick={() => navigate("/verify")}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> {t("common.new_verification")}
              </button>
            </div>

            {vaultItems.length === 0 ? (
              <div className="text-center py-20 text-text-muted bg-bg-card rounded-2xl border border-border">
                <FolderLock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>{t("dashboard.no_vault_items")}</p>
                <p className="text-sm mt-1">{t("dashboard.no_vault_subtitle")}</p>
                <button
                  onClick={() => navigate("/verify")}
                  className="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("common.new_verification")}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vaultItems.map((item) => (
                  <VaultCard key={item.vault_id} item={item} />
                ))}
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === TABS.HISTORY && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-text-primary">{t("dashboard.recent_activity")}</h1>
              <button
                onClick={handleRefresh}
                className="p-2 text-text-muted hover:text-text-primary border border-border rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-20 text-text-muted bg-bg-card rounded-2xl border border-border">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No submissions yet.</p>
                <button
                  onClick={() => navigate("/verify")}
                  className="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("common.new_verification")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((s) => (
                  <div
                    key={s.submission_id}
                    className="flex items-center justify-between bg-bg-card rounded-xl px-5 py-4 border border-border hover:border-accent/30 cursor-pointer transition-colors"
                    onClick={() => s.submission_status === "completed" && navigate(`/vault/${s.submission_id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {s.village_name || t("dashboard.unknown")} — Plot #{s.plot_number || "—"}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {riskBadge(s.risk_level)}
                      {statusBadge(s.submission_status)}
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
