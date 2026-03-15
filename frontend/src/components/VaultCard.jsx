import { useNavigate } from "react-router-dom";
import { MapPin, Eye } from "lucide-react";
import { getRiskColor } from "../lib/riskColors";

export default function VaultCard({ item }) {
  const navigate = useNavigate();
  const color = getRiskColor(item.risk_level);

  return (
    <div className="bg-bg-card rounded-2xl p-5 border border-slate-800 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-text-primary truncate">
          {item.vault_name || "Untitled Plot"}
        </h3>
        <span
          className="text-xs px-2 py-1 rounded-full font-mono font-medium shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {item.risk_level || "—"}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-text-muted mb-1">
        <MapPin className="w-3.5 h-3.5" />
        <span>{item.village_name || "—"}</span>
      </div>
      <p className="text-xs text-text-muted font-mono mb-4">
        Plot #{item.plot_number || "—"}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/vault/${item.vault_id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      </div>
    </div>
  );
}
