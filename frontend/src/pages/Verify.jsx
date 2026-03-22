import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Upload, ArrowLeft, ArrowRight, Shield, AlertTriangle,
  CheckCircle, XCircle, Database,
} from "lucide-react";
import { uploadSubmission, createVaultItem, updateExtraction } from "../lib/api";
import { useT } from "../lib/i18n";
import ProcessingScreen from "../components/ProcessingScreen";
import OCRResultTable from "../components/OCRResultTable";
import RiskScoreGauge from "../components/RiskScoreGauge";
import RiskBreakdownChart from "../components/RiskBreakdownChart";
import ChecklistItem from "../components/ChecklistItem";
import VanshavaliTree from "../components/VanshavaliTree";
import LandHealthCertificate from "../components/LandHealthCertificate";
import AppLayout from "../components/AppLayout";
import { getRiskColor } from "../lib/riskColors";

// Named step constants
const STEP_UPLOAD = 0;
const STEP_STORE = 1;
const STEP_OCR = 2;
const STEP_VERIFY = 3;
const STEP_SCORE = 4;
const STEP_REPORT = 5;

export default function Verify() {
  const navigate = useNavigate();
  const { t } = useT();
  const [step, setStep] = useState(STEP_UPLOAD);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [details, setDetails] = useState({
    village_name: "",
    plot_number: "",
    seller_name: "",
    buyer_tribal: false,
  });
  const [submissionId, setSubmissionId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const printRef = useRef(null);

  const stepLabels = t("verify.steps");

  // Upload handler
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png"], "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  // Submit: Upload + Details combined, then go to Store step
  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("village_name", details.village_name);
      formData.append("plot_number", details.plot_number);
      formData.append("seller_name", details.seller_name);
      formData.append("buyer_tribal", details.buyer_tribal);
      const { data } = await uploadSubmission(formData);
      setSubmissionId(data.submission_id);
      setStep(STEP_STORE);
    } catch (err) {
      toast.error(t("verify.upload_failed") + ": " + (err.response?.data?.detail || "Unknown error"));
    }
    setLoading(false);
  };

  // Processing complete -> Verify step
  const handleProcessingComplete = (data) => {
    setResult(data);
    setStep(STEP_VERIFY);
  };

  // OCR confirmed -> Score step
  const handleOCRConfirm = async (edits) => {
    if (edits && Object.keys(edits).length > 0) {
      const cleaned = {};
      for (const [k, v] of Object.entries(edits)) {
        if (v !== "—") cleaned[k] = v;
      }
      if (Object.keys(cleaned).length > 0) {
        setLoading(true);
        try {
          const { data } = await updateExtraction(submissionId, cleaned);
          setResult(data);
        } catch {
          toast.error(t("verify.update_failed"));
        }
        setLoading(false);
      }
    }
    setStep(STEP_SCORE);
  };

  // Download PDF via print
  const handleDownloadPDF = () => {
    const printContainer = document.getElementById("print-container");
    if (printContainer) {
      printContainer.style.display = "block";
      const cleanup = () => {
        printContainer.style.display = "none";
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
      setTimeout(() => window.print(), 100);
    }
  };

  // Save to vault
  const handleSaveVault = async () => {
    try {
      await createVaultItem({
        submission_id: submissionId,
        vault_name: `${details.village_name} - Plot ${details.plot_number}`,
        notes: "",
        tags: [],
        share_permission: "private",
      });
      toast.success(t("verify.saved_vault"));
    } catch {
      toast.error(t("verify.save_failed"));
    }
  };

  const assessment = result?.assessment;
  const extraction = result?.extraction;
  const riskColor = getRiskColor(assessment?.risk_level);

  return (
    <AppLayout>
      {/* Step indicator */}
      <div className="hidden lg:flex items-center gap-2 mb-8">
          {(Array.isArray(stepLabels) ? stepLabels : []).map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  i <= step
                    ? "bg-accent text-white"
                    : "bg-bg-input text-text-muted border border-border"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${i <= step ? "text-text-primary" : "text-text-muted"}`}>
                {label}
              </span>
              {i < 5 && (
                <div className={`w-6 h-px ${i < step ? "bg-accent" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div>
        {/* Step 0: Upload + Details combined */}
        {step === STEP_UPLOAD && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary">{t("verify.upload_title")}</h2>
            <p className="text-text-muted mb-8">{t("verify.upload_subtitle")}</p>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="space-y-4">
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <p className="text-sm text-text-muted">{file?.name}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-text-primary font-medium">{t("verify.drag_drop")}</p>
                  <p className="text-sm text-text-muted mt-1">{t("verify.file_formats")}</p>
                </>
              )}
            </div>

            {/* Details fields below dropzone */}
            <div className="mt-8 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm text-text-muted block mb-1.5">{t("verify.village_name")}</label>
                  <input
                    value={details.village_name}
                    onChange={(e) => setDetails({ ...details, village_name: e.target.value })}
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                    placeholder={t("verify.village_placeholder")}
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1.5">{t("verify.plot_number")}</label>
                  <input
                    value={details.plot_number}
                    onChange={(e) => setDetails({ ...details, plot_number: e.target.value })}
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-accent focus:outline-none text-text-primary"
                    placeholder={t("verify.plot_placeholder")}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1.5">{t("verify.seller_name")}</label>
                <input
                  value={details.seller_name}
                  onChange={(e) => setDetails({ ...details, seller_name: e.target.value })}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                  placeholder={t("verify.seller_placeholder")}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetails({ ...details, buyer_tribal: !details.buyer_tribal })}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    details.buyer_tribal ? "bg-accent" : "bg-border"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${
                      details.buyer_tribal ? "left-6" : "left-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-text-primary">{t("verify.buyer_tribal")}</span>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-6 py-3 text-text-muted hover:text-text-primary transition-colors min-h-12"
              >
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium disabled:opacity-30 transition-colors min-h-12"
              >
                {loading ? t("common.submitting") : t("common.start_analysis")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Store confirmation */}
        {step === STEP_STORE && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 bg-risk-green/10 rounded-full flex items-center justify-center mb-6">
              <Database className="w-8 h-8 text-risk-green" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary">{t("verify.store_title")}</h2>
            <p className="text-text-muted mb-8">{t("verify.store_subtitle")}</p>

            <div className="bg-bg-card rounded-2xl p-6 border border-border w-full max-w-sm text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("verify.store_village")}</span>
                <span className="font-mono text-text-primary">{details.village_name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("verify.store_plot")}</span>
                <span className="font-mono text-text-primary">{details.plot_number || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("verify.store_file")}</span>
                <span className="font-mono text-text-primary truncate max-w-[180px]">{file?.name || "—"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => setStep(STEP_UPLOAD)}
                className="flex items-center gap-2 px-6 py-3 text-text-muted hover:text-text-primary transition-colors min-h-12"
              >
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <button
                onClick={() => setStep(STEP_OCR)}
                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors min-h-12"
              >
                {t("verify.continue")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OCR Extract (Processing) */}
        {step === STEP_OCR && (
          <div>
            <button
              onClick={() => setStep(STEP_STORE)}
              className="flex items-center gap-2 mb-4 px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t("common.back")}
            </button>
            <ProcessingScreen
              submissionId={submissionId}
              onComplete={handleProcessingComplete}
            />
          </div>
        )}

        {/* Step 3: Verify (OCR Review) */}
        {step === STEP_VERIFY && (
          <div>
            <button
              onClick={() => setStep(STEP_OCR)}
              className="flex items-center gap-2 mb-4 px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t("common.back")}
            </button>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-text-primary">{t("verify.review_title")}</h2>
              <button
                onClick={() => setShowDoc((v) => !v)}
                className="px-4 py-2 bg-bg-card border border-border text-text-muted hover:text-text-primary rounded-lg text-sm transition-colors"
              >
                {showDoc ? t("verify.hide_document") : t("verify.show_document")}
              </button>
            </div>
            <p className="text-text-muted mb-8">{t("verify.review_subtitle")}</p>
            <div className={showDoc ? "grid grid-cols-2 gap-6" : ""}>
              <div className="min-w-0">
                <OCRResultTable extraction={extraction} onEdit={handleOCRConfirm} loading={loading} />
              </div>
              {showDoc && preview && (
                <div className="min-w-0">
                  <div className="bg-bg-card rounded-2xl p-4 sticky top-20 h-[calc(100vh-120px)] flex flex-col border border-border">
                    <h3 className="text-sm font-semibold text-text-muted mb-3 shrink-0">{t("verify.uploaded_document")}</h3>
                    {file?.type === "application/pdf" ? (
                      <iframe src={preview} className="w-full flex-1 rounded-lg border border-border" />
                    ) : (
                      <img src={preview} alt="Document" className="w-full flex-1 object-contain rounded-lg border border-border" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Score */}
        {step === STEP_SCORE && assessment && (
          <div>
            <button
              onClick={() => setStep(STEP_VERIFY)}
              className="flex items-center gap-2 mb-4 px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t("common.back")}
            </button>
            <h2 className="text-2xl font-bold mb-2 text-center text-text-primary">{t("verify.score_title")}</h2>
            <p className="text-text-muted mb-8 text-center">{t("verify.score_subtitle")}</p>

            <div className="flex justify-center mb-10">
              <RiskScoreGauge
                score={assessment.final_risk_score}
                level={assessment.risk_level}
                cntCompliance={assessment.cnt_compliance}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Extracted Data Summary */}
              <div className="bg-bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">{t("verify.extracted_data")}</h3>
                <div className="space-y-3 text-sm">
                  {[
                    [t("ocr.plot_number"), extraction?.plot_number],
                    [t("ocr.khata_number"), extraction?.khata_number],
                    [t("ocr.area_bigha"), extraction?.area_bigha],
                    [t("ocr.owner_name"), extraction?.owner_name],
                    [t("ocr.surname"), extraction?.surname],
                    [t("ocr.tribal_status"), extraction?.tribal_status],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-text-muted">{label}</span>
                      <span className="font-mono">{val ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <RiskBreakdownChart assessment={assessment} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors min-h-12"
              >
                {t("verify.view_full_report")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Full Report */}
        {step === STEP_REPORT && assessment && (
          <div>
            <button
              onClick={() => setStep(STEP_SCORE)}
              className="flex items-center gap-2 mb-4 px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t("common.back")}
            </button>
            {/* Recommendation Banner */}
            <div
              className="rounded-2xl p-4 text-center text-lg font-bold mb-8"
              style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
            >
              {t("verify.report_recommendation")}: {assessment.recommendation}
            </div>

            {/* Gauge */}
            <div className="flex justify-center mb-10">
              <RiskScoreGauge
                score={assessment.final_risk_score}
                level={assessment.risk_level}
                cntCompliance={assessment.cnt_compliance}
              />
            </div>

            {/* CNT Compliance Card */}
            {assessment.cnt_compliance && (
              <div
                className={`rounded-2xl p-6 mb-8 border ${
                  assessment.cnt_compliance.cnt_status === "PASS"
                    ? "bg-risk-green/5 border-risk-green/30"
                    : assessment.cnt_compliance.cnt_status === "FAIL"
                    ? "bg-risk-red/5 border-risk-red/30"
                    : "bg-risk-yellow/5 border-risk-yellow/30"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {assessment.cnt_compliance.cnt_status === "PASS" ? (
                    <CheckCircle className="w-6 h-6 text-risk-green" />
                  ) : assessment.cnt_compliance.cnt_status === "FAIL" ? (
                    <XCircle className="w-6 h-6 text-risk-red" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-risk-yellow" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {t("verify.cnt_compliance")}: {assessment.cnt_compliance.cnt_status}
                  </h3>
                </div>
                <p className="text-sm text-text-muted mb-4">{assessment.cnt_compliance.reason}</p>
                {assessment.cnt_compliance.who_can_buy?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">{t("verify.who_can_buy")}:</p>
                    <ul className="text-sm text-text-muted space-y-1">
                      {assessment.cnt_compliance.who_can_buy.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.cnt_compliance.permissions_needed?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">{t("verify.permissions_needed")}:</p>
                    <ul className="text-sm text-text-muted space-y-1">
                      {assessment.cnt_compliance.permissions_needed.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-risk-yellow mt-0.5">!</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Two columns */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">{t("verify.extracted_data")}</h3>
                <div className="space-y-3 text-sm">
                  {[
                    [t("ocr.plot_number"), extraction?.plot_number],
                    [t("ocr.khata_number"), extraction?.khata_number],
                    [t("ocr.area_bigha"), extraction?.area_bigha],
                    [t("ocr.owner_name"), extraction?.owner_name],
                    [t("ocr.surname"), extraction?.surname],
                    [t("ocr.tribal_status"), extraction?.tribal_status],
                    [t("ocr.land_use_type"), extraction?.land_use_type],
                    [t("ocr.mutation_type"), extraction?.mutation_type],
                    [t("ocr.last_mutation_date"), extraction?.last_mutation_date],
                    [t("ocr.first_registration_date"), extraction?.first_registration_date],
                    [t("ocr.dc_permission_ref"), extraction?.dc_permission_ref],
                    [t("ocr.poa_count"), extraction?.poa_count],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-text-muted">{label}</span>
                      <span className="font-mono">{val ?? "—"}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-text-muted">{t("verify.confidence")}</span>
                    <span className="font-mono">
                      {((extraction?.overall_confidence ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <RiskBreakdownChart assessment={assessment} />
            </div>

            {/* Vanshavali */}
            <div className="mb-8">
              <VanshavaliTree vanshavali={extraction?.vanshavali} />
            </div>

            {/* Checklist */}
            <div className="bg-bg-card rounded-2xl p-6 mb-8 border border-border">
              <h3 className="text-lg font-semibold mb-4">{t("verify.verification_checklist")}</h3>
              {assessment.checklist && Object.entries(assessment.checklist).map(([key, val]) => (
                <ChecklistItem
                  key={key}
                  label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  status={val ? "pass" : "fail"}
                  description={val ? t("verify.verified") : t("verify.requires_attention")}
                />
              ))}
            </div>

            {/* Discrepancy Warnings */}
            {assessment.discrepancies?.length > 0 && (
              <div className="bg-risk-yellow/10 border border-risk-yellow/30 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-risk-yellow mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {t("verify.data_discrepancies")}
                </h3>
                <ul className="space-y-2">
                  {assessment.discrepancies.map((d, i) => (
                    <li key={i} className="text-sm text-risk-yellow/80">
                      <span className="font-medium">{d.field}:</span> OCR found "{d.ocr_value}" but you entered "{d.user_value}" (match: {(d.match_score * 100).toFixed(0)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flags */}
            {assessment.flags?.length > 0 && (
              <div className="bg-risk-red/10 border border-risk-red/30 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-risk-red mb-3">{t("verify.flags")}</h3>
                <ul className="space-y-2">
                  {assessment.flags.map((f, i) => (
                    <li key={i} className="text-sm text-risk-red/80">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-risk-green hover:bg-risk-green/80 text-white rounded-xl font-medium transition-colors min-h-12"
              >
                {t("common.download_pdf")}
              </button>
              <button
                onClick={handleSaveVault}
                className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors min-h-12"
              >
                {t("common.save_to_vault")}
              </button>
              <button
                onClick={() => navigate("/verify")}
                className="px-6 py-3 bg-bg-card border border-border text-text-primary rounded-xl font-medium hover:border-accent/50 transition-colors min-h-12"
                onClickCapture={() => window.location.reload()}
              >
                {t("common.verify_another")}
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 bg-bg-card border border-border text-text-muted rounded-xl font-medium hover:text-text-primary transition-colors min-h-12"
              >
                {t("common.dashboard")}
              </button>
            </div>
          </div>
        )}
      </div>

        {/* Mock Payment Modal */}
        {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-2xl w-full max-w-md border border-border shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-accent px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Rakshak</span>
              </div>
              <span className="text-white/80 text-sm">Secure Payment</span>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-1">Unlock Full Report</h3>
              <p className="text-sm text-text-muted mb-6">Land Verification Report — {details.village_name || "—"}, Plot #{details.plot_number || "—"}</p>

              {/* Price breakdown */}
              <div className="bg-bg-input rounded-xl p-4 mb-6 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Report Price</span>
                  <span className="font-mono line-through text-text-muted">₹499</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Demo Discount</span>
                  <span className="font-mono text-risk-green">-₹499</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold text-text-primary">Total</span>
                  <span className="font-mono font-bold text-risk-green text-lg">₹0</span>
                </div>
              </div>

              {/* Mock card input */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Card Number</label>
                  <input
                    type="text"
                    value="4242 4242 4242 4242"
                    readOnly
                    className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Expiry</label>
                    <input
                      type="text"
                      value="12/28"
                      readOnly
                      className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text-muted"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">CVV</label>
                    <input
                      type="text"
                      value="***"
                      readOnly
                      className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text-muted"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-risk-green font-medium text-center mb-4 bg-risk-green/10 rounded-lg py-2">
                Demo Mode — Payment will be skipped automatically
              </p>

              {/* Buttons */}
              <button
                onClick={() => {
                  setPaymentProcessing(true);
                  setTimeout(() => {
                    setPaymentProcessing(false);
                    setShowPayment(false);
                    toast.success("Payment successful!");
                    setStep(STEP_REPORT);
                  }, 1500);
                }}
                disabled={paymentProcessing}
                className="w-full py-3 bg-risk-green hover:bg-risk-green/90 text-white rounded-xl font-semibold transition-colors disabled:opacity-70"
              >
                {paymentProcessing ? "Processing..." : "Pay ₹0 — View Report"}
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="w-full mt-2 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Hidden print container for PDF download */}
        <div id="print-container" style={{ display: "none" }}>
          <LandHealthCertificate
            ref={printRef}
            extraction={extraction}
            assessment={assessment}
            submissionId={submissionId}
          />
        </div>
    </AppLayout>
  );
}
