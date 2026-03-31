import { useState, useEffect } from "react";
import { User, Mail, Phone, Save } from "lucide-react";
import toast from "react-hot-toast";
import { getProfile, updateProfile } from "../lib/api";
import { useAuth } from "../lib/auth";
import AppLayout from "../components/AppLayout";

export default function Profile() {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone_number: "" });

  useEffect(() => {
    getProfile().then(({ data }) => {
      setProfile(data);
      setForm({ name: data.name || "", phone_number: data.phone_number || "" });
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load profile");
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateProfile(form);
      setProfile(data);
      updateUser(data.name, data.email);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>Profile</h1>

        <div className="bg-bg-card p-6 border" style={{ borderColor: "var(--color-border)" }}>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 text-sm border focus:outline-none transition-colors"
                style={{ backgroundColor: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-3 text-sm border cursor-not-allowed opacity-60"
                  style={{ backgroundColor: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-navy)" }}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 text-sm border focus:outline-none transition-colors"
                  style={{ backgroundColor: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-bg-input rounded-lg p-3 text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>{profile?.total_submissions || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--color-text-muted)" }}>Submissions</p>
              </div>
              <div className="p-3 text-center border" style={{ backgroundColor: "var(--color-bg-input)", borderColor: "var(--color-border)" }}>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>{profile?.total_vault_items || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--color-text-muted)" }}>Vault Items</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-text-muted">
                Plan: <span className="font-medium text-text-primary capitalize">{profile?.subscription_plan || "free"}</span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-navy)" }}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
