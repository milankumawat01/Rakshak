import { useState } from "react";
import { confidenceBg } from "../lib/riskColors";

const FIELDS = [
  { key: "plot_number", label: "Plot Number", confKey: "plot_confidence" },
  { key: "khata_number", label: "Khata Number", confKey: "khata_confidence" },
  { key: "area_bigha", label: "Area (Bigha)", confKey: "area_confidence" },
  { key: "owner_name", label: "Owner Name", confKey: "owner_confidence" },
  { key: "tribal_status", label: "Tribal Status", confKey: "tribal_confidence" },
  { key: "last_mutation_date", label: "Last Mutation Date", confKey: "mutation_confidence" },
];

export default function OCRResultTable({ extraction, onEdit }) {
  const [edits, setEdits] = useState({});

  const handleChange = (key, value) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const getValue = (key) =>
    edits[key] !== undefined ? edits[key] : (extraction?.[key] ?? "—");

  return (
    <div className="bg-bg-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Extracted Data</h3>
      <div className="space-y-3">
        {FIELDS.map(({ key, label, confKey }) => {
          const conf = extraction?.[confKey] ?? 0;
          return (
            <div key={key} className="flex items-center gap-4">
              <span className="w-40 text-sm text-text-muted shrink-0">{label}</span>
              <input
                className="flex-1 bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-text-primary focus:border-accent focus:outline-none"
                value={getValue(key)}
                onChange={(e) => handleChange(key, e.target.value)}
              />
              <span
                className={`text-xs px-2 py-1 rounded-full font-mono shrink-0 ${confidenceBg(conf)}`}
              >
                {(conf * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onEdit?.(edits)}
          className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          Looks Good
        </button>
        <button
          onClick={() => setEdits({})}
          className="px-6 py-2 bg-bg-base border border-slate-700 text-text-muted rounded-lg text-sm hover:text-text-primary transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
