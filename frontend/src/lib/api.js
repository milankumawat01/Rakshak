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

// On 401, clear token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("rakshak_token");
      localStorage.removeItem("rakshak_user_id");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const sendOTP = (phone) => api.post("/auth/send-otp", { phone });
export const verifyOTP = (phone, otp) => api.post("/auth/verify-otp", { phone, otp });
export const refreshToken = () => api.post("/auth/refresh");

// --- Submissions ---
export const uploadSubmission = (formData) =>
  api.post("/submissions/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getSubmission = (id) => api.get(`/submissions/${id}`);
export const updateExtraction = (id, data) => api.patch(`/submissions/${id}/extraction`, data);
export const listSubmissions = () => api.get("/submissions/");

// --- Vault ---
export const createVaultItem = (data) => api.post("/vault/", data);
export const listVaultItems = () => api.get("/vault/");
export const getVaultItem = (id) => api.get(`/vault/${id}`);
export const updateVaultItem = (id, data) => api.patch(`/vault/${id}`, data);
export const deleteVaultItem = (id) => api.delete(`/vault/${id}`);

// --- Payment ---
export const getPaymentConfig = () => api.get("/payment/config");
export const getFreeTierStatus = () => api.get("/payment/free-tier-status");
export const createPaymentOrder = (submissionId) =>
  api.post("/payment/create-order", { submission_id: submissionId });
export const getPaymentHistory = () => api.get("/payment/history");

export default api;
