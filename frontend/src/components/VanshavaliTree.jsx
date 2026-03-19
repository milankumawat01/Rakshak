import { useT } from "../lib/i18n";

export default function VanshavaliTree({ vanshavali }) {
  const { t } = useT();

  if (!vanshavali || vanshavali.length === 0) {
    return (
      <div className="bg-bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-3">{t("verify.ownership_chain")}</h3>
        <p className="text-sm text-text-muted">{t("verify.not_available")}</p>
      </div>
    );
  }

  const sorted = [...vanshavali].sort(
    (a, b) => (a.generation || 0) - (b.generation || 0)
  );

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-5">{t("verify.ownership_chain")}</h3>
      <div className="flex flex-col items-center gap-0">
        {sorted.map((person, i) => (
          <div key={i} className="flex flex-col items-center">
            {i > 0 && (
              <div className="w-px h-6 bg-border" />
            )}
            {person.relationship && (
              <span className="text-xs text-accent font-medium mb-1 capitalize">
                {person.relationship}
              </span>
            )}
            <div
              className={`px-6 py-3 rounded-xl border text-center min-w-[180px] ${
                i === sorted.length - 1
                  ? "bg-accent/10 border-accent text-text-primary"
                  : "bg-bg-input border-border text-text-muted"
              }`}
            >
              <p className="font-medium text-sm">{person.name || "Unknown"}</p>
              {person.generation && (
                <p className="text-xs text-text-muted mt-0.5">
                  Gen {person.generation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
