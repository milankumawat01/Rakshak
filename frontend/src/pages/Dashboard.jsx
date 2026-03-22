import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FolderLock, Plus, AlertTriangle, ChevronRight, RefreshCw,
  TrendingUp, TrendingDown, IndianRupee, Building2,
} from "lucide-react";
import { listVaultItems, listSubmissions, getVaultSummary } from "../lib/api";
import { useT } from "../lib/i18n";
import { getRiskColor } from "../lib/riskColors";
import VaultCard from "../components/VaultCard";
import AppLayout from "../components/AppLayout";

const formatINR = (val) => {
  if (!val) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useT();

  const { data: vaultItems = [], refetch: refetchVault } = useQuery({
    queryKey: ["vault"],
    queryFn: () => listVaultItems().then((r) => r.data),
  });

  const { data: submissions = [], refetch: refetchSubmissions } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => listSubmissions().then((r) => r.data),
  });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ["vault-summary"],
    queryFn: () => getVaultSummary().then((r) => r.data),
  });

  // Map submission_id -> vault_id for navigation
  const subToVault = {};
  vaultItems.forEach((v) => { if (v.submission_id) subToVault[v.submission_id] = v.vault_id; });

  const attentionCount = summary?.attention_count ?? vaultItems.filter(
    (v) => v.risk_level === "RED" || v.risk_level === "ORANGE"
  ).length;

  const handleRefresh = () => {
    refetchVault();
    refetchSubmissions();
    refetchSummary();
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

  const portfolioValue = summary?.portfolio_value || 0;
  const totalProfit = summary?.total_profit || 0;
  const totalCost = portfolioValue - totalProfit;
  const appreciationPct = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(1) : 0;
  const isPositive = totalProfit >= 0;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("nav.dashboard")}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-text-muted hover:text-text-primary border border-border rounded-lg transition-colors hover:border-gold/40"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/vault/add")}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-hover text-white rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ boxShadow: "var(--shadow-gold)" }}
          >
            <Plus className="w-4 h-4" /> {t("vault.add_property") || "Add Property"}
          </button>
        </div>
      </div>

      {/* Portfolio Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          {
            label: t("vault.total_properties") || "Total Properties",
            icon: <Building2 className="w-5 h-5 text-text-muted" />,
            value: summary?.total_properties ?? vaultItems.length,
            valueClass: "text-text-primary",
            onClick: () => navigate("/vault"),
            extraClass: "hover:border-gold/40 cursor-pointer",
          },
          {
            label: t("vault.portfolio_value") || "Portfolio Value",
            icon: <IndianRupee className="w-5 h-5 text-gold" />,
            value: formatINR(portfolioValue),
            valueClass: "text-gold",
            extraClass: "border-gold/20",
            shadow: "var(--shadow-gold)",
          },
          {
            label: t("vault.total_profit") || "Total Profit",
            icon: isPositive ? <TrendingUp className="w-5 h-5 text-profit-green" /> : <TrendingDown className="w-5 h-5 text-profit-red" />,
            value: `${isPositive ? "+" : ""}${formatINR(totalProfit)}`,
            valueClass: isPositive ? "text-profit-green" : "text-profit-red",
            bgClass: isPositive ? "gradient-profit-green" : "gradient-profit-red",
          },
          {
            label: t("vault.needs_attention") || "Needs Attention",
            icon: <AlertTriangle className="w-5 h-5 text-risk-orange" />,
            value: attentionCount,
            valueClass: "text-text-primary",
            onClick: () => navigate("/vault"),
            extraClass: "hover:border-risk-orange/40 cursor-pointer",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={card.onClick}
            className={`bg-bg-card rounded-2xl p-5 border border-border transition-all hover:-translate-y-0.5 ${card.bgClass || ""} ${card.extraClass || ""}`}
            style={{ boxShadow: card.shadow || "var(--shadow-stat)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">{card.label}</span>
              {card.icon}
            </div>
            <p className={`text-2xl md:text-3xl font-bold font-mono ${card.valueClass}`}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Overall Appreciation Bar */}
      {portfolioValue > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl px-5 py-3 mb-8 text-sm font-semibold flex items-center gap-2 border ${
            isPositive
              ? "gradient-profit-green text-profit-green border-profit-green/20"
              : "gradient-profit-red text-profit-red border-profit-red/20"
          }`}
        >
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {t("dashboard.portfolio_appreciation") || "Overall Portfolio Appreciation"}: {isPositive ? "▲" : "▼"} {Math.abs(appreciationPct)}%
        </motion.div>
      )}

      {/* Recent Vault Items (top 6) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{t("dashboard.your_vault")}</h2>
          {vaultItems.length > 0 && (
            <button
              onClick={() => navigate("/vault")}
              className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
            >
              {t("dashboard.view_all") || "View all"} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {vaultItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-text-muted bg-bg-card rounded-2xl border border-border"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <FolderLock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{t("dashboard.no_vault_items")}</p>
            <p className="text-sm mt-1">{t("dashboard.no_vault_subtitle")}</p>
            <button
              onClick={() => navigate("/vault/add")}
              className="mt-4 px-4 py-2 bg-gold hover:bg-gold-hover text-white rounded-lg text-sm font-medium transition-all active:scale-95"
              style={{ boxShadow: "var(--shadow-gold)" }}
            >
              {t("vault.add_property") || "Add Property"}
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultItems.slice(0, 6).map((item, i) => (
              <VaultCard key={item.vault_id} item={item} index={i} />
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
                onClick={() => navigate("/history")}
                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                {t("dashboard.view_all") || "View all"} <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {submissions.slice(0, 5).map((s, i) => (
              <motion.div
                key={s.submission_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between bg-bg-card rounded-xl px-5 py-3.5 border border-border border-l-4 border-l-accent/40 hover:border-l-accent cursor-pointer transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-card)" }}
                onClick={() => s.submission_status === "completed" && navigate(`/vault/${subToVault[s.submission_id] || s.submission_id}`)}
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
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
