import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getVaultItem, getSubmission, updateVaultItem, deleteVaultItem } from "../lib/api";
import { useT } from "../lib/i18n";
import RiskScoreGauge from "../components/RiskScoreGauge";
import RiskBreakdownChart from "../components/RiskBreakdownChart";
import ChecklistItem from "../components/ChecklistItem";
import { getRiskColor } from "../lib/riskColors";

export default function VaultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useT();

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
      toast.success(t("vault.saved"));
    },
    onError: () => toast.error(t("vault.update_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVaultItem(id),
    onSuccess: () => {
      toast.success(t("vault.deleted"));
      navigate("/dashboard");
    },
  });

  const assessment = submission?.assessment;
  const extraction = submission?.extraction;
  const riskColor = getRiskColor(assessment?.risk_level);

  return (
    <div className="min-h-screen bg-bg-base p-6 md:p-10">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t("common.back_to_dashboard")}
      </button>

      {vault && (
        <div>
          <h1 className="text-3xl font-bold mb-8 text-text-primary">{vault.vault_name || t("vault.untitled")}</h1>

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
                <div className="bg-bg-card rounded-2xl p-6 border border-border">
                  <h3 className="text-lg font-semibold mb-4">{t("vault.land_details")}</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      [t("vault.village"), vault.village_name],
                      [t("vault.plot_number"), vault.plot_number],
                      [t("vault.area"), vault.area_bigha],
                      [t("vault.owner"), extraction?.owner_name],
                      [t("vault.tribal_status"), extraction?.tribal_status],
                      [t("vault.last_mutation"), extraction?.last_mutation_date],
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
                <div className="bg-bg-card rounded-2xl p-6 mb-8 border border-border">
                  <h3 className="text-lg font-semibold mb-4">{t("vault.checklist")}</h3>
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
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">{t("vault.edit_title")}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-muted block mb-1.5">{t("vault.name")}</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1.5">{t("vault.notes")}</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none resize-none text-text-primary"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1.5">{t("vault.privacy")}</label>
                <select
                  value={editPermission}
                  onChange={(e) => setEditPermission(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                >
                  <option value="private">{t("common.private")}</option>
                  <option value="family">{t("common.family")}</option>
                  <option value="public">{t("common.public")}</option>
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
                  className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors min-h-12"
                >
                  <Save className="w-4 h-4" /> {t("common.save")}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t("vault.delete_confirm"))) deleteMutation.mutate();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-risk-red/10 text-risk-red rounded-xl font-medium hover:bg-risk-red/20 transition-colors min-h-12"
                >
                  <Trash2 className="w-4 h-4" /> {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
