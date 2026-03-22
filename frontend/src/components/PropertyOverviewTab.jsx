import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Pencil, Save, X } from "lucide-react";
import { updateVaultItem } from "../lib/api";
import { useT } from "../lib/i18n";

const formatINR = (val) => {
  if (!val) return "—";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function PropertyOverviewTab({ vault }) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    setForm({
      property_name: vault.property_name || vault.vault_name || "",
      plot_number: vault.plot_number || "",
      khata_number: vault.khata_number || "",
      area_value: vault.area_value || vault.area_bigha || "",
      area_unit: vault.area_unit || "bigha",
      land_type: vault.land_type || "",
      village: vault.village || vault.village_name || "",
      block: vault.block || "",
      district: vault.district || "",
      state: vault.state || "Jharkhand",
      pin_code: vault.pin_code || "",
      notes: vault.notes || "",
    });
    setEditing(true);
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: (data) => updateVaultItem(vault.vault_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["vault", vault.vault_id]);
      setEditing(false);
      toast.success(t("vault.property_updated") || "Property updated");
    },
    onError: () => toast.error(t("vault.update_failed") || "Update failed"),
  });

  const handleSave = () => {
    const payload = { ...form };
    if (payload.area_value) payload.area_value = parseFloat(payload.area_value) || null;
    saveMutation.mutate(payload);
  };

  const name = vault.property_name || vault.vault_name || t("vault.untitled") || "Untitled Property";
  const area = vault.area_value || vault.area_bigha;
  const unit = vault.area_unit || (vault.area_bigha ? "bigha" : "");
  const purchasePrice = vault.purchase_price;
  const currentValue = vault.current_market_value;
  const profit = currentValue && purchasePrice ? currentValue - purchasePrice : null;
  const appreciation =
    profit !== null && purchasePrice > 0
      ? ((profit / purchasePrice) * 100).toFixed(1)
      : null;

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card rounded-2xl p-6 border border-border"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t("vault.edit_property") || "Edit Property"}</h3>
          <button onClick={() => setEditing(false)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            [t("vault.property_name") || "Property Name", "property_name"],
            [t("vault.plot_number") || "Plot Number", "plot_number"],
            [t("vault.khata_number") || "Khata Number", "khata_number"],
            [t("vault.area_value") || "Area", "area_value", "number"],
            [t("vault.village") || "Village", "village"],
            [t("vault.block") || "Block", "block"],
            [t("vault.district") || "District", "district"],
            [t("vault.state") || "State", "state"],
            [t("vault.pin_code") || "Pin Code", "pin_code"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="text-sm text-text-muted block mb-1">{label}</label>
              <input
                type={type || "text"}
                value={form[key] || ""}
                onChange={set(key)}
                className="w-full bg-bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:border-gold focus:outline-none text-text-primary transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="text-sm text-text-muted block mb-1">{t("vault.land_type") || "Land Type"}</label>
            <select
              value={form.land_type}
              onChange={set("land_type")}
              className="w-full bg-bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:border-gold focus:outline-none text-text-primary transition-colors"
            >
              <option value="">Select...</option>
              <option value="agricultural">Agricultural</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-text-muted block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              className="w-full bg-bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:border-gold focus:outline-none text-text-primary resize-none transition-colors"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
          style={{ boxShadow: "var(--shadow-gold)" }}
        >
          <Save className="w-4 h-4" /> {t("vault.save_changes") || "Save Changes"}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-bg-card rounded-2xl p-6 border border-border"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{t("vault.basic_information") || "Basic Information"}</h3>
          <button
            onClick={startEdit}
            className="p-1.5 text-text-muted hover:text-gold transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3.5 text-sm">
          {[
            [t("vault.property_name") || "Property Name", name],
            [t("vault.plot_number") || "Plot Number", vault.plot_number],
            [t("vault.khata_number") || "Khata Number", vault.khata_number],
            [t("vault.total_area") || "Total Area", area ? `${area} ${unit ? unit.charAt(0).toUpperCase() + unit.slice(1) : ""}` : null],
            [t("vault.land_type") || "Land Type", vault.land_type ? vault.land_type.charAt(0).toUpperCase() + vault.land_type.slice(1) : null],
            [t("vault.location") || "Location", [vault.village || vault.village_name, vault.block, vault.district, vault.state].filter(Boolean).join(", ")],
            [t("vault.pin_code") || "Pin Code", vault.pin_code],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-text-muted">{label}</span>
              <span className="font-mono text-right">{val || "—"}</span>
            </div>
          ))}
          {vault.latitude && vault.longitude && (
            <div className="flex justify-between">
              <span className="text-text-muted">{t("vault.map") || "Map"}</span>
              <a
                href={`https://www.google.com/maps?q=${vault.latitude},${vault.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline text-sm"
              >
                View on Google Maps
              </a>
            </div>
          )}
          {vault.notes && (
            <div className="pt-2 border-t border-border">
              <span className="text-text-muted block mb-1">Notes</span>
              <p className="text-text-primary">{vault.notes}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Value Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-card rounded-2xl p-6 border border-border"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("vault.value_snapshot") || "Value Snapshot"}</h3>
        <div className="space-y-3.5 text-sm">
          {[
            [t("vault.purchase_price") || "Purchase Price", formatINR(purchasePrice)],
            [t("vault.purchase_date") || "Purchase Date", vault.purchase_date ? new Date(vault.purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"],
            [t("vault.circle_rate") || "Circle Rate (at purchase)", vault.circle_rate_at_purchase ? formatINR(vault.circle_rate_at_purchase) : "—"],
            [t("vault.current_circle_rate") || "Current Circle Rate", vault.current_circle_rate ? formatINR(vault.current_circle_rate) : "—"],
            [t("vault.current_market_value") || "Current Market Value", currentValue ? formatINR(currentValue) : "—"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-text-muted">{label}</span>
              <span className="font-mono">{val}</span>
            </div>
          ))}
          {appreciation !== null && (
            <>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("vault.appreciation") || "Appreciation"}</span>
                <span className={`font-mono font-medium ${profit >= 0 ? "text-profit-green" : "text-profit-red"}`}>
                  {profit >= 0 ? "+" : ""}{appreciation}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("vault.profit_amount") || "Profit Amount"}</span>
                <span className={`font-mono font-medium ${profit >= 0 ? "text-profit-green" : "text-profit-red"}`}>
                  {profit >= 0 ? "+" : ""}{formatINR(Math.abs(profit))}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
