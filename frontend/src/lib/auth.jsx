import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("rakshak_token"));
  const [userId, setUserId] = useState(() => localStorage.getItem("rakshak_user_id"));

  const login = (accessToken, uid) => {
    localStorage.setItem("rakshak_token", accessToken);
    localStorage.setItem("rakshak_user_id", uid);
    setToken(accessToken);
    setUserId(uid);
  };

  const logout = () => {
    localStorage.removeItem("rakshak_token");
    localStorage.removeItem("rakshak_user_id");
    setToken(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
