import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2 } from "lucide-react";
import { getSubmission } from "../lib/api";
import { useT } from "../lib/i18n";

const STEPS = [
  { key: "ocr_extraction", labelKey: "processing.ocr_extraction" },
  { key: "risk_scoring", labelKey: "processing.cnt_status" },
  { key: "forest_check", labelKey: "processing.forest_boundary" },
  { key: "mutation_check", labelKey: "processing.mutation_history" },
];

// Map backend pipeline_step to how many frontend steps are truly done
function getBackendStepIndex(pipelineStep) {
  if (!pipelineStep || pipelineStep === "queued") return -1;
  if (pipelineStep === "ocr_extraction") return 0; // step 0 in progress
  if (pipelineStep === "risk_scoring") return 1;    // step 1 in progress
  if (pipelineStep === "completed") return STEPS.length;
  return -1;
}

export default function ProcessingScreen({ submissionId, onComplete }) {
  const { t } = useT();
  const [stepProgress, setStepProgress] = useState(Array(STEPS.length).fill(0));
  const [done, setDone] = useState(false);
  const completedDataRef = useRef(null);
  const tickRef = useRef(null);
  const backendStepRef = useRef(-1);

  const { data } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => getSubmission(submissionId).then((r) => r.data),
    refetchInterval: 2000,
    enabled: !!submissionId && !done,
  });

  // Track backend completion
  useEffect(() => {
    if (!data) return;
    const status = data.submission_status;
    const step = data.pipeline_step;

    backendStepRef.current = getBackendStepIndex(step);

    if (status === "completed" || status === "failed") {
      completedDataRef.current = data;
    }
  }, [data]);

  // Single animation loop — ticks every 80ms
  useEffect(() => {
    if (done) return;

    tickRef.current = setInterval(() => {
      setStepProgress((prev) => {
        const next = [...prev];
        const backendAt = backendStepRef.current;
        const backendDone = !!completedDataRef.current;

        for (let i = 0; i < STEPS.length; i++) {
          if (next[i] >= 100) continue; // already done

          if (backendDone) {
            // Backend finished — rush all remaining steps to 100
            next[i] = Math.min(100, next[i] + 8);
          } else if (i < backendAt) {
            // Backend has passed this step — fill quickly
            next[i] = Math.min(100, next[i] + 12);
          } else if (i === backendAt) {
            // Backend is currently on this step — animate steadily but cap at 85%
            next[i] = Math.min(85, next[i] + 2);
          } else if (i === backendAt + 1 && next[backendAt] >= 85) {
            // Next step can start creeping once current is at cap
            next[i] = Math.min(30, next[i] + 1);
          }
          // Steps further ahead stay at 0
        }

        // Check if all steps hit 100 and backend is done
        const allDone = next.every((p) => p >= 100) && backendDone;
        if (allDone) {
          clearInterval(tickRef.current);
          setDone(true);
          setTimeout(() => {
            onComplete?.(completedDataRef.current);
          }, 600);
        }

        return next;
      });
    }, 80);

    return () => clearInterval(tickRef.current);
  }, [done]);

  const overallProgress = Math.round(
    stepProgress.reduce((sum, p) => sum + p, 0) / STEPS.length
  );

  // Are we waiting for the backend after animations hit their caps?
  const waitingForBackend =
    !done &&
    !completedDataRef.current &&
    stepProgress.some((p) => p >= 85);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      {/* Animated spinner with percentage */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48" cy="48" r="40"
            fill="none" stroke="#E5E0DB" strokeWidth="6"
          />
          <circle
            cx="48" cy="48" r="40"
            fill="none" stroke="#D97706" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - overallProgress / 100)}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold font-mono text-text-primary">{overallProgress}%</span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-center text-text-primary">{t("verify.analyzing")}</h2>
        <p className="text-text-muted text-center mt-1">
          {waitingForBackend
            ? t("processing.ai_analyzing") || "AI is analyzing your document..."
            : t("verify.running_checks")}
        </p>
      </div>

      {/* Progressive step list */}
      <div className="w-full max-w-md space-y-4">
        {STEPS.map((s, i) => {
          const pct = stepProgress[i];
          const isComplete = pct >= 100;
          const isActive = pct > 0 && pct < 100;
          const isVisible = pct > 0 || i === 0; // always show step 0

          if (!isVisible) return null;

          return (
            <div
              key={s.key}
              className="transition-all duration-500 ease-out"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(12px)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-risk-green shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-accent shrink-0 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
                )}
                <span className={`text-sm font-medium flex-1 ${
                  isComplete ? "text-risk-green" : isActive ? "text-text-primary" : "text-text-muted"
                }`}>
                  {t(s.labelKey)}
                </span>
                <span className={`text-xs font-mono ${
                  isComplete ? "text-risk-green" : "text-text-muted"
                }`}>
                  {isComplete ? "Done" : pct > 0 ? `${pct}%` : ""}
                </span>
              </div>
              <div className="h-1.5 bg-bg-input rounded-full overflow-hidden ml-8">
                <div
                  className="h-full rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isComplete ? "#10B981" : "#D97706",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <p
          className="text-risk-green font-semibold transition-opacity duration-500"
          style={{ animation: "fadeIn 0.4s ease-out" }}
        >
          {t("verify.analysis_complete")}
        </p>
      )}
    </div>
  );
}
