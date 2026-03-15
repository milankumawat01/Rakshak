import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const icons = {
  pass: { Icon: CheckCircle, color: "text-risk-green" },
  fail: { Icon: XCircle, color: "text-risk-red" },
  warn: { Icon: AlertTriangle, color: "text-risk-yellow" },
};

export default function ChecklistItem({ label, status = "pass", description }) {
  const { Icon, color } = icons[status] || icons.warn;

  return (
    <motion.div
      className="flex items-start gap-3 py-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} />
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
