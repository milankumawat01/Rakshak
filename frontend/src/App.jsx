import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import Verify from "./pages/Verify";
import History from "./pages/History";
import AddProperty from "./pages/AddProperty";
import VaultDetail from "./pages/VaultDetail";
import AboutUs from "./pages/AboutUs";
import PublicReport from "./pages/PublicReport";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/report/:submissionId" element={<PublicReport />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
      <Route path="/vault/add" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
      <Route path="/vault/:id" element={<ProtectedRoute><VaultDetail /></ProtectedRoute>} />
      <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
    </Routes>
  );
}
