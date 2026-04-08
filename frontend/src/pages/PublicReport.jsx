import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Shield, AlertTriangle, CheckCircle, XCircle, MapPin, FileText } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { getPublicReport } from "../lib/api";

const RISK_COLORS = {
  GREEN: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", color: "#10B981" },
  YELLOW: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", color: "#F59E0B" },
  ORANGE: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", color: "#F97316" },
  RED: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", color: "#EF4444" },
};

function ConfidenceBadge({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-xs font-mono ${color}`}>{pct}%</span>;
}

export default function PublicReport() {
  const { submissionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPublicReport(submissionId)
      .then(({ data }) => { setReport(data); setLoading(false); })
      .catch((err) => {
        setError(err.response?.data?.detail || "Report not found");
        setLoading(false);
      });
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">Report Not Available</h1>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  const { extraction, assessment } = report;
  const riskStyle = RISK_COLORS[report.risk_level] || RISK_COLORS.YELLOW;

  const riskLabel = { GREEN: "Low Risk", YELLOW: "Moderate Risk", ORANGE: "High Risk", RED: "Critical Risk" }[report.risk_level] || "Risk Unknown";
  const reportTitle = `${report.village_name || "Land"} Plot ${report.plot_number || ""} — ${riskLabel} | BhumiRakshak`;
  const reportDesc = `Land verification report for ${report.village_name || "property"} (Plot ${report.plot_number || "—"}). Risk score: ${report.risk_score ?? "—"}/100 — ${riskLabel}. CNT Act compliance and full AI analysis by BhumiRakshak.`;
  const reportUrl = `https://bhumirakshak.com/report/${report.id || ""}`;

  return (
    <div className="min-h-screen bg-bg-base">
      <Helmet>
        <title>{reportTitle}</title>
        <meta name="description" content={reportDesc} />
        <meta name="robots" content="noindex, follow" />

        {/* Open Graph — for WhatsApp/social sharing */}
        <meta property="og:title" content={reportTitle} />
        <meta property="og:description" content={reportDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={reportUrl} />
        <meta property="og:image" content="https://bhumirakshak.com/og-image.jpg" />
        <meta property="og:site_name" content="BhumiRakshak" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={reportTitle} />
        <meta name="twitter:description" content={reportDesc} />

        {/* JSON-LD: Report */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Report",
          "name": reportTitle,
          "description": reportDesc,
          "url": reportUrl,
          "dateCreated": report.created_at,
          "publisher": {
            "@type": "Organization",
            "name": "BhumiRakshak",
            "url": "https://bhumirakshak.com"
          }
        })}</script>
      </Helmet>

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5" style={{ backgroundColor: "var(--color-navy-deep)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" style={{ color: "var(--color-gold)" }} />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>BhumiRakshak</span>
              <span className="text-xs italic" style={{ fontFamily: "var(--font-display)", color: "var(--color-teal)" }}>Land Verification</span>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Land Verification Report</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Risk Score Hero */}
        <div className={`rounded-2xl border ${riskStyle.border} ${riskStyle.bg} p-8 text-center`}>
          <div className="text-6xl font-bold mb-2" style={{ color: riskStyle.color, fontFamily: "var(--font-serif)" }}>
            {report.risk_score ?? "—"}
          </div>
          <div className={`text-xl font-semibold mb-1 ${riskStyle.text}`}>
            {report.risk_level} — {assessment?.recommendation || "PENDING"}
          </div>
          <p className="text-text-muted text-sm">Risk Score (0 = Safe, 100 = High Risk)</p>
        </div>

        {/* Property Info */}
        <div className="bg-bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>
            <MapPin className="w-5 h-5 text-accent" /> Property Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ["Village", report.village_name],
              ["Plot No.", report.plot_number],
              ["Seller", report.seller_name],
              ["Buyer Tribal", report.buyer_tribal ? "Yes" : "No"],
              ["Date", report.created_at ? new Date(report.created_at).toLocaleDateString() : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* OCR Extraction */}
        {extraction && (
          <div className="bg-bg-card rounded-2xl border border-border p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>
              <FileText className="w-5 h-5 text-accent" /> Extracted Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["Plot Number", extraction.plot_number, extraction.plot_confidence],
                ["Khata Number", extraction.khata_number, extraction.khata_confidence],
                ["Area (Bigha)", extraction.area_bigha, extraction.area_confidence],
                ["Owner Name", extraction.owner_name, extraction.owner_confidence],
                ["Surname", extraction.surname, extraction.surname_confidence],
                ["Tribal Status", extraction.tribal_status, extraction.tribal_confidence],
                ["Last Mutation", extraction.last_mutation_date, extraction.mutation_confidence],
                ["Land Use", extraction.land_use_type, extraction.land_use_confidence],
                ["Mutation Type", extraction.mutation_type, extraction.mutation_type_confidence],
                ["Village", extraction.village_name, null],
              ].map(([label, value, conf]) => (
                <div key={label} className="flex items-center justify-between bg-bg-input rounded-lg px-4 py-2.5">
                  <div>
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className="text-sm font-medium text-text-primary">{value ?? "—"}</p>
                  </div>
                  {conf != null && <ConfidenceBadge value={conf} />}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-text-muted">
              <span>Overall confidence: <ConfidenceBadge value={extraction.overall_confidence} /></span>
              <span>Language: {extraction.extraction_language}</span>
            </div>
          </div>
        )}

        {/* Risk Breakdown */}
        {assessment && (
          <div className="bg-bg-card rounded-2xl border border-border p-6">
            <h2 className="text-base font-bold mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>Risk Breakdown</h2>
            <div className="space-y-3">
              {[
                ["OCR Confidence", assessment.ocr_confidence_score, 10],
                ["Tribal Status", assessment.tribal_status_score, 25],
                ["DC Permission", assessment.dc_permission_score, 15],
                ["Forest Risk", assessment.forest_risk_score, 15],
                ["Mutation History", assessment.mutation_history_score, 10],
                ["Khatiyan Age", assessment.khatiyan_age_score, 5],
                ["Chain of Title", assessment.chain_of_title_score, 10],
                ["PoA Abuse", assessment.poa_abuse_score, 10],
              ].map(([label, score, weight]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-text-muted w-36">{label} ({weight}%)</span>
                  <div className="flex-1 bg-bg-input rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${score ?? 0}%`,
                        backgroundColor: (score ?? 0) >= 70 ? "#10B981" : (score ?? 0) >= 40 ? "#F59E0B" : "#EF4444",
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-text-primary w-10 text-right">{score ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flags & Checklist */}
        {assessment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessment.flags?.length > 0 && (
              <div className="bg-bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Risk Flags</h3>
                <div className="space-y-2">
                  {assessment.flags.map((flag, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-text-muted">{flag.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assessment.checklist && (
              <div className="bg-bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Compliance Checklist</h3>
                <div className="space-y-2">
                  {Object.entries(assessment.checklist).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {val ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="text-text-muted">{key.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Generated by BhumiRakshak — AI-Powered Land Verification for Jharkhand
          </p>
        </div>
      </div>
    </div>
  );
}
