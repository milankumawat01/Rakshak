import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FolderLock, Plus } from "lucide-react";
import { listVaultItems, getVaultSummary } from "../lib/api";
import { useT } from "../lib/i18n";
import VaultCard from "../components/VaultCard";
import AppLayout from "../components/AppLayout";

const formatINR = (val) => {
  if (!val) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function Vault() {
  const navigate = useNavigate();
  const { t } = useT();

  const { data: vaultItems = [] } = useQuery({
    queryKey: ["vault"],
    queryFn: () => listVaultItems().then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ["vault-summary"],
    queryFn: () => getVaultSummary().then((r) => r.data),
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("dashboard.your_vault")}</h1>
        <button
          onClick={() => navigate("/vault/add")}
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-hover text-white rounded-lg text-sm font-medium transition-all active:scale-95"
          style={{ boxShadow: "var(--shadow-gold)" }}
        >
          <Plus className="w-4 h-4" /> {t("vault.add_property") || "Add Property"}
        </button>
      </div>

      {/* Portfolio Summary Strip */}
      {summary && summary.total_properties > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: t("vault.total_properties") || "Properties", value: summary.total_properties, cls: "" },
            { label: t("vault.portfolio_value") || "Value", value: formatINR(summary.portfolio_value), cls: "text-gold" },
            { label: t("vault.total_profit") || "Profit", value: `${summary.total_profit >= 0 ? "+" : ""}${formatINR(summary.total_profit)}`, cls: summary.total_profit >= 0 ? "text-profit-green" : "text-profit-red" },
            { label: t("vault.needs_attention") || "Attention", value: summary.attention_count, cls: "text-risk-orange" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-bg-card rounded-xl p-4 border border-border"
              style={{ boxShadow: "var(--shadow-stat)" }}
            >
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-xl font-bold font-mono ${s.cls}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {vaultItems.length === 0 ? (
        <div className="text-center py-20 text-text-muted bg-bg-card rounded-2xl border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <FolderLock className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{t("dashboard.no_vault_items")}</p>
          <p className="text-sm mt-1">{t("dashboard.no_vault_subtitle")}</p>
          <button
            onClick={() => navigate("/vault/add")}
            className="mt-4 px-4 py-2 bg-gold hover:bg-gold-hover text-white rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ boxShadow: "var(--shadow-gold)" }}
          >
            {t("vault.add_property") || "Add Property"}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaultItems.map((item, i) => (
            <VaultCard key={item.vault_id} item={item} index={i} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
