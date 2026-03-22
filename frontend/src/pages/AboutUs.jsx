import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Briefcase, Bitcoin, Plane, GraduationCap, Award, Server } from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-bg-base">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
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
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-bg-input transition-colors text-text-muted"
            >
              <ArrowLeft className="w-4 h-4" /> {t("common.back")}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 md:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
              {t("about.badge")}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
              {t("about.title")}
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
              {t("about.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* ─── Sanjeev Kumar ─── */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Photo + Name + Bio */}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 shrink-0">
                <img
                  src="/images/sanjeev-kumar.jpeg"
                  alt="Sanjeev Kumar"
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-10 flex-1">
                <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
                  {t("about.leadership")}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">Sanjeev Kumar</h2>
                <p className="text-accent font-medium mb-5">{t("about.sanjeev_role")}</p>
                <p className="text-text-muted leading-relaxed mb-6">
                  {t("about.sanjeev_bio")}
                </p>
                <h3 className="font-bold text-text-primary mb-3">{t("about.career_highlights")}</h3>
                <ul className="space-y-2.5 text-sm text-text-muted">
                  <li className="flex gap-2">
                    <span className="text-accent mt-0.5 shrink-0">&#8226;</span>
                    <span>{t("about.sanjeev_highlight1")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent mt-0.5 shrink-0">&#8226;</span>
                    <span>{t("about.sanjeev_highlight2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent mt-0.5 shrink-0">&#8226;</span>
                    <span>{t("about.sanjeev_highlight3")}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Stats bar */}
            <div className="border-t border-border bg-bg-base px-8 md:px-10 py-8">
              <h3 className="text-lg font-bold text-text-primary mb-6">{t("about.sanjeev_track_record")}</h3>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { value: "\u20AC150M", label: t("about.stat_revenue"), sub: t("about.stat_revenue_sub") },
                  { value: "1,500+", label: t("about.stat_team"), sub: t("about.stat_team_sub") },
                  { value: "25", label: t("about.stat_experience"), sub: t("about.stat_experience_sub") },
                ].map(({ value, label, sub }) => (
                  <div key={label} className="text-center">
                    <div className="text-3xl md:text-4xl font-extrabold text-accent">{value}</div>
                    <div className="text-sm font-semibold text-text-primary mt-1">{label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-bg-card rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4.5 h-4.5 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">{t("about.education")}</span>
                  </div>
                  <p className="text-sm text-text-muted">M.S. Computer Science, Stanford University</p>
                  <p className="text-sm text-text-muted mt-1">B.Tech Information Technology, IIT Delhi</p>
                </div>
                <div className="bg-bg-card rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4.5 h-4.5 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">{t("about.recognition")}</span>
                  </div>
                  <p className="text-sm text-text-muted">"Top 100 FinTech Leader"</p>
                  <p className="text-sm text-text-muted mt-1">"Global Innovator Award" for blockchain adoption</p>
                </div>
                <div className="bg-bg-card rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="w-4.5 h-4.5 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">{t("about.expertise")}</span>
                  </div>
                  <p className="text-sm text-text-muted">Cloud architectures, ML, blockchain, enterprise software</p>
                  <p className="text-sm text-text-muted mt-1">PMP & Certified Blockchain Architect</p>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <p className="text-sm text-text-muted italic">
                  <span className="text-accent font-medium">{t("about.philosophy")}:</span> {t("about.sanjeev_philosophy")}
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
            className="bg-bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Photo + Name + Bio */}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 shrink-0">
                <img
                  src="/images/ayush-katiyal.jpeg"
                  alt="Ayush Katiyal"
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-10 flex-1">
                <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
                  {t("about.leadership")}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">Ayush Katiyal</h2>
                <p className="text-accent font-medium mb-5">{t("about.ayush_role")}</p>
                <p className="text-text-muted leading-relaxed mb-6">
                  {t("about.ayush_bio")}
                </p>
                <h3 className="font-bold text-text-primary mb-3">{t("about.real_estate_excellence")}</h3>
                <ul className="space-y-2.5 text-sm text-text-muted">
                  <li className="flex gap-2">
                    <span className="text-accent mt-0.5 shrink-0">&#8226;</span>
                    <span><strong className="text-text-primary">{t("about.ayush_point1_title")}:</strong> {t("about.ayush_point1_desc")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent mt-0.5 shrink-0">&#8226;</span>
                    <span><strong className="text-text-primary">{t("about.ayush_point2_title")}:</strong> {t("about.ayush_point2_desc")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent mt-0.5 shrink-0">&#8226;</span>
                    <span><strong className="text-text-primary">{t("about.ayush_point3_title")}:</strong> {t("about.ayush_point3_desc")}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Expertise section */}
            <div className="border-t border-border bg-bg-base px-8 md:px-10 py-8">
              <h3 className="text-lg font-bold text-text-primary mb-6">{t("about.ayush_expertise_title")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {[
                  {
                    Icon: Briefcase,
                    title: t("about.real_estate_mastery"),
                    desc: t("about.real_estate_mastery_desc"),
                  },
                  {
                    Icon: Bitcoin,
                    title: t("about.crypto_investment"),
                    desc: t("about.crypto_investment_desc"),
                  },
                  {
                    Icon: Plane,
                    title: t("about.travel_innovation"),
                    desc: t("about.travel_innovation_desc"),
                  },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="bg-bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-accent" />
                      </div>
                      <h4 className="font-bold text-text-primary">{title}</h4>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <p className="text-sm text-text-muted italic">
                  "{t("about.ayush_vision")}"
                </p>
              </div>
            </div>
          </motion.div>

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
          <p className="text-sm text-text-muted">
            For informational purposes only. Consult a legal professional before purchase decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
