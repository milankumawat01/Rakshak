import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown } from "lucide-react";
import { getRiskColor } from "../lib/riskColors";
import { useT } from "../lib/i18n";

const formatINR = (val) => {
  if (!val) return null;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function VaultCard({ item, index = 0 }) {
  const navigate = useNavigate();
  const { t } = useT();
  const riskColor = getRiskColor(item.risk_level);

  const name = item.property_name || item.vault_name || t("vault.untitled");
  const currentValue = item.current_market_value;
  const purchasePrice = item.purchase_price;
  const profit = currentValue && purchasePrice ? currentValue - purchasePrice : null;
  const appreciation =
    profit !== null && purchasePrice > 0
      ? ((profit / purchasePrice) * 100).toFixed(1)
      : null;
  const isProfit = profit !== null && profit >= 0;

  const area = item.area_value || item.area_bigha;
  const unit = item.area_unit || (item.area_bigha ? "bigha" : null);
  const location = [item.village || item.village_name, item.district]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={() => navigate(`/vault/${item.vault_id}`)}
      className="bg-bg-card rounded-2xl p-5 border border-border hover:border-gold cursor-pointer transition-shadow group gradient-gold-subtle"
      style={{ boxShadow: "var(--shadow-card)" }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
      onHoverEnd={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
    >
      {/* Header: name + risk badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-text-primary truncate pr-2 group-hover:text-gold transition-colors">{name}</h3>
        {item.risk_level && (
          <span
            className="text-xs px-2 py-1 rounded-full font-mono font-medium shrink-0"
            style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
          >
            {item.risk_level}
          </span>
        )}
      </div>

      {/* Current value */}
      <div className="mb-2">
        {currentValue ? (
          <p className="text-2xl font-bold font-mono text-text-primary">
            {formatINR(currentValue)}
          </p>
        ) : (
          <p className="text-lg font-medium text-text-muted">
            {t("vault.value_not_set") || "Value not set"}
          </p>
        )}
      </div>

      {/* Profit/Loss pill */}
      {profit !== null && (
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
              isProfit
                ? "bg-profit-green/10 text-profit-green"
                : "bg-profit-red/10 text-profit-red"
            }`}
          >
            {isProfit ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {isProfit ? "+" : ""}
            {formatINR(Math.abs(profit))} ({isProfit ? "+" : ""}
            {appreciation}%)
          </span>
        </div>
      )}

      {/* Quick stats */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted mb-2">
        {area && unit && (
          <span className="font-mono font-medium text-text-primary">
            {area} {unit.charAt(0).toUpperCase() + unit.slice(1)}
          </span>
        )}
        {item.land_type && (
          <span className="px-1.5 py-0.5 bg-gold/10 text-gold rounded-full capitalize text-[11px] font-medium">
            {item.land_type}
          </span>
        )}
      </div>

      {/* Location */}
      {location && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{location}</span>
        </div>
      )}
    </motion.div>
  );
}
