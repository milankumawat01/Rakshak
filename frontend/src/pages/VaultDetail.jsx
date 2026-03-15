import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getVaultItem, getSubmission, updateVaultItem, deleteVaultItem } from "../lib/api";
import RiskScoreGauge from "../components/RiskScoreGauge";
import RiskBreakdownChart from "../components/RiskBreakdownChart";
import ChecklistItem from "../components/ChecklistItem";
import { getRiskColor } from "../lib/riskColors";

export default function VaultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: vault } = useQuery({
    queryKey: ["vault", id],
    queryFn: () => getVaultItem(id).then((r) => r.data),
  });

  const { data: submission } = useQuery({
    queryKey: ["submission", vault?.submission_id],
    queryFn: () => getSubmission(vault.submission_id).then((r) => r.data),
    enabled: !!vault?.submission_id,
  });

  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPermission, setEditPermission] = useState("private");
  const [initialized, setInitialized] = useState(false);

  if (vault && !initialized) {
    setEditName(vault.vault_name || "");
    setEditNotes(vault.notes || "");
    setEditPermission(vault.share_permission || "private");
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: (data) => updateVaultItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["vault", id]);
      toast.success("Saved!");
    },
    onError: () => toast.error("Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVaultItem(id),
    onSuccess: () => {
      toast.success("Deleted");
      navigate("/dashboard");
    },
  });

  const assessment = submission?.assessment;
  const extraction = submission?.extraction;
  const riskColor = getRiskColor(assessment?.risk_level);

  return (
    <div className="min-h-screen bg-bg-base p-6 md:p-10 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {vault && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold mb-8">{vault.vault_name || "Untitled Plot"}</h1>

          {/* Report section */}
          {assessment && (
            <>
              <div
                className="rounded-2xl p-4 text-center text-lg font-bold mb-8"
                style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
              >
                {assessment.recommendation}
              </div>

              <div className="flex justify-center mb-10">
                <RiskScoreGauge
                  score={assessment.final_risk_score}
                  level={assessment.risk_level}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-bg-card rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Land Details</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Village", vault.village_name],
                      ["Plot Number", vault.plot_number],
                      ["Area (Bigha)", vault.area_bigha],
                      ["Owner", extraction?.owner_name],
                      ["Tribal Status", extraction?.tribal_status],
                      ["Last Mutation", extraction?.last_mutation_date],
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

              {assessment.checklist && (
                <div className="bg-bg-card rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4">Checklist</h3>
                  {Object.entries(assessment.checklist).map(([key, val]) => (
                    <ChecklistItem
                      key={key}
                      label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      status={val ? "pass" : "fail"}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Edit Panel */}
          <div className="bg-bg-card rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-semibold mb-4">Edit Vault Item</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-muted block mb-1.5">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-bg-base border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1.5">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-bg-base border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1.5">Privacy</label>
                <select
                  value={editPermission}
                  onChange={(e) => setEditPermission(e.target.value)}
                  className="w-full bg-bg-base border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="private">Private</option>
                  <option value="family">Family</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      vault_name: editName,
                      notes: editNotes,
                      share_permission: editPermission,
                    })
                  }
                  className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this vault item?")) deleteMutation.mutate();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-risk-red/10 text-risk-red rounded-xl font-medium hover:bg-risk-red/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
