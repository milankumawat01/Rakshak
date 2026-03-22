import { motion } from "framer-motion";
import { CheckCircle, Clock, MinusCircle } from "lucide-react";
import { useT } from "../lib/i18n";

const formatINR = (val) => {
  if (!val) return "—";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

const MutationBadge = ({ status, t }) => {
  if (!status) return <span className="text-text-muted">—</span>;
  const config = {
    complete: { icon: CheckCircle, labelKey: "vault.mutation_complete", fallback: "Complete", cls: "text-profit-green bg-profit-green/10" },
    pending: { icon: Clock, labelKey: "vault.mutation_pending", fallback: "Pending", cls: "text-risk-yellow bg-risk-yellow/10" },
    not_started: { icon: MinusCircle, labelKey: "vault.mutation_not_started", fallback: "Not Started", cls: "text-text-muted bg-bg-input" },
  };
  const c = config[status] || config.not_started;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {t(c.labelKey) || c.fallback}
    </span>
  );
};

export default function PropertyHistoryTab({ vault }) {
  const { t } = useT();
  const hasData = vault.previous_owner || vault.registration_date || vault.mutation_status || vault.stamp_duty_paid;

  if (!hasData) {
    return (
      <div className="bg-bg-card rounded-2xl p-10 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-text-muted">{t("vault.no_history") || "No transaction history available. Add purchase details to see history."}</p>
      </div>
    );
  }

  const items = [
    vault.previous_owner && {
      label: t("vault.previous_owner_label") || "Previous Owner",
      value: vault.previous_owner,
    },
    vault.purchase_price && {
      label: t("vault.purchase_price") || "Purchase Price",
      value: formatINR(vault.purchase_price),
    },
    vault.purchase_date && {
      label: t("vault.purchase_date") || "Purchase Date",
      value: new Date(vault.purchase_date).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      }),
    },
    vault.registration_date && {
      label: t("vault.registration_date") || "Registration Date",
      value: new Date(vault.registration_date).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      }),
    },
    {
      label: t("vault.mutation_status") || "Mutation Status",
      custom: <MutationBadge status={vault.mutation_status} t={t} />,
    },
    vault.stamp_duty_paid && {
      label: t("vault.stamp_duty_paid_label") || "Stamp Duty Paid",
      value: formatINR(vault.stamp_duty_paid),
    },
    vault.circle_rate_at_purchase && {
      label: t("vault.circle_rate_at_purchase") || "Circle Rate at Purchase",
      value: formatINR(vault.circle_rate_at_purchase),
    },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card rounded-2xl p-6 border border-border"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h3 className="text-lg font-semibold text-text-primary mb-6">{t("vault.transaction_history") || "Transaction History"}</h3>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative mb-6 last:mb-0"
          >
            {/* Timeline dot */}
            <div className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-gold border-2 border-bg-card" style={{ boxShadow: "0 0 0 2px var(--color-border)" }} />

            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-text-muted">{item.label}</span>
              {item.custom || (
                <span className="text-sm font-mono text-text-primary">{item.value}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
