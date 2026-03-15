import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import VaultDetail from "./pages/VaultDetail";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/vault/:id" element={<ProtectedRoute><VaultDetail /></ProtectedRoute>} />
    </Routes>
  );
}
