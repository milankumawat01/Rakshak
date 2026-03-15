export const RISK_COLORS = {
  GREEN: "#10B981",
  YELLOW: "#F59E0B",
  ORANGE: "#F97316",
  RED: "#EF4444",
};

export const RISK_LABELS = {
  GREEN: "LOW RISK",
  YELLOW: "MODERATE",
  ORANGE: "HIGH RISK",
  RED: "REJECT",
};

export function getRiskColor(level) {
  return RISK_COLORS[level] || RISK_COLORS.YELLOW;
}

export function confidenceColor(conf) {
  if (conf >= 0.85) return "text-risk-green";
  if (conf >= 0.6) return "text-risk-yellow";
  return "text-risk-red";
}

export function confidenceBg(conf) {
  if (conf >= 0.85) return "bg-risk-green/20 text-risk-green";
  if (conf >= 0.6) return "bg-risk-yellow/20 text-risk-yellow";
  return "bg-risk-red/20 text-risk-red";
}
