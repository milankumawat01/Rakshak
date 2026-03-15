import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Upload, BarChart3, FileCheck, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { sendOTP, verifyOTP } from "../lib/api";
import { useAuth } from "../lib/auth";
import RiskScoreGauge from "../components/RiskScoreGauge";

export default function Landing() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      await sendOTP(phone);
      setOtpSent(true);
      toast.success("OTP sent! Use 123456 for demo.");
    } catch {
      toast.error("Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { data } = await verifyOTP(phone, otp);
      login(data.access_token, data.user_id);
      toast.success("Logged in!");
      navigate("/verify");
    } catch {
      toast.error("Invalid OTP");
    }
    setLoading(false);
  };

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate("/verify");
    } else {
      setShowLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-accent" />
          <span className="text-xl font-bold">Rakshak</span>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold leading-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Verify Your Land in{" "}
          <span className="text-accent">20 Seconds.</span>
        </motion.h1>
        <motion.p
          className="text-lg text-text-muted mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          AI-powered. Jharkhand government data. Know your land risk before you buy.
        </motion.p>
        <motion.button
          onClick={handleCTA}
          className="px-8 py-4 bg-accent hover:bg-accent-hover text-white text-lg font-semibold rounded-2xl transition-colors shadow-[0_0_40px_rgba(99,102,241,0.4)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
        >
          Verify Now — Free
        </motion.button>

        {/* Trust bar */}
        <motion.div
          className="flex justify-center gap-8 mt-12 text-sm text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span>1,000+ lands verified</span>
          <span className="text-slate-600">|</span>
          <span>99% accuracy</span>
          <span className="text-slate-600">|</span>
          <span>20-second results</span>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { Icon: Upload, title: "Upload Khatiyan", desc: "Take a photo or upload your land document" },
            { Icon: BarChart3, title: "AI Analysis", desc: "Our AI extracts data and runs 7 risk checks" },
            { Icon: FileCheck, title: "Risk Report", desc: "Get a colour-coded score with recommendation" },
          ].map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              className="bg-bg-card rounded-2xl p-6 text-center border border-slate-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-text-muted">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Score Preview */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-8">Sample Risk Report</h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <RiskScoreGauge score={18} level="GREEN" />
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Free", price: "₹0", period: "", features: ["1 verification/month", "Basic risk score", "Standard support"], highlight: false },
            { name: "Per Report", price: "₹499", period: "per report", features: ["Unlimited verifications", "Full risk breakdown", "PDF download", "Vault storage"], highlight: true },
            { name: "Premium", price: "₹299", period: "/month", features: ["Unlimited verifications", "Priority processing", "Family sharing", "Dedicated support"], highlight: false },
          ].map(({ name, price, period, features, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl p-6 border ${
                highlight
                  ? "bg-accent/10 border-accent shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                  : "bg-bg-card border-slate-800"
              }`}
            >
              <h3 className="font-semibold text-lg mb-1">{name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">{price}</span>
                <span className="text-sm text-text-muted ml-1">{period}</span>
              </div>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="text-sm text-text-muted flex items-center gap-2">
                    <span className="text-accent">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-bg-card rounded-2xl p-8 w-full max-w-sm border border-slate-700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-accent" /> Login
            </h2>
            {!otpSent ? (
              <>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-bg-base border border-slate-700 rounded-lg px-4 py-3 mb-4 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-text-muted mb-3">Enter OTP sent to {phone}</p>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-bg-base border border-slate-700 rounded-lg px-4 py-3 mb-4 text-sm text-center font-mono tracking-widest focus:border-accent focus:outline-none"
                  maxLength={6}
                />
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
              </>
            )}
            <button
              onClick={() => { setShowLogin(false); setOtpSent(false); }}
              className="w-full mt-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
