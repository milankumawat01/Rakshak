import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getVaultValuation } from "../lib/api";
import { useT } from "../lib/i18n";

const formatINR = (val) => {
  if (!val) return "—";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border rounded-xl px-4 py-3" style={{ boxShadow: "var(--shadow-card-hover)" }}>
      <p className="text-sm font-semibold text-text-primary">{d.year}</p>
      <p className="text-sm font-mono text-gold">{formatINR(d.estimated_value)}</p>
      {d.circle_rate && (
        <p className="text-xs text-text-muted">Circle Rate: {formatINR(d.circle_rate)}</p>
      )}
    </div>
  );
};

export default function PropertyValuationTab({ vault }) {
  const { t } = useT();
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["vault-valuation", vault.vault_id],
    queryFn: () => getVaultValuation(vault.vault_id).then((r) => r.data),
  });

  const purchasePrice = vault.purchase_price;
  const currentValue = vault.current_market_value;
  const profit = currentValue && purchasePrice ? currentValue - purchasePrice : null;

  if (!purchasePrice) {
    return (
      <div className="bg-bg-card rounded-2xl p-10 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-text-muted">{t("vault.no_purchase_price") || "No purchase price set. Add purchase details to see valuation chart."}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-bg-card rounded-2xl p-10 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-text-muted">{t("common.loading") || "Loading valuation data..."}</p>
      </div>
    );
  }

  const boxes = [
    {
      label: t("vault.bought_at") || "Bought At",
      value: formatINR(purchasePrice),
      valueClass: "text-text-primary",
      sub: vault.purchase_date
        ? new Date(vault.purchase_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        : null,
    },
    {
      label: t("vault.worth_now") || "Worth Now",
      value: currentValue ? formatINR(currentValue) : "—",
      valueClass: "text-profit-green",
      bgClass: "gradient-profit-green",
    },
    {
      label: t("vault.profit") || "Profit",
      value: profit !== null ? `${profit >= 0 ? "+" : ""}${formatINR(Math.abs(profit))}` : "—",
      valueClass: profit !== null ? (profit >= 0 ? "text-gold" : "text-profit-red") : "text-text-muted",
      shadow: profit !== null && profit >= 0 ? "var(--shadow-gold)" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card rounded-2xl p-6 border border-border"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("vault.property_value_over_time") || "Property Value Over Time"}</h3>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0DB" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "#666" }}
                axisLine={{ stroke: "#E5E0DB" }}
              />
              <YAxis
                tickFormatter={(v) => {
                  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
                  if (v >= 100000) return `${(v / 100000).toFixed(0)}L`;
                  return `${(v / 1000).toFixed(0)}K`;
                }}
                tick={{ fontSize: 12, fill: "#666" }}
                axisLine={{ stroke: "#E5E0DB" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="estimated_value"
                stroke="#D4A843"
                strokeWidth={3}
                dot={{ fill: "#D4A843", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#D4A843" }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-text-muted py-10">{t("vault.no_valuation_data") || "No valuation history available."}</p>
        )}
      </motion.div>

      {/* Comparison Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {boxes.map((box, i) => (
          <motion.div
            key={box.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`bg-bg-card rounded-2xl p-5 border border-border text-center ${box.bgClass || ""}`}
            style={{ boxShadow: box.shadow || "var(--shadow-stat)" }}
          >
            <p className="text-sm text-text-muted mb-1">{box.label}</p>
            <p className={`text-2xl font-bold font-mono ${box.valueClass}`}>{box.value}</p>
            {box.sub && (
              <p className="text-xs text-text-muted mt-1">{box.sub}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
