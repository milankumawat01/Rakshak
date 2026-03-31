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
    if (isLoggedIn) navigate("/verify");
    else navigate("/signup");
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
    { icon: "📊", title: "Multi-Factor Risk Score", desc: "8 different risk parameters combined into a single 0–100 score" },
    { icon: "🔗", title: "Chain of Title", desc: "Traces ownership history through Vanshavali records" },
    { icon: "📄", title: "Land Health Certificate", desc: "Downloadable PDF report with full analysis and recommendation" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-base)" }}>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md border-b border-white/10" style={{ backgroundColor: "rgba(8,24,46,0.97)" }}>
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" style={{ color: "var(--color-gold)" }} />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>BhumiRakshak</span>
              <span className="text-xs italic" style={{ fontFamily: "var(--font-display)", color: "var(--color-teal)" }}>Land Verification</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="px-3 py-1.5 text-xs font-bold border border-white/20 uppercase tracking-widest transition-colors hover:border-white/40"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {locale === "en" ? "हिं" : "EN"}
            </button>
            <button
              onClick={() => navigate("/about")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {t("about.nav_link")}
            </button>
            {isLoggedIn ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
              >
                {t("common.dashboard")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
                >
                  {t("common.login")}
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — Full Screen */}
      <section
        className="relative min-h-[calc(100vh-57px)] flex flex-col justify-center"
        style={{
          backgroundImage: `linear-gradient(to right bottom, rgba(8,24,46,0.93), rgba(10,31,68,0.78)), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80&auto=format&fit=crop')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Decorative label */}
            <div className="inline-flex items-center gap-3">
              <div className="h-px w-10" style={{ backgroundColor: "var(--color-gold)" }}></div>
              <span className="text-lg italic" style={{ fontFamily: "var(--font-display)", color: "var(--color-gold)" }}>
                Where Trust Meets Technology
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {t("landing.hero_title")}{" "}
              <span
                className="italic"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-gold)" }}
              >
                {t("landing.hero_highlight")}
              </span>
            </h1>

            <p
              className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl border-l-2 pl-6"
              style={{ borderColor: "var(--color-teal)" }}
            >
              {t("landing.hero_subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button
                onClick={handleCTA}
                className="inline-flex items-center justify-center h-14 px-8 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-lg gap-2"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
              >
                {t("common.verify_now")}
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-14 px-8 text-sm font-bold uppercase tracking-widest border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                {t("landing.how_it_works")}
              </a>
            </div>

            {/* Trust bar */}
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 text-sm mt-2">
              {[t("landing.trust_verified"), t("landing.trust_accuracy"), t("landing.trust_speed")].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: "var(--color-teal)" }} />
                  <span className="text-white/70 text-xs uppercase tracking-widest font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/10 hidden lg:block" style={{ backgroundColor: "var(--color-navy-deep)" }}>
          <div className="max-w-7xl mx-auto grid grid-cols-4 divide-x divide-white/10">
            {[
              { value: "10,000+", label: "Verifications Done" },
              { value: "98%", label: "Accuracy Rate" },
              { value: "AI", label: "Claude Vision OCR" },
              { value: "JH", label: "Jharkhand Coverage" },
            ].map(({ value, label }) => (
              <div key={label} className="py-7 px-8 hover:bg-white/5 transition-colors cursor-default">
                <p className="font-bold text-3xl mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--color-gold)" }}>{value}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-28 px-6" style={{ backgroundColor: "var(--color-bg-base)" }}>
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest block mb-3" style={{ color: "var(--color-teal)" }}>
              The Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>
              {t("landing.how_it_works")}
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
              From document upload to risk report in 6 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelineSteps.map(({ Icon, titleKey, descKey }, i) => (
              <div
                key={i}
                className="relative group bg-white p-6 border border-[var(--color-border)] hover:border-[var(--color-gold)] transition-all hover:shadow-md"
              >
                <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "var(--color-gold)" }}></div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 flex items-center justify-center shrink-0 border border-[var(--color-border)]" style={{ backgroundColor: "var(--color-bg-input)" }}>
                    <Icon className="w-5 h-5" style={{ color: "var(--color-teal)" }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-teal)" }}>Step {i + 1}</span>
                    <h3 className="font-bold text-sm" style={{ color: "var(--color-navy)", fontFamily: "var(--font-serif)" }}>{t(titleKey)}</h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{t(descKey)}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-2 h-14 px-8 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-md"
              style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
            >
              {t("common.verify_now")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Editorial Split — Image + Mission */}
      <section className="py-0 overflow-hidden" style={{ backgroundColor: "var(--color-bg-base)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="relative h-72 lg:h-auto overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80&auto=format&fit=crop"
              alt="Land document verification"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, transparent, rgba(250,249,246,0.15))" }}></div>
          </div>
          {/* Text */}
          <div className="flex flex-col justify-center px-10 lg:px-16 py-16 lg:py-20">
            <span className="text-xs font-bold uppercase tracking-widest block mb-4" style={{ color: "var(--color-teal)" }}>
              Why It Matters
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>
              Land Fraud Costs Millions Every Year in Jharkhand
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--color-text-muted)" }}>
              Fraudulent land sales, CNT Act violations, and forged Khatiyan documents are rampant. BhumiRakshak gives buyers and investors a complete AI-powered picture before they commit.
            </p>
            <div className="space-y-4">
              {[
                "Tribal land (T-marked) legally cannot be sold to non-tribals",
                "Forest boundary violations can result in full land seizure",
                "Mutation fraud and PoA abuse are leading causes of disputes",
              ].map((point) => (
                <div key={point} className="flex gap-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <span className="shrink-0 font-bold mt-0.5" style={{ color: "var(--color-gold)" }}>—</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <button
                onClick={handleCTA}
                className="inline-flex items-center gap-2 h-12 px-6 text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--color-navy)", color: "white" }}
              >
                Verify Your Land Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 px-6" style={{ backgroundColor: "var(--color-navy-deep)" }}>
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest block mb-3" style={{ color: "var(--color-teal)" }}>
              Why BhumiRakshak
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              Comprehensive Land Intelligence
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
              Every dimension of land risk analyzed and scored
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {features.map(({ icon, title, desc }, i) => (
              <div key={i} className="group p-8 hover:bg-white/5 transition-all cursor-default" style={{ backgroundColor: "var(--color-navy)" }}>
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-widest group-hover:text-[var(--color-gold)] transition-colors" style={{ fontFamily: "var(--font-serif)" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Report */}
      <section className="py-28 px-6" style={{ backgroundColor: "var(--color-bg-base)" }}>
        <div className="max-w-4xl mx-auto w-full text-center">
          <span className="text-xs font-bold uppercase tracking-widest block mb-3" style={{ color: "var(--color-teal)" }}>
            Sample Output
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>
            {t("landing.sample_report")}
          </h2>
          <p className="text-base mb-14 max-w-xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
            See what a land health assessment looks like
          </p>

          <div className="mb-12">
            <RiskScoreGauge score={18} level="GREEN" />
          </div>

          <div className="bg-white p-6 border border-[var(--color-border)] max-w-md mx-auto text-left mb-12">
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: "var(--color-navy)", fontFamily: "var(--font-serif)" }}>
              Sample Findings
            </h3>
            <div className="space-y-3 text-sm">
              {[
                ["Risk Level", "LOW RISK (GREEN)"],
                ["Recommendation", "APPROVE"],
                ["CNT Compliance", "PASS"],
                ["Forest Check", "Clear"],
                ["Chain of Title", "Verified — 3 Generations"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0">
                  <span className="text-xs uppercase tracking-widest font-bold" style={{ color: "var(--color-text-muted)" }}>{label}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: "var(--color-risk-green)" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 h-14 px-8 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-md"
            style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
          >
            Get Your Land Report <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-28 px-6 overflow-hidden" style={{ backgroundColor: "var(--color-navy)" }}>
        <div className="absolute inset-0 dot-pattern pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "var(--font-serif)" }}>
            Verify Before You Invest
          </h2>
          <p className="text-lg mb-12 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Protect your land investment with AI-powered verification. Get a complete risk report in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCTA}
              className="h-14 px-10 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
            >
              {t("common.verify_now")}
            </button>
            <button
              onClick={() => navigate("/about")}
              className="h-14 px-10 text-sm font-bold uppercase tracking-widest border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/10" style={{ backgroundColor: "var(--color-navy-deep)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>BhumiRakshak</span>
              <span className="text-xs italic" style={{ fontFamily: "var(--font-display)", color: "var(--color-teal)" }}>Land Verification</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/about")}
              className="text-xs font-bold uppercase tracking-widest transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {t("about.nav_link")}
            </button>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              For informational purposes only. Consult a legal professional before purchase decisions.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
