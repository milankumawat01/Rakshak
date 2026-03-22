import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft, ChevronDown, MapPin, Upload, X, Loader2,
} from "lucide-react";
import { createVaultItem, uploadVaultDocument } from "../lib/api";
import { useT } from "../lib/i18n";
import AppLayout from "../components/AppLayout";

const DOC_CATEGORIES = [
  { key: "registration", labelKey: "vault.doc_registration" },
  { key: "stamp", labelKey: "vault.doc_stamp" },
  { key: "mutation", labelKey: "vault.doc_mutation" },
  { key: "khatiyan", labelKey: "vault.doc_khatiyan" },
  { key: "map", labelKey: "vault.doc_map" },
  { key: "other", labelKey: "vault.doc_other" },
];

const DOC_FALLBACKS = {
  "vault.doc_registration": "Registration Paper (Sale Deed)",
  "vault.doc_stamp": "Stamp Paper",
  "vault.doc_mutation": "Mutation Paper",
  "vault.doc_khatiyan": "Khatiyan / Land Record",
  "vault.doc_map": "Map / Layout Plan",
  "vault.doc_other": "Other Documents",
};

export default function AddProperty() {
  const navigate = useNavigate();
  const { t } = useT();

  // Section collapse state
  const [openSections, setOpenSections] = useState({
    basic: true, purchase: true, documents: true,
  });
  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Form state
  const [form, setForm] = useState({
    property_name: "",
    plot_number: "",
    khata_number: "",
    area_value: "",
    area_unit: "bigha",
    land_type: "",
    village: "",
    block: "",
    district: "",
    state: "Jharkhand",
    pin_code: "",
    latitude: "",
    longitude: "",
    purchase_price: "",
    purchase_date: "",
    circle_rate_at_purchase: "",
    previous_owner: "",
    registration_date: "",
    stamp_duty_paid: "",
    mutation_status: "",
  });

  // Document files keyed by category
  const [docFiles, setDocFiles] = useState({});

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error(t("vault.gps_not_supported") || "Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success(t("vault.gps_captured") || "Location captured");
      },
      () => toast.error(t("vault.gps_failed") || "Could not get location")
    );
  };

  // Submit mutation
  const [submitting, setSubmitting] = useState(false);
  const createMutation = useMutation({
    mutationFn: (data) => createVaultItem(data),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.property_name.trim()) {
      toast.error(t("vault.name_required") || "Property name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Build payload — only send non-empty fields
      const payload = {};
      for (const [key, val] of Object.entries(form)) {
        if (val === "" || val === null || val === undefined) continue;
        if (["area_value", "purchase_price", "circle_rate_at_purchase", "stamp_duty_paid", "latitude", "longitude"].includes(key)) {
          payload[key] = parseFloat(val) || null;
        } else if (["purchase_date", "registration_date"].includes(key)) {
          payload[key] = val ? new Date(val).toISOString() : null;
        } else {
          payload[key] = val;
        }
      }

      const res = await createMutation.mutateAsync(payload);
      const vaultId = res.data.vault_id;

      // Upload documents
      const docEntries = Object.entries(docFiles);
      for (const [category, file] of docEntries) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", category);
        try {
          await uploadVaultDocument(vaultId, fd);
        } catch {
          toast.error(t("vault.upload_doc_failed") || `Failed to upload ${category} document`);
        }
      }

      toast.success(t("vault.property_added") || "Property added to vault!");
      navigate(`/vault/${vaultId}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("vault.create_failed") || "Failed to create property");
    } finally {
      setSubmitting(false);
    }
  };

  // Progress bar
  const filledSections = [
    form.property_name ? 1 : 0,
    form.purchase_price ? 1 : 0,
    Object.keys(docFiles).length > 0 ? 1 : 0,
  ];
  const filledCount = filledSections.reduce((a, b) => a + b, 0);
  const progressLabels = [
    t("vault.basic_info") || "Basic Info",
    t("vault.purchase_details") || "Purchase",
    t("vault.documents") || "Documents",
  ];

  const SectionHeader = ({ title, sectionKey }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-3 text-lg font-semibold text-text-primary"
    >
      {title}
      <motion.div
        animate={{ rotate: openSections[sectionKey] ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-5 h-5 text-text-muted" />
      </motion.div>
    </button>
  );

  const inputCls = `w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-gold focus:outline-none text-text-primary placeholder:text-text-muted/50 transition-colors ${submitting ? "opacity-50 cursor-not-allowed" : ""}`;

  const Input = ({ label, name, type = "text", required, placeholder, ...rest }) => (
    <div>
      <label className="text-sm text-text-muted block mb-1.5">
        {label} {required && <span className="text-risk-red">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        required={required}
        disabled={submitting}
        className={inputCls}
        {...rest}
      />
    </div>
  );

  const Select = ({ label, name, options, placeholder }) => (
    <div>
      <label className="text-sm text-text-muted block mb-1.5">{label}</label>
      <select
        value={form[name]}
        onChange={set(name)}
        disabled={submitting}
        className={inputCls}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/vault")}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t("vault.back_to_vault") || "Back to Vault"}
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-text-primary mb-4"
      >
        {t("vault.add_property") || "Add Property"}
      </motion.h1>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {progressLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              i < filledCount ? "bg-gold" : "bg-border"
            }`} />
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-2xl border border-border p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <SectionHeader title={t("vault.basic_info") || "Basic Information"} sectionKey="basic" />
          <AnimatePresence initial={false}>
            {openSections.basic && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <Input label={t("vault.property_name") || "Property Name"} name="property_name" required placeholder='e.g. "My Farm Ranchi"' />
                  </div>
                  <Input label={t("vault.plot_number") || "Plot Number"} name="plot_number" placeholder="e.g. 12345" />
                  <Input label={t("vault.khata_number") || "Khata Number"} name="khata_number" placeholder="e.g. 5678" />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input label={t("vault.area_value") || "Total Area"} name="area_value" type="number" step="0.01" placeholder="e.g. 2.5" />
                    </div>
                    <div className="w-32">
                      <Select
                        label={t("vault.area_unit") || "Unit"}
                        name="area_unit"
                        options={[
                          { value: "bigha", label: "Bigha" },
                          { value: "sqft", label: "Sq.ft" },
                          { value: "hectare", label: "Hectare" },
                          { value: "acre", label: "Acre" },
                        ]}
                      />
                    </div>
                  </div>
                  <Select
                    label={t("vault.land_type") || "Land Type"}
                    name="land_type"
                    placeholder="Select land type"
                    options={[
                      { value: "agricultural", label: "Agricultural" },
                      { value: "residential", label: "Residential" },
                      { value: "commercial", label: "Commercial" },
                      { value: "mixed", label: "Mixed" },
                    ]}
                  />
                  <Input label={t("vault.village") || "Village"} name="village" placeholder="Village name" />
                  <Input label={t("vault.block") || "Block"} name="block" placeholder="Block name" />
                  <Input label={t("vault.district") || "District"} name="district" placeholder="District" />
                  <Input label={t("vault.state") || "State"} name="state" placeholder="State" />
                  <Input label={t("vault.pin_code") || "Pin Code"} name="pin_code" placeholder="6-digit pin code" maxLength={6} />
                  <div className="md:col-span-2 flex gap-3 items-end">
                    <div className="flex-1">
                      <Input label={t("vault.latitude") || "Latitude"} name="latitude" type="number" step="any" placeholder="e.g. 23.3441" />
                    </div>
                    <div className="flex-1">
                      <Input label={t("vault.longitude") || "Longitude"} name="longitude" type="number" step="any" placeholder="e.g. 85.3096" />
                    </div>
                    <button
                      type="button"
                      onClick={handleGPS}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-3 bg-bg-input border border-border rounded-xl text-sm text-text-muted hover:text-text-primary hover:border-gold transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      <MapPin className="w-4 h-4" /> {t("vault.use_my_location") || "Use my location"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Purchase Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-bg-card rounded-2xl border border-border p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <SectionHeader title={t("vault.purchase_details") || "Purchase Details"} sectionKey="purchase" />
          <AnimatePresence initial={false}>
            {openSections.purchase && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <Input label={t("vault.purchase_price") || "Purchase Price (₹)"} name="purchase_price" type="number" placeholder="e.g. 2500000" />
                  <Input label={t("vault.purchase_date") || "Purchase Date"} name="purchase_date" type="date" />
                  <Input label={t("vault.circle_rate") || "Circle Rate at Purchase (₹)"} name="circle_rate_at_purchase" type="number" placeholder="₹ per unit" />
                  <Input label={t("vault.previous_owner") || "Previous Owner Name"} name="previous_owner" placeholder="Name of seller" />
                  <Input label={t("vault.registration_date") || "Registration Date"} name="registration_date" type="date" />
                  <Input label={t("vault.stamp_duty") || "Stamp Duty Paid (₹)"} name="stamp_duty_paid" type="number" placeholder="e.g. 175000" />
                  <Select
                    label={t("vault.mutation_status") || "Mutation Status"}
                    name="mutation_status"
                    placeholder="Select status"
                    options={[
                      { value: "complete", label: "Complete" },
                      { value: "pending", label: "Pending" },
                      { value: "not_started", label: "Not Started" },
                    ]}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-bg-card rounded-2xl border border-border p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <SectionHeader title={t("vault.documents") || "Documents"} sectionKey="documents" />
          <AnimatePresence initial={false}>
            {openSections.documents && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {DOC_CATEGORIES.map(({ key, labelKey }) => (
                    <DocUploadSlot
                      key={key}
                      category={key}
                      label={t(labelKey) || DOC_FALLBACKS[labelKey]}
                      file={docFiles[key]}
                      disabled={submitting}
                      t={t}
                      onFile={(file) =>
                        setDocFiles((prev) => {
                          if (file) return { ...prev, [key]: file };
                          const next = { ...prev };
                          delete next[key];
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gold hover:bg-gold-hover text-white rounded-2xl text-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ boxShadow: "var(--shadow-gold)" }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> {t("common.submitting") || "Saving..."}
            </>
          ) : (
            t("vault.save_to_vault") || "Save Property to Vault"
          )}
        </motion.button>
      </form>
      </div>
    </AppLayout>
  );
}

function DocUploadSlot({ category, label, file, onFile, disabled, t }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled,
  });

  if (file) {
    return (
      <div className="border border-border rounded-xl p-4 bg-bg-input">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        <div className="flex items-center justify-between">
          <div className="truncate flex-1 mr-2">
            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={() => onFile(null)}
            disabled={disabled}
            className="p-1.5 text-text-muted hover:text-risk-red transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-4 min-h-[120px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-gold bg-gold/5"
          : "border-border hover:border-gold/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-8 h-8 mx-auto text-text-muted/30 mb-1" />
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-xs text-text-muted/50 mt-0.5">{t("vault.tap_to_upload") || "Tap to upload"}</p>
    </div>
  );
}
