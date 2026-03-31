import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, ChevronRight, RefreshCw, Search } from "lucide-react";
import { listSubmissions, listVaultItems } from "../lib/api";
import { useT } from "../lib/i18n";
import { getRiskColor } from "../lib/riskColors";
import AppLayout from "../components/AppLayout";

export default function History() {
  const navigate = useNavigate();
  const { t } = useT();
  const [search, setSearch] = useState("");

  const { data: submissions = [], refetch } = useQuery({
    queryKey: ["submissions", search],
    queryFn: () => listSubmissions(search || undefined).then((r) => r.data),
  });

  const { data: vaultItems = [] } = useQuery({
    queryKey: ["vault"],
    queryFn: () => listVaultItems().then((r) => r.data),
  });

  const subToVault = {};
  vaultItems.forEach((v) => { if (v.submission_id) subToVault[v.submission_id] = v.vault_id; });

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
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("dashboard.recent_activity")}</h1>
        <button
          onClick={refetch}
          className="p-2 text-text-muted hover:text-text-primary border border-border rounded-lg transition-colors hover:border-gold/40"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search by village, plot, or seller name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
        />
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20 text-text-muted bg-bg-card rounded-2xl border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{t("dashboard.no_submissions") || "No submissions yet."}</p>
          <button
            onClick={() => navigate("/verify")}
            className="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all active:scale-95"
          >
            {t("common.new_verification")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s, i) => (
            <motion.div
              key={s.submission_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between bg-bg-card rounded-xl px-5 py-4 border border-border border-l-4 border-l-accent/40 hover:border-l-accent cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "var(--shadow-card)" }}
              onClick={() => s.submission_status === "completed" && navigate(`/vault/${subToVault[s.submission_id] || s.submission_id}`)}
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
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
