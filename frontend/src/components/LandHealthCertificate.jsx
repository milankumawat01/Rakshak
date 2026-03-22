import { forwardRef } from "react";

const STATUS_EMOJI = { pass: "\u2713", fail: "\u2717", warn: "\u26A0" };

const LandHealthCertificate = forwardRef(function LandHealthCertificate(
  { extraction, assessment, submissionId },
  ref
) {
  if (!assessment || !extraction) return null;

  const cntCompliance = assessment.cnt_compliance;
  const riskColor =
    assessment.risk_level === "GREEN"
      ? "#22c55e"
      : assessment.risk_level === "YELLOW"
      ? "#eab308"
      : assessment.risk_level === "ORANGE"
      ? "#f97316"
      : "#ef4444";

  return (
    <div ref={ref} className="print-report">
      <style>{`
        .print-report {
          font-family: 'Inter', 'Segoe UI', sans-serif;
          color: #1e293b;
          background: white;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          font-size: 13px;
          line-height: 1.5;
        }
        .print-report h1 { font-size: 22px; margin: 0; }
        .print-report h2 { font-size: 16px; margin: 16px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
        .print-report h3 { font-size: 14px; margin: 12px 0 6px; }
        .print-report table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        .print-report th, .print-report td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        .print-report th { background: #f1f5f9; font-weight: 600; }
        .print-report .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #D97706; padding-bottom: 12px; margin-bottom: 20px; }
        .print-report .badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-weight: 700; font-size: 14px; }
        .print-report .section { margin-bottom: 16px; }
        .print-report .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .print-report .flag { color: #dc2626; font-size: 12px; }
        .print-report .discrepancy { color: #d97706; font-size: 12px; }
        .print-report .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      `}</style>

      <div className="header">
        <div>
          <h1>BhomiRakshak Land Health Certificate</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>
            Submission: {submissionId?.slice(0, 8)}... | Date: {new Date().toLocaleDateString("en-IN")}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="badge"
            style={{ background: `${riskColor}20`, color: riskColor }}
          >
            {assessment.risk_level}
          </div>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
            {assessment.recommendation}
          </p>
        </div>
      </div>

      <div className="section" style={{ textAlign: "center" }}>
        <span style={{ fontSize: "48px", fontWeight: 700, color: riskColor }}>
          {assessment.final_risk_score}
        </span>
        <span style={{ fontSize: "16px", color: "#94a3b8" }}> / 100 Risk Score</span>
      </div>

      {cntCompliance && (
        <div className="section">
          <h2>CNT Act Compliance</h2>
          <p>
            <strong>Status:</strong>{" "}
            <span style={{ color: cntCompliance.cnt_status === "PASS" ? "#16a34a" : cntCompliance.cnt_status === "FAIL" ? "#dc2626" : "#d97706" }}>
              {cntCompliance.cnt_status}
            </span>
          </p>
          <p>{cntCompliance.reason}</p>
          {cntCompliance.who_can_buy?.length > 0 && (
            <>
              <h3>Who Can Buy:</h3>
              <ul>{cntCompliance.who_can_buy.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </>
          )}
          {cntCompliance.permissions_needed?.length > 0 && (
            <>
              <h3>Permissions Needed:</h3>
              <ul>{cntCompliance.permissions_needed.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </>
          )}
        </div>
      )}

      <div className="section">
        <h2>Extracted Land Data</h2>
        <table>
          <tbody>
            {[
              ["Plot Number", extraction.plot_number],
              ["Khata Number", extraction.khata_number],
              ["Area (Bigha)", extraction.area_bigha],
              ["Owner Name", extraction.owner_name],
              ["Surname", extraction.surname],
              ["Tribal Status", extraction.tribal_status],
              ["Land Use Type", extraction.land_use_type],
              ["Mutation Type", extraction.mutation_type],
              ["Last Mutation Date", extraction.last_mutation_date],
              ["First Registration", extraction.first_registration_date],
              ["DC Permission Ref", extraction.dc_permission_ref],
              ["PoA Count", extraction.poa_count],
              ["Village", extraction.village_name],
              ["Overall Confidence", `${((extraction.overall_confidence || 0) * 100).toFixed(0)}%`],
            ].map(([label, val]) => (
              <tr key={label}>
                <th style={{ width: "40%" }}>{label}</th>
                <td>{val ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {extraction.vanshavali?.length > 0 && (
        <div className="section">
          <h2>Ownership Chain (Vanshavali)</h2>
          <table>
            <thead>
              <tr><th>Name</th><th>Relationship</th><th>Generation</th></tr>
            </thead>
            <tbody>
              {[...extraction.vanshavali]
                .sort((a, b) => (a.generation || 0) - (b.generation || 0))
                .map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{p.relationship}</td>
                    <td>{p.generation}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section">
        <h2>Risk Score Breakdown</h2>
        <div className="grid-2">
          <table>
            <tbody>
              {[
                ["OCR Confidence", assessment.ocr_confidence_score],
                ["Tribal Status", assessment.tribal_status_score],
                ["DC Permission", assessment.dc_permission_score],
                ["Forest Check", assessment.forest_risk_score],
              ].map(([label, val]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{val ?? "—"} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <tbody>
              {[
                ["Mutation History", assessment.mutation_history_score],
                ["Khatiyan Age", assessment.khatiyan_age_score],
                ["Chain of Title", assessment.chain_of_title_score],
                ["PoA Abuse Check", assessment.poa_abuse_score],
              ].map(([label, val]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{val ?? "—"} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2>Verification Checklist</h2>
        <table>
          <tbody>
            {assessment.checklist &&
              Object.entries(assessment.checklist).map(([key, val]) => (
                <tr key={key}>
                  <td style={{ width: "30px", textAlign: "center", fontSize: "16px" }}>
                    {val ? STATUS_EMOJI.pass : STATUS_EMOJI.fail}
                  </td>
                  <td>{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                  <td style={{ color: val ? "#16a34a" : "#dc2626" }}>
                    {val ? "Verified" : "Requires Attention"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {assessment.discrepancies?.length > 0 && (
        <div className="section">
          <h2>Data Discrepancies</h2>
          {assessment.discrepancies.map((d, i) => (
            <p key={i} className="discrepancy">
              {d.field}: OCR found "{d.ocr_value}" but user entered "{d.user_value}" (match: {(d.match_score * 100).toFixed(0)}%)
            </p>
          ))}
        </div>
      )}

      {assessment.flags?.length > 0 && (
        <div className="section">
          <h2>Risk Flags</h2>
          {assessment.flags.map((f, i) => (
            <p key={i} className="flag">{f}</p>
          ))}
        </div>
      )}

      <div className="footer">
        <p>Generated by BhomiRakshak — AI-Powered Land Verification for Jharkhand</p>
        <p>This report is for informational purposes only. Consult a legal professional before making purchase decisions.</p>
      </div>
    </div>
  );
});

export default LandHealthCertificate;
