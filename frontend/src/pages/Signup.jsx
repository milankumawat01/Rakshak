import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Mail, User, Phone, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { signup, verifySignup } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1=form, 2=otp
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
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold text-text-primary">BhomiRakshak</span>
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Create your account</h1>
          <p className="text-text-muted text-sm mt-1">Land verification made simple</p>
        </div>

        <div className="bg-bg-card rounded-2xl p-8 border border-border shadow-lg">
          {step === 1 ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Phone (optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Sending OTP..." : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-text-muted text-center">
                We sent a 6-digit code to <span className="font-medium text-text-primary">{form.email}</span>
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-sm text-center font-mono tracking-widest focus:border-accent focus:outline-none text-text-primary"
                maxLength={6}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); }}
                className="w-full py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Back to signup form
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border text-center text-sm text-text-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
