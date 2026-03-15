import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, FolderLock, ScanSearch,
  Clock, Settings, LogOut, Plus, AlertTriangle
} from "lucide-react";
import { listVaultItems, listSubmissions } from "../lib/api";
import { useAuth } from "../lib/auth";
import VaultCard from "../components/VaultCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { data: vaultItems = [] } = useQuery({
    queryKey: ["vault"],
    queryFn: () => listVaultItems().then((r) => r.data),
  });

  const { data: submissions = [] } = useQuery({
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
    { Icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", active: true },
    { Icon: FolderLock, label: "Vault", path: "/dashboard" },
    { Icon: ScanSearch, label: "Verify", path: "/verify" },
    { Icon: Clock, label: "History", path: "/dashboard" },
    { Icon: Settings, label: "Settings", path: "/dashboard" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-10">
          <Shield className="w-7 h-7 text-accent" />
          <span className="text-xl font-bold">Rakshak</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ Icon, label, path, active }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-base"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-risk-red transition-colors"
        >
          <LogOut className="w-4.5 h-4.5" /> Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Mobile nav */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">Rakshak</span>
          </div>
          <button
            onClick={() => navigate("/verify")}
            className="p-2 bg-accent rounded-lg"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Vault Items", value: vaultItems.length, Icon: FolderLock, color: "text-accent" },
            { label: "Attention Needed", value: attentionCount, Icon: AlertTriangle, color: "text-risk-orange" },
            { label: "This Month", value: thisMonth, Icon: ScanSearch, color: "text-risk-green" },
          ].map(({ label, value, Icon, color }) => (
            <motion.div
              key={label}
              className="bg-bg-card rounded-2xl p-5 border border-slate-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">{label}</span>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-3xl font-bold font-mono">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Vault Grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Vault</h2>
          <button
            onClick={() => navigate("/verify")}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Verification
          </button>
        </div>

        {vaultItems.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <FolderLock className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No items in your vault yet.</p>
            <p className="text-sm mt-1">Verify a land document to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {vaultItems.map((item) => (
              <VaultCard key={item.vault_id} item={item} />
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {submissions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((s) => (
                <div
                  key={s.submission_id}
                  className="flex items-center justify-between bg-bg-card rounded-xl px-5 py-3 border border-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {s.village_name || "Unknown"} — Plot #{s.plot_number || "—"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-text-muted">
                    {s.submission_status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
