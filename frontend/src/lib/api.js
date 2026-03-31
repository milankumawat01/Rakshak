import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rakshak_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("rakshak_token");
      localStorage.removeItem("rakshak_user_id");
      localStorage.removeItem("rakshak_user_name");
      localStorage.removeItem("rakshak_user_email");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const signup = (data) => api.post("/auth/signup", data);
export const verifySignup = (email, otp) => api.post("/auth/verify-signup", { email, otp });
export const loginRequest = (email) => api.post("/auth/login", { email });
export const verifyLogin = (email, otp) => api.post("/auth/verify-login", { email, otp });
export const getProfile = () => api.get("/auth/me");
export const updateProfile = (data) => api.patch("/auth/me", data);
export const refreshToken = () => api.post("/auth/refresh");

// --- Submissions ---
export const uploadSubmission = (formData) =>
  api.post("/submissions/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getSubmission = (id) => api.get(`/submissions/${id}`);
export const updateExtraction = (id, data) => api.patch(`/submissions/${id}/extraction`, data);
export const listSubmissions = (q) => api.get("/submissions/", { params: q ? { q } : {} });
export const deleteSubmission = (id) => api.delete(`/submissions/${id}`);

// --- Vault ---
export const createVaultItem = (data) => api.post("/vault/", data);
export const listVaultItems = () => api.get("/vault/");
export const getVaultItem = (id) => api.get(`/vault/${id}`);
export const updateVaultItem = (id, data) => api.patch(`/vault/${id}`, data);
export const deleteVaultItem = (id) => api.delete(`/vault/${id}`);
export const getVaultSummary = () => api.get("/vault/summary");
export const getVaultValuation = (id) => api.get(`/vault/${id}/valuation`);
export const uploadVaultDocument = (vaultId, formData) =>
  api.post(`/vault/${vaultId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteVaultDocument = (vaultId, docId) =>
  api.delete(`/vault/${vaultId}/documents/${docId}`);
export const shareVaultItem = (id, data) => api.post(`/vault/${id}/share`, data);

// --- Payment ---
export const getPaymentConfig = () => api.get("/payment/config");
export const getFreeTierStatus = () => api.get("/payment/free-tier-status");
export const createPaymentOrder = (submissionId) =>
  api.post("/payment/create-order", { submission_id: submissionId });
export const getPaymentHistory = () => api.get("/payment/history");

// --- Public (no auth) ---
export const getPublicReport = (submissionId) =>
  axios.get(`/api/reports/${submissionId}/public`);

export default api;
