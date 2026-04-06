import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Briefcase, Bitcoin, Plane, GraduationCap, Award, Server } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useT } from "../lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
  }),
};

export default function AboutUs() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useT();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <Helmet>
        <title>About Us — BhumiRakshak Land Verification</title>
        <meta name="description" content="Meet the team behind BhumiRakshak — Jharkhand's AI-powered land verification platform built to protect buyers from fraud and CNT Act violations." />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md border-b border-white/10" style={{ backgroundColor: "rgba(8,24,46,0.97)" }}>
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
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
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold border border-white/20 uppercase tracking-widest transition-colors hover:border-white/40"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <ArrowLeft className="w-4 h-4" /> {t("common.back")}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28 text-center px-6" style={{ backgroundColor: "var(--color-navy-deep)" }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-px w-10" style={{ backgroundColor: "var(--color-gold)" }}></div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-teal)" }}>
                {t("about.badge")}
              </span>
              <div className="h-px w-10" style={{ backgroundColor: "var(--color-gold)" }}></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5" style={{ fontFamily: "var(--font-serif)" }}>
              {t("about.title")}
            </h1>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              {t("about.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* ─── Sanjeev Kumar ─── */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-white border overflow-hidden"
            style={{ borderColor: "var(--color-border)" }}
          >
            {/* Photo + Name + Bio */}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 shrink-0">
                <img
                  src="/images/sanjeev-kumar.jpeg"
                  alt="Sanjeev Kumar"
                  className="w-full h-64 md:h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="p-8 md:p-10 flex-1">
                <div
                  className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ backgroundColor: "rgba(212,175,55,0.1)", color: "var(--color-gold)" }}
                >
                  {t("about.leadership")}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>
                  Sanjeev Kumar
                </h2>
                <p className="font-bold text-sm uppercase tracking-widest mb-5" style={{ color: "var(--color-teal)" }}>
                  {t("about.sanjeev_role")}
                </p>
                <p className="leading-relaxed mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {t("about.sanjeev_bio")}
                </p>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-navy)" }}>
                  {t("about.career_highlights")}
                </h3>
                <ul className="space-y-2.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {["sanjeev_highlight1", "sanjeev_highlight2", "sanjeev_highlight3"].map((key) => (
                    <li key={key} className="flex gap-2">
                      <span className="shrink-0 mt-0.5 font-bold" style={{ color: "var(--color-gold)" }}>—</span>
                      <span>{t(`about.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stats bar */}
            <div className="border-t px-8 md:px-10 py-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-navy-deep)" }}>
              <h3 className="text-base font-bold uppercase tracking-widest mb-6 text-white" style={{ fontFamily: "var(--font-serif)" }}>
                {t("about.sanjeev_track_record")}
              </h3>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { value: "€150M", label: t("about.stat_revenue"), sub: t("about.stat_revenue_sub") },
                  { value: "1,500+", label: t("about.stat_team"), sub: t("about.stat_team_sub") },
                  { value: "25", label: t("about.stat_experience"), sub: t("about.stat_experience_sub") },
                ].map(({ value, label, sub }) => (
                  <div key={label} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--color-gold)" }}>
                      {value}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-white">{label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  {
                    Icon: GraduationCap,
                    label: t("about.education"),
                    lines: ["M.S. Computer Science, Stanford University", "B.Tech Information Technology, IIT Delhi"],
                  },
                  {
                    Icon: Award,
                    label: t("about.recognition"),
                    lines: ['"Top 100 FinTech Leader"', '"Global Innovator Award" for blockchain adoption'],
                  },
                  {
                    Icon: Server,
                    label: t("about.expertise"),
                    lines: ["Cloud architectures, ML, blockchain, enterprise software", "PMP & Certified Blockchain Architect"],
                  },
                ].map(({ Icon, label, lines }) => (
                  <div key={label} className="bg-white p-5 border" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4" style={{ color: "var(--color-teal)" }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-navy)" }}>{label}</span>
                    </div>
                    {lines.map((line, i) => (
                      <p key={i} className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{line}</p>
                    ))}
                  </div>
                ))}
              </div>

              <div className="border-l-4 pl-4 py-2" style={{ borderColor: "var(--color-gold)" }}>
                <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span className="font-bold not-italic" style={{ color: "var(--color-gold)" }}>{t("about.philosophy")}:</span>{" "}
                  {t("about.sanjeev_philosophy")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── Ayush Katiyal ─── */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-white border overflow-hidden"
            style={{ borderColor: "var(--color-border)" }}
          >
            {/* Photo + Name + Bio */}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 shrink-0">
                <img
                  src="/images/ayush-katiyal.jpeg"
                  alt="Ayush Katiyal"
                  className="w-full h-64 md:h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="p-8 md:p-10 flex-1">
                <div
                  className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ backgroundColor: "rgba(212,175,55,0.1)", color: "var(--color-gold)" }}
                >
                  {t("about.leadership")}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>
                  Ayush Katiyal
                </h2>
                <p className="font-bold text-sm uppercase tracking-widest mb-5" style={{ color: "var(--color-teal)" }}>
                  {t("about.ayush_role")}
                </p>
                <p className="leading-relaxed mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {t("about.ayush_bio")}
                </p>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-navy)" }}>
                  {t("about.real_estate_excellence")}
                </h3>
                <ul className="space-y-2.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {["ayush_point1", "ayush_point2", "ayush_point3"].map((key) => (
                    <li key={key} className="flex gap-2">
                      <span className="shrink-0 mt-0.5 font-bold" style={{ color: "var(--color-gold)" }}>—</span>
                      <span>
                        <strong className="font-bold" style={{ color: "var(--color-navy)" }}>{t(`about.${key}_title`)}:</strong>{" "}
                        {t(`about.${key}_desc`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Expertise section */}
            <div className="border-t px-8 md:px-10 py-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-navy-deep)" }}>
              <h3 className="text-base font-bold uppercase tracking-widest mb-6 text-white" style={{ fontFamily: "var(--font-serif)" }}>
                {t("about.ayush_expertise_title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {[
                  { Icon: Briefcase, title: t("about.real_estate_mastery"), desc: t("about.real_estate_mastery_desc") },
                  { Icon: Bitcoin, title: t("about.crypto_investment"), desc: t("about.crypto_investment_desc") },
                  { Icon: Plane, title: t("about.travel_innovation"), desc: t("about.travel_innovation_desc") },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="group bg-white p-5 border hover:border-[var(--color-gold)] transition-colors" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0 border" style={{ backgroundColor: "rgba(31,162,168,0.1)", borderColor: "rgba(31,162,168,0.2)" }}>
                        <Icon className="w-5 h-5" style={{ color: "var(--color-teal)" }} />
                      </div>
                      <h4 className="font-bold text-xs uppercase tracking-widest group-hover:text-[var(--color-gold)] transition-colors" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>{title}</h4>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-l-4 pl-4 py-2" style={{ borderColor: "var(--color-gold)" }}>
                <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                  "{t("about.ayush_vision")}"
                </p>
              </div>
            </div>
          </motion.div>

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
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            For informational purposes only. Consult a legal professional before purchase decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
