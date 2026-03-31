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
        <h1 className="text-2xl font-bold text-text-primary mb-6">Profile</h1>

        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-text-muted mb-1 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full bg-bg-input/50 border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-text-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted mb-1 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:border-accent focus:outline-none text-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-bg-input rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-accent">{profile?.total_submissions || 0}</p>
                <p className="text-xs text-text-muted">Submissions</p>
              </div>
              <div className="bg-bg-input rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-accent">{profile?.total_vault_items || 0}</p>
                <p className="text-xs text-text-muted">Vault Items</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-text-muted">
                Plan: <span className="font-medium text-text-primary capitalize">{profile?.subscription_plan || "free"}</span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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
