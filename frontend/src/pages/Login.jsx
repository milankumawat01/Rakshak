import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Mail, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { loginRequest, verifyLogin } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1=email, 2=otp
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
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold text-text-primary">BhomiRakshak</span>
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Welcome back</h1>
          <p className="text-text-muted text-sm mt-1">Log in with your email</p>
        </div>

        <div className="bg-bg-card rounded-2xl p-8 border border-border shadow-lg">
          {step === 1 ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Sending OTP..." : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-text-muted text-center">
                We sent a 6-digit code to <span className="font-medium text-text-primary">{email}</span>
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
                {loading ? "Verifying..." : "Log In"}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); }}
                className="w-full py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border text-center text-sm text-text-muted">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent hover:underline font-medium">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
