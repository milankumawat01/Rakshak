import { useNavigate } from "react-router-dom";
import {
  Shield, Upload, Database, ScanSearch, ClipboardCheck, BarChart3,
  FileCheck, ArrowRight, Monitor, CheckCircle
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import RiskScoreGauge from "../components/RiskScoreGauge";

export default function Landing() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { t, locale, setLocale } = useT();

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate("/verify");
    } else {
      navigate("/signup");
    }
  };

  const pipelineSteps = [
    { Icon: Upload, titleKey: "landing.step1_title", descKey: "landing.step1_desc" },
    { Icon: Database, titleKey: "landing.step2_title", descKey: "landing.step2_desc" },
    { Icon: ScanSearch, titleKey: "landing.step3_title", descKey: "landing.step3_desc" },
    { Icon: ClipboardCheck, titleKey: "landing.step4_title", descKey: "landing.step4_desc" },
    { Icon: BarChart3, titleKey: "landing.step5_title", descKey: "landing.step5_desc" },
    { Icon: FileCheck, titleKey: "landing.step6_title", descKey: "landing.step6_desc" },
  ];

  const features = [
    { icon: "🔍", title: "AI-Powered OCR", desc: "Extracts data from Khatiyan documents using advanced AI vision models" },
    { icon: "⚖️", title: "CNT Act Compliance", desc: "Automatic checks against Chota Nagpur Tenancy Act regulations" },
    { icon: "🌲", title: "Forest Boundary Check", desc: "Verifies land against forest department records" },
    { icon: "📊", title: "Multi-Factor Risk Score", desc: "8 different risk parameters combined into a single 0-100 score" },
    { icon: "🔗", title: "Chain of Title", desc: "Traces ownership history through Vanshavali records" },
    { icon: "📄", title: "Land Health Certificate", desc: "Downloadable PDF report with full analysis and recommendation" },
  ];

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-accent" />
            <span className="text-xl font-bold text-text-primary">BhomiRakshak</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-bg-input transition-colors text-text-muted"
            >
              {locale === "en" ? "हिं" : "EN"}
            </button>
            <button
              onClick={() => navigate("/about")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-bg-input transition-colors text-text-muted"
            >
              {t("about.nav_link")}
            </button>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); toast("Desktop app coming soon!"); }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-bg-input transition-colors text-text-muted"
            >
              <Monitor className="w-4 h-4" /> Desktop App
            </a>
            {isLoggedIn ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors"
              >
                {t("common.dashboard")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 text-sm border border-border text-text-muted hover:text-text-primary font-medium rounded-lg transition-colors"
                >
                  {t("common.login")}
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — Full Screen */}
      <section className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium mb-8">
            <Shield className="w-4 h-4" /> AI-Powered Land Verification
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-text-primary tracking-tight">
            {t("landing.hero_title")}{" "}
            <span className="text-accent">{t("landing.hero_highlight")}</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("landing.hero_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={handleCTA}
              className="px-8 py-4 bg-accent hover:bg-accent-hover text-white text-lg font-semibold rounded-2xl transition-all hover:scale-105 shadow-lg min-w-[200px]"
            >
              {t("common.verify_now")}
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-border text-text-muted hover:text-text-primary text-lg font-medium rounded-2xl transition-colors"
            >
              {t("landing.how_it_works")} →
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 text-sm text-text-muted">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-4 h-4 text-risk-green" />
              <span>{t("landing.trust_verified")}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-4 h-4 text-risk-green" />
              <span>{t("landing.trust_accuracy")}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-4 h-4 text-risk-green" />
              <span>{t("landing.trust_speed")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Full Screen */}
      <section id="how-it-works" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-bg-card border-y border-border">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {t("landing.how_it_works")}
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto">
              From document upload to risk report in 6 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelineSteps.map(({ Icon, titleKey, descKey }, i) => (
              <div key={i} className="relative group">
                <div className="bg-bg-base rounded-2xl p-6 border border-border hover:border-accent/40 transition-all hover:shadow-md h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-bold text-text-primary text-lg">{t(titleKey)}</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{t(descKey)}</p>
                </div>
                {/* Arrow connector for desktop */}
                {i < 5 && i % 3 !== 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-accent/40" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleCTA}
              className="px-8 py-4 bg-accent hover:bg-accent-hover text-white text-lg font-semibold rounded-2xl transition-all hover:scale-105 shadow-lg"
            >
              {t("common.verify_now")}
            </button>
          </div>
        </div>
      </section>

      {/* Features — Full Screen */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Why Choose BhomiRakshak?
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto">
              Comprehensive land verification powered by AI and government data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }, i) => (
              <div
                key={i}
                className="bg-bg-card rounded-2xl p-6 border border-border hover:border-accent/40 transition-all hover:shadow-md"
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Report — Full Screen */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-bg-card border-y border-border">
        <div className="max-w-4xl mx-auto w-full text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            {t("landing.sample_report")}
          </h2>
          <p className="text-text-muted text-lg mb-12 max-w-xl mx-auto">
            See what a land health assessment looks like
          </p>

          <div className="mb-12">
            <RiskScoreGauge score={18} level="GREEN" />
          </div>

          <div className="bg-bg-base rounded-2xl p-6 border border-border max-w-md mx-auto text-left mb-10">
            <h3 className="font-semibold text-text-primary mb-4">Sample Findings</h3>
            <div className="space-y-3 text-sm">
              {[
                ["Risk Level", "LOW RISK (GREEN)"],
                ["Recommendation", "APPROVE"],
                ["CNT Compliance", "PASS"],
                ["Forest Check", "Clear"],
                ["Chain of Title", "Verified — 3 Generations"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-muted">{label}</span>
                  <span className="font-mono text-risk-green font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCTA}
            className="px-8 py-4 bg-accent hover:bg-accent-hover text-white text-lg font-semibold rounded-2xl transition-all hover:scale-105 shadow-lg"
          >
            Get Your Land Report
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="font-semibold text-text-primary">BhomiRakshak</span>
            <span className="text-text-muted text-sm ml-2">AI-Powered Land Verification</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/about")}
              className="text-sm text-text-muted hover:text-accent transition-colors"
            >
              {t("about.nav_link")}
            </button>
            <p className="text-sm text-text-muted">
              For informational purposes only. Consult a legal professional before purchase decisions.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
