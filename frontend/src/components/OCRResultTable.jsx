import { useState } from "react";
import { confidenceBg } from "../lib/riskColors";
import { useT } from "../lib/i18n";

const FIELDS = [
  { key: "plot_number", label: "ocr.plot_number", confKey: "plot_confidence" },
  { key: "khata_number", label: "ocr.khata_number", confKey: "khata_confidence" },
  { key: "area_bigha", label: "ocr.area_bigha", confKey: "area_confidence" },
  { key: "owner_name", label: "ocr.owner_name", confKey: "owner_confidence" },
  { key: "surname", label: "ocr.surname", confKey: "surname_confidence" },
  { key: "tribal_status", label: "ocr.tribal_status", confKey: "tribal_confidence" },
  { key: "last_mutation_date", label: "ocr.last_mutation_date", confKey: "mutation_confidence" },
  { key: "first_registration_date", label: "ocr.first_registration_date", confKey: "first_reg_confidence" },
  {
    key: "land_use_type",
    label: "ocr.land_use_type",
    confKey: "land_use_confidence",
    type: "select",
    options: ["Agricultural", "Residential", "Forest", "Unknown"],
  },
  {
    key: "mutation_type",
    label: "ocr.mutation_type",
    confKey: "mutation_type_confidence",
    type: "select",
    options: ["Sale", "Gift", "Inheritance", "Partition", "Unknown"],
  },
  { key: "dc_permission_ref", label: "ocr.dc_permission_ref", confKey: null },
];

export default function OCRResultTable({ extraction, onEdit, loading }) {
  const { t } = useT();
  const [edits, setEdits] = useState({});

  const handleChange = (key, value) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const getValue = (key) =>
    edits[key] !== undefined ? edits[key] : (extraction?.[key] ?? "—");

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-4">{t("verify.extracted_data")}</h3>
      <div className="space-y-3">
        {FIELDS.map(({ key, label, confKey, type, options }) => {
          const conf = confKey ? (extraction?.[confKey] ?? 0) : null;
          return (
            <div key={key} className="flex items-center gap-4">
              <span className="w-44 text-sm text-text-muted shrink-0">{t(label)}</span>
              {type === "select" ? (
                <select
                  className="flex-1 bg-bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary focus:border-accent focus:outline-none"
                  value={getValue(key)}
                  onChange={(e) => handleChange(key, e.target.value)}
                >
                  <option value="—" disabled>—</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="flex-1 bg-bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary focus:border-accent focus:outline-none"
                  value={getValue(key)}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              )}
              {conf !== null && (
                <span
                  className={`text-xs px-2 py-1 rounded-full font-mono shrink-0 ${confidenceBg(conf)}`}
                >
                  {(conf * 100).toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onEdit?.(edits)}
          disabled={loading}
          className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? t("common.recalculating") : t("common.confirm_continue")}
        </button>
        <button
          onClick={() => setEdits({})}
          className="px-6 py-2 bg-bg-input border border-border text-text-muted rounded-lg text-sm hover:text-text-primary transition-colors"
        >
          {t("common.reset")}
        </button>
      </div>
    </div>
  );
}
