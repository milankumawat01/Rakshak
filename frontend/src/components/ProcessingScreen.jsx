import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2 } from "lucide-react";
import { getSubmission } from "../lib/api";
import { useT } from "../lib/i18n";

const STEPS = [
  { key: "ocr_extraction", labelKey: "processing.ocr_extraction", fakeMs: 2500 },
  { key: "risk_scoring", labelKey: "processing.cnt_status", fakeMs: 2000 },
  { key: "forest_check", labelKey: "processing.forest_boundary", fakeMs: 1800 },
  { key: "mutation_check", labelKey: "processing.mutation_history", fakeMs: 1500 },
];

function getRealProgress(pipelineStep) {
  const map = { queued: 0, ocr_extraction: 1, risk_scoring: 2, completed: 4 };
  return map[pipelineStep] ?? 0;
}

export default function ProcessingScreen({ submissionId, onComplete }) {
  const { t } = useT();
  const [fakeProgress, setFakeProgress] = useState(Array(STEPS.length).fill(0));
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);
  const completedDataRef = useRef(null);
  const timerRef = useRef(null);

  const { data } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => getSubmission(submissionId).then((r) => r.data),
    refetchInterval: 2000,
    enabled: !!submissionId && !done,
  });

  // Track when backend is actually done
  useEffect(() => {
    if (data?.submission_status === "completed" || data?.submission_status === "failed") {
      completedDataRef.current = data;
    }
  }, [data?.submission_status]);

  // Smooth fake progress animation per step
  useEffect(() => {
    if (done) return;

    const step = STEPS[activeStep];
    if (!step) return;

    const interval = 50;
    const totalTicks = step.fakeMs / interval;
    let tick = 0;

    timerRef.current = setInterval(() => {
      tick++;
      const progress = Math.min(100, Math.round((tick / totalTicks) * 100));

      setFakeProgress((prev) => {
        const next = [...prev];
        next[activeStep] = progress;
        return next;
      });

      if (progress >= 100) {
        clearInterval(timerRef.current);

        // If this is the last step AND backend is done, finish
        if (activeStep >= STEPS.length - 1) {
          // If backend already responded, auto-transition after a brief pause
          if (completedDataRef.current) {
            setDone(true);
            setTimeout(() => {
              onComplete?.(completedDataRef.current);
            }, 600);
          } else {
            // Backend still working — wait for it, then transition
            const waitForBackend = setInterval(() => {
              if (completedDataRef.current) {
                clearInterval(waitForBackend);
                setDone(true);
                setTimeout(() => {
                  onComplete?.(completedDataRef.current);
                }, 600);
              }
            }, 300);
          }
        } else {
          // Move to next step after small delay
          setTimeout(() => setActiveStep((prev) => prev + 1), 300);
        }
      }
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [activeStep, done]);

  // Overall progress for the spinner
  const overallProgress = Math.round(
    fakeProgress.reduce((sum, p) => sum + p, 0) / STEPS.length
  );

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
        <p className="text-text-muted text-center mt-1">{t("verify.running_checks")}</p>
      </div>

      {/* Progressive step list */}
      <div className="w-full max-w-md space-y-4">
        {STEPS.map((s, i) => {
          const pct = fakeProgress[i];
          const isActive = i === activeStep && !done;
          const isComplete = pct >= 100;
          const isVisible = i <= activeStep;

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
                  {isComplete ? "Done" : `${pct}%`}
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

      {/* Subtle fade-out message when done */}
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
