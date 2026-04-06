import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Shield, Mail, User, Phone, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { signup, verifySignup } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone_number: "" });
  const [otp, setOtp] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      await signup(form);
      setStep(2);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      const { data } = await verifySignup(form.email, otp);
      login(data.access_token, data.user_id, data.name, data.email);
      toast.success("Account created!");
      navigate(searchParams.get("next") || "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    }
    setLoading(false);
  };

  const inputStyle = {
    backgroundColor: "var(--color-bg-input)",
    borderColor: "var(--color-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8" style={{ color: "var(--color-gold)" }} />
            <div className="flex flex-col leading-none text-left">
              <span className="text-lg font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>BhumiRakshak</span>
              <span className="text-sm italic" style={{ fontFamily: "var(--font-display)", color: "var(--color-teal)" }}>Land Verification</span>
            </div>
          </div>
          <div className="h-px w-16 mx-auto mb-4" style={{ backgroundColor: "var(--color-gold)" }}></div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>Create Your Account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Land verification made simple</p>
        </div>

        <div className="bg-white p-8 border" style={{ borderColor: "var(--color-border)" }}>
          {step === 1 ? (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>
                  Full Name <span style={{ color: "var(--color-risk-red)" }}>*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 text-sm border focus:outline-none transition-colors"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>
                  Email Address <span style={{ color: "var(--color-risk-red)" }}>*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 text-sm border focus:outline-none transition-colors"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>
                  Phone <span style={{ color: "var(--color-text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 text-sm border focus:outline-none transition-colors"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
              >
                {loading ? "Sending OTP..." : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
                We sent a 6-digit code to{" "}
                <span className="font-bold" style={{ color: "var(--color-navy)" }}>{form.email}</span>
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 text-center text-lg border focus:outline-none transition-colors tracking-widest"
                  style={{
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "var(--color-bg-input)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); }}
                className="w-full py-2 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                Back to signup form
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-bold uppercase tracking-widest text-xs transition-colors hover:opacity-80" style={{ color: "var(--color-teal)" }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
