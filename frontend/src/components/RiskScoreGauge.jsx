import { motion } from "framer-motion";
import { getRiskColor, RISK_LABELS } from "../lib/riskColors";
import { useT } from "../lib/i18n";

const CNT_COLORS = {
  PASS: "#22c55e",
  FAIL: "#ef4444",
  NEEDS_REVIEW: "#eab308",
};

export default function RiskScoreGauge({ score = 0, level = "GREEN", cntCompliance }) {
  const { t } = useT();
  const color = getRiskColor(level);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = score / 100;
  const offset = circumference * (1 - fillPercent);

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 20px ${color}44)` }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle
            cx="110" cy="110" r={radius}
            fill="none" stroke="#E5E0DB" strokeWidth="12"
          />
          <motion.circle
            cx="110" cy="110" r={radius}
            fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            transform="rotate(-90 110 110)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold font-mono"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-sm text-text-muted mt-1">{t("verify.risk_score")}</span>
        </div>
      </div>
      <div
        className="mt-4 px-6 py-2 rounded-full text-sm font-semibold"
        style={{
          backgroundColor: `${color}20`,
          color,
        }}
      >
        {level} — {RISK_LABELS[level] || level}
      </div>
      {cntCompliance && (
        <div
          className="mt-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${CNT_COLORS[cntCompliance.cnt_status] || "#64748b"}20`,
            color: CNT_COLORS[cntCompliance.cnt_status] || "#64748b",
          }}
        >
          CNT: {cntCompliance.cnt_status === "PASS" ? t("verify.cnt_pass") : cntCompliance.cnt_status === "FAIL" ? t("verify.cnt_fail") : t("verify.cnt_review")}
        </div>
      )}
    </div>
  );
}
