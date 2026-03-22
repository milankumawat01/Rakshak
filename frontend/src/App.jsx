import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import Verify from "./pages/Verify";
import History from "./pages/History";
import AddProperty from "./pages/AddProperty";
import VaultDetail from "./pages/VaultDetail";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
      <Route path="/vault/add" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
      <Route path="/vault/:id" element={<ProtectedRoute><VaultDetail /></ProtectedRoute>} />
      <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
    </Routes>
  );
}
