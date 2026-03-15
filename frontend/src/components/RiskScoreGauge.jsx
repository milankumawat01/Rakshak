import { motion } from "framer-motion";
import { getRiskColor, RISK_LABELS } from "../lib/riskColors";

export default function RiskScoreGauge({ score = 0, level = "GREEN" }) {
  const color = getRiskColor(level);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  // Score 0 = full circle (safe), 100 = empty (dangerous)
  // But visually we fill based on "how much risk" so fill = score%
  const fillPercent = score / 100;
  const offset = circumference * (1 - fillPercent);

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 40px ${color}88)` }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220">
          {/* Background ring */}
          <circle
            cx="110" cy="110" r={radius}
            fill="none" stroke="#334155" strokeWidth="12"
          />
          {/* Animated risk ring */}
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
        {/* Score number in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-bold font-mono"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-sm text-text-muted mt-1">Risk Score</span>
        </div>
      </div>
      {/* Badge */}
      <motion.div
        className="mt-4 px-6 py-2 rounded-full text-sm font-semibold"
        style={{
          backgroundColor: `${color}20`,
          color,
          boxShadow: `0 0 20px ${color}44`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        {level} — {RISK_LABELS[level] || level}
      </motion.div>
    </div>
  );
}
