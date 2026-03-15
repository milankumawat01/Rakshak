import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Upload, FileText, ArrowLeft, ArrowRight, Shield
} from "lucide-react";
import { uploadSubmission, createPaymentOrder, createVaultItem, getPaymentConfig } from "../lib/api";
import ProcessingScreen from "../components/ProcessingScreen";
import OCRResultTable from "../components/OCRResultTable";
import RiskScoreGauge from "../components/RiskScoreGauge";
import RiskBreakdownChart from "../components/RiskBreakdownChart";
import ChecklistItem from "../components/ChecklistItem";
import { getRiskColor } from "../lib/riskColors";

const STEP_LABELS = ["Upload", "Details", "Processing", "OCR Review", "Payment", "Report"];

export default function Verify() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
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

  // Step 1: Upload
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

  // Step 2 -> 3: Submit
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
      setStep(2);
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.detail || "Unknown error"));
    }
    setLoading(false);
  };

  // Step 3 -> 4: Processing complete
  const handleProcessingComplete = (data) => {
    setResult(data);
    setStep(3);
  };

  // Step 4 -> 5: OCR confirmed
  const handleOCRConfirm = () => setStep(4);

  // Step 5: Payment
  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data: orderData } = await createPaymentOrder(submissionId);

      // Demo mode or free tier skip — go straight to report
      if (orderData.skip_payment || orderData.demo_mode) {
        setStep(5);
        setLoading(false);
        return;
      }

      // Real Razorpay checkout
      const { data: config } = await getPaymentConfig();
      const options = {
        key: config.razorpay_key_id,
        amount: orderData.amount,
        currency: "INR",
        name: "Rakshak",
        description: "Land Verification Report",
        order_id: orderData.order_id,
        handler: () => {
          toast.success("Payment successful!");
          setStep(5);
        },
        theme: { color: "#6366F1" },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => toast.error("Payment failed"));
      rzp.open();
    } catch {
      toast.error("Payment failed");
    }
    setLoading(false);
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
      toast.success("Saved to Vault!");
    } catch {
      toast.error("Failed to save");
    }
  };

  const assessment = result?.assessment;
  const extraction = result?.extraction;
  const riskColor = getRiskColor(assessment?.risk_level);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <Shield className="w-6 h-6 text-accent" />
          <span className="text-lg font-bold">Rakshak</span>
        </div>
        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  i <= step
                    ? "bg-accent text-white"
                    : "bg-bg-card text-text-muted border border-slate-700"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${i <= step ? "text-text-primary" : "text-text-muted"}`}>
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-6 h-px ${i < step ? "bg-accent" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 0 && (
            <motion.div key="upload" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="text-2xl font-bold mb-2">Upload Khatiyan Document</h2>
              <p className="text-text-muted mb-8">Upload a photo or scan of your land document</p>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-accent bg-accent/5"
                    : "border-slate-700 hover:border-accent/50"
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
                    <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-primary font-medium">
                      Drag & drop your Khatiyan here
                    </p>
                    <p className="text-sm text-text-muted mt-1">JPG, PNG, or PDF</p>
                  </>
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => file && setStep(1)}
                  disabled={!file}
                  className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium disabled:opacity-30 transition-colors"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <motion.div key="details" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="text-2xl font-bold mb-2">Land Details</h2>
              <p className="text-text-muted mb-8">Provide information about the land transaction</p>

              <div className="space-y-5">
                <div>
                  <label className="text-sm text-text-muted block mb-1.5">Village Name</label>
                  <input
                    value={details.village_name}
                    onChange={(e) => setDetails({ ...details, village_name: e.target.value })}
                    className="w-full bg-bg-card border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none"
                    placeholder="e.g., Ranchi"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1.5">Plot Number</label>
                  <input
                    value={details.plot_number}
                    onChange={(e) => setDetails({ ...details, plot_number: e.target.value })}
                    className="w-full bg-bg-card border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:border-accent focus:outline-none"
                    placeholder="e.g., 12345"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1.5">Seller Name</label>
                  <input
                    value={details.seller_name}
                    onChange={(e) => setDetails({ ...details, seller_name: e.target.value })}
                    className="w-full bg-bg-card border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none"
                    placeholder="e.g., Ram Kumar"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDetails({ ...details, buyer_tribal: !details.buyer_tribal })}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      details.buyer_tribal ? "bg-accent" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                        details.buyer_tribal ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-text-primary">Is buyer tribal (ST)?</span>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 px-6 py-3 text-text-muted hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !details.village_name || !details.plot_number || !details.seller_name}
                  className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium disabled:opacity-30 transition-colors"
                >
                  {loading ? "Submitting..." : "Start Analysis"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 2 && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProcessingScreen
                submissionId={submissionId}
                onComplete={handleProcessingComplete}
              />
            </motion.div>
          )}

          {/* Step 4: OCR Review */}
          {step === 3 && (
            <motion.div key="ocr" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="text-2xl font-bold mb-2">Review Extracted Data</h2>
              <p className="text-text-muted mb-8">Verify the AI-extracted information. Edit any incorrect fields.</p>
              <OCRResultTable extraction={extraction} onEdit={handleOCRConfirm} />
            </motion.div>
          )}

          {/* Step 5: Payment */}
          {step === 4 && (
            <motion.div key="payment" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center py-16">
              <FileText className="w-16 h-16 text-accent mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Unlock Full Report</h2>
              <div className="bg-bg-card rounded-2xl p-6 border border-slate-800 max-w-sm mx-auto mt-6">
                <div className="mb-6">
                  <p className="text-risk-green font-semibold text-lg mb-1">Demo Mode</p>
                  <p className="text-text-muted text-sm">Payment skipped for investor demo</p>
                </div>
                <div className="text-left bg-bg-base rounded-xl p-4 mb-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Plan</span>
                    <span className="font-mono">Free (1/month)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Report Price</span>
                    <span className="font-mono line-through text-text-muted">₹499</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">You Pay</span>
                    <span className="font-mono text-risk-green font-bold">₹0</span>
                  </div>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "View Report — Free"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 6: Report */}
          {step === 5 && assessment && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Recommendation Banner */}
              <div
                className="rounded-2xl p-4 text-center text-lg font-bold mb-8"
                style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
              >
                Recommendation: {assessment.recommendation}
              </div>

              {/* Gauge */}
              <div className="flex justify-center mb-10">
                <RiskScoreGauge
                  score={assessment.final_risk_score}
                  level={assessment.risk_level}
                />
              </div>

              {/* Two columns */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Extracted Data */}
                <div className="bg-bg-card rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Extracted Data</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Plot Number", extraction?.plot_number],
                      ["Khata Number", extraction?.khata_number],
                      ["Area (Bigha)", extraction?.area_bigha],
                      ["Owner Name", extraction?.owner_name],
                      ["Tribal Status", extraction?.tribal_status],
                      ["Last Mutation", extraction?.last_mutation_date],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-text-muted">{label}</span>
                        <span className="font-mono">{val ?? "—"}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-slate-700">
                      <span className="text-text-muted">Confidence</span>
                      <span className="font-mono">
                        {((extraction?.overall_confidence ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown */}
                <RiskBreakdownChart assessment={assessment} />
              </div>

              {/* Checklist */}
              <div className="bg-bg-card rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Verification Checklist</h3>
                {assessment.checklist && Object.entries(assessment.checklist).map(([key, val]) => (
                  <ChecklistItem
                    key={key}
                    label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    status={val ? "pass" : "fail"}
                    description={val ? "Verified" : "Requires attention"}
                  />
                ))}
              </div>

              {/* Flags */}
              {assessment.flags?.length > 0 && (
                <div className="bg-risk-red/10 border border-risk-red/30 rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-risk-red mb-3">Flags</h3>
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
                  onClick={handleSaveVault}
                  className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
                >
                  Save to Vault
                </button>
                <button
                  onClick={() => navigate("/verify")}
                  className="px-6 py-3 bg-bg-card border border-slate-700 text-text-primary rounded-xl font-medium hover:border-accent/50 transition-colors"
                  onClickCapture={() => window.location.reload()}
                >
                  Verify Another
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-bg-card border border-slate-700 text-text-muted rounded-xl font-medium hover:text-text-primary transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
