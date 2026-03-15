import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getSubmission } from "../lib/api";

const STEPS = [
  { key: "ocr_extraction", label: "OCR Extraction" },
  { key: "risk_scoring", label: "CNT Status Check" },
  { key: "forest_check", label: "Forest Boundary" },
  { key: "mutation_check", label: "Mutation History" },
];

function stepProgress(pipelineStep, stepKey) {
  const order = ["queued", "ocr_extraction", "risk_scoring", "completed"];
  const current = order.indexOf(pipelineStep);
  const target = order.indexOf(stepKey);
  if (pipelineStep === "completed") return 100;
  if (current > target) return 100;
  if (current === target) return 60;
  return 0;
}

export default function ProcessingScreen({ submissionId, onComplete }) {
  const { data } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => getSubmission(submissionId).then((r) => r.data),
    refetchInterval: 2000,
    enabled: !!submissionId,
  });

  useEffect(() => {
    if (data?.submission_status === "completed" || data?.submission_status === "failed") {
      onComplete?.(data);
    }
  }, [data?.submission_status]);

  const step = data?.pipeline_step || "queued";

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <h2 className="text-2xl font-semibold">Analyzing Your Document</h2>
      <p className="text-text-muted">Running AI verification checks...</p>

      <div className="w-full max-w-md space-y-6">
        {STEPS.map((s) => {
          const pct = stepProgress(step, s.key);
          return (
            <div key={s.key}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-primary">{s.label}</span>
                <span className="text-text-muted font-mono">{pct}%</span>
              </div>
              <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: pct === 100 ? "#10B981" : "#6366F1" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {step === "completed" && (
        <motion.p
          className="text-risk-green font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Analysis Complete
        </motion.p>
      )}
    </div>
  );
}
