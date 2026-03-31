import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trash2, LayoutList, FileText, TrendingUp, Clock, ShieldCheck, Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getVaultItem, getSubmission, deleteVaultItem } from "../lib/api";
import { useT } from "../lib/i18n";
import { getRiskColor } from "../lib/riskColors";
import AppLayout from "../components/AppLayout";
import RiskScoreGauge from "../components/RiskScoreGauge";
import RiskBreakdownChart from "../components/RiskBreakdownChart";
import ChecklistItem from "../components/ChecklistItem";
import PropertyOverviewTab from "../components/PropertyOverviewTab";
import PropertyDocumentsTab from "../components/PropertyDocumentsTab";
import PropertyValuationTab from "../components/PropertyValuationTab";
import PropertyHistoryTab from "../components/PropertyHistoryTab";

const TABS = [
  { key: "overview", labelKey: "vault.overview", Icon: LayoutList },
  { key: "documents", labelKey: "vault.documents", Icon: FileText },
  { key: "valuation", labelKey: "vault.valuation", Icon: TrendingUp },
  { key: "history", labelKey: "vault.history_tab", Icon: Clock },
  { key: "verification", labelKey: "vault.verification", Icon: ShieldCheck },
];

const formatINR = (val) => {
  if (!val) return "—";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function VaultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: vault, isLoading } = useQuery({
    queryKey: ["vault", id],
    queryFn: () => getVaultItem(id).then((r) => r.data),
  });

  const { data: submission } = useQuery({
    queryKey: ["submission", vault?.submission_id],
    queryFn: () => getSubmission(vault.submission_id).then((r) => r.data),
    enabled: !!vault?.submission_id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVaultItem(id),
    onSuccess: () => {
      toast.success(t("vault.property_deleted") || "Property deleted");
      navigate("/dashboard");
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-muted">
            Loading...
          </motion.p>
        </div>
      </AppLayout>
    );
  }

  if (!vault) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-text-muted">{t("vault.not_found") || "Property not found."}</p>
        </div>
      </AppLayout>
    );
  }

  const name = vault.property_name || vault.vault_name || t("vault.untitled") || "Untitled Property";
  const location = [vault.village || vault.village_name, vault.district, vault.state]
    .filter(Boolean)
    .join(", ");
  const riskColor = getRiskColor(vault.risk_level);
  const currentValue = vault.current_market_value;
  const purchasePrice = vault.purchase_price;
  const profit = currentValue && purchasePrice ? currentValue - purchasePrice : null;

  const assessment = submission?.assessment;
  const extraction = submission?.extraction;

  return (
    <AppLayout>
      <div>
        {/* Back link */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/vault")}
          className="flex items-center gap-2 mb-6 transition-colors text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--color-teal)" }}
        >
          <ArrowLeft className="w-4 h-4" /> {t("vault.back_to_vault") || "Back to Vault"}
        </motion.button>

        {/* Property Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>{name}</h1>
              {location && (
                <p className="text-sm text-text-muted mt-1">{location}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {vault.risk_level && (
                <span
                  className="text-xs px-3 py-1.5 rounded-full font-mono font-medium"
                  style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
                >
                  {vault.risk_level} {vault.risk_level === "GREEN" ? (t("vault.verified_status") || "Verified") : ""}
                </span>
              )}
              {vault.submission_id && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/report/${vault.submission_id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Report link copied to clipboard!");
                  }}
                  className="p-2 text-text-muted hover:text-accent transition-colors"
                  title="Share report link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(t("vault.delete_confirm_msg") || "Delete this property? This cannot be undone."))
                    deleteMutation.mutate();
                }}
                className="p-2 text-text-muted hover:text-risk-red transition-colors"
                title="Delete property"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Value boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {[
              {
                label: t("vault.current_value") || "Current Value",
                value: currentValue ? formatINR(currentValue) : "—",
                valueClass: "text-gold",
                shadow: "var(--shadow-gold)",
                border: "border-gold/20",
              },
              {
                label: t("vault.purchased_at") || "Purchased At",
                value: purchasePrice ? formatINR(purchasePrice) : "—",
                valueClass: "text-text-primary",
              },
              {
                label: t("vault.profit_loss") || "Profit / Loss",
                value: profit !== null ? `${profit >= 0 ? "+" : ""}${formatINR(Math.abs(profit))}` : "—",
                valueClass: profit !== null ? (profit >= 0 ? "text-profit-green" : "text-profit-red") : "text-text-muted",
                bgClass: profit !== null ? (profit >= 0 ? "gradient-profit-green" : "gradient-profit-red") : "",
              },
            ].map((box, i) => (
              <motion.div
                key={box.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={`bg-bg-card rounded-xl p-4 border border-border text-center ${box.border || ""} ${box.bgClass || ""}`}
                style={{ boxShadow: box.shadow || "var(--shadow-stat)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>{box.label}</p>
                <p className={`text-xl font-bold ${box.valueClass}`} style={{ fontFamily: "var(--font-serif)" }}>
                  {box.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-0 mb-6 border-b overflow-x-auto" style={{ borderColor: "var(--color-border)" }}>
          {TABS.map(({ key, labelKey, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="relative flex items-center gap-1.5 px-5 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors"
              style={{ color: activeTab === key ? "var(--color-gold)" : "var(--color-text-muted)" }}
            >
              {activeTab === key && (
                <motion.div
                  layoutId="vault-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: "var(--color-gold)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{t(labelKey) || key}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && <PropertyOverviewTab vault={vault} />}

            {activeTab === "documents" && <PropertyDocumentsTab vault={vault} />}

            {activeTab === "valuation" && <PropertyValuationTab vault={vault} />}

            {activeTab === "history" && <PropertyHistoryTab vault={vault} />}

            {activeTab === "verification" && (
              <div>
                {assessment ? (
                  <>
                    {/* Risk recommendation banner */}
                    <div
                      className="rounded-2xl p-4 text-center text-lg font-bold mb-6"
                      style={{ backgroundColor: `${riskColor}20`, color: riskColor, boxShadow: "var(--shadow-card)" }}
                    >
                      {assessment.recommendation}
                    </div>

                    <div className="flex justify-center mb-8">
                      <RiskScoreGauge
                        score={assessment.final_risk_score}
                        level={assessment.risk_level}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* Land details from extraction */}
                      <div className="bg-bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                        <h3 className="text-lg font-semibold mb-4">{t("vault.verification_details") || "Verification Details"}</h3>
                        <div className="space-y-3 text-sm">
                          {[
                            ["Owner", extraction?.owner_name],
                            ["Tribal Status", extraction?.tribal_status],
                            ["Last Mutation", extraction?.last_mutation_date],
                            ["Land Use", extraction?.land_use_type],
                            ["Mutation Type", extraction?.mutation_type],
                          ].map(([label, val]) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-text-muted">{label}</span>
                              <span className="font-mono">{val ?? "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <RiskBreakdownChart assessment={assessment} />
                    </div>

                    {/* CNT Compliance */}
                    {assessment.cnt_compliance && (
                      <div className="bg-bg-card rounded-2xl p-6 mb-6 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                        <h3 className="text-lg font-semibold mb-4">{t("vault.cnt_compliance_title") || "CNT Compliance"}</h3>
                        <div className="space-y-2 text-sm">
                          {Object.entries(assessment.cnt_compliance).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-text-muted capitalize">{key.replace(/_/g, " ")}</span>
                              <span className="font-mono">{typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checklist */}
                    {assessment.checklist && (
                      <div className="bg-bg-card rounded-2xl p-6 mb-6 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                        <h3 className="text-lg font-semibold mb-4">{t("vault.verification_checklist_title") || "Verification Checklist"}</h3>
                        {Object.entries(assessment.checklist).map(([key, val]) => (
                          <ChecklistItem
                            key={key}
                            label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            status={val ? "pass" : "fail"}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-bg-card rounded-2xl p-10 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                    <ShieldCheck className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
                    <p className="text-lg font-medium text-text-primary mb-2">
                      {t("vault.not_verified") || "This property has not been verified yet"}
                    </p>
                    <p className="text-sm text-text-muted mb-6">
                      {t("vault.not_verified_desc") || "Verification checks CNT compliance, forest zones, mutation history, and generates a risk score."}
                    </p>
                    <button
                      onClick={() => navigate("/verify")}
                      className="px-6 py-3 bg-gold hover:bg-gold-hover text-white rounded-xl font-medium transition-all active:scale-95"
                      style={{ boxShadow: "var(--shadow-gold)" }}
                    >
                      {t("vault.verify_this") || "Verify This Property"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
