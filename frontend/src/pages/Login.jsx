import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Mail, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { loginRequest, verifyLogin } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await loginRequest(email);
      setStep(2);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      const { data } = await verifyLogin(email, otp);
      login(data.access_token, data.user_id, data.name, data.email);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg-base)" }}>
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
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Log in with your email</p>
        </div>

        <div className="bg-white p-8 border" style={{ borderColor: "var(--color-border)" }}>
          {step === 1 ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm border focus:outline-none transition-colors"
                    style={{
                      backgroundColor: "var(--color-bg-input)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
              >
                {loading ? "Sending OTP..." : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
                We sent a 6-digit code to{" "}
                <span className="font-bold" style={{ color: "var(--color-navy)" }}>{email}</span>
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
                {loading ? "Verifying..." : "Log In"}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); }}
                className="w-full py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:text-[var(--color-navy)]"
                style={{ color: "var(--color-text-muted)" }}
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/signup" className="font-bold uppercase tracking-widest text-xs transition-colors hover:opacity-80" style={{ color: "var(--color-teal)" }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
