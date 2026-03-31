import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("rakshak_token"));
  const [userId, setUserId] = useState(() => localStorage.getItem("rakshak_user_id"));
  const [userName, setUserName] = useState(() => localStorage.getItem("rakshak_user_name"));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("rakshak_user_email"));

  const login = (accessToken, uid, name, email) => {
    localStorage.setItem("rakshak_token", accessToken);
    localStorage.setItem("rakshak_user_id", uid);
    if (name) localStorage.setItem("rakshak_user_name", name);
    if (email) localStorage.setItem("rakshak_user_email", email);
    setToken(accessToken);
    setUserId(uid);
    setUserName(name || null);
    setUserEmail(email || null);
  };

  const logout = () => {
    localStorage.removeItem("rakshak_token");
    localStorage.removeItem("rakshak_user_id");
    localStorage.removeItem("rakshak_user_name");
    localStorage.removeItem("rakshak_user_email");
    setToken(null);
    setUserId(null);
    setUserName(null);
    setUserEmail(null);
  };

  const updateUser = (name, email) => {
    if (name) {
      localStorage.setItem("rakshak_user_name", name);
      setUserName(name);
    }
    if (email) {
      localStorage.setItem("rakshak_user_email", email);
      setUserEmail(email);
    }
  };

  return (
    <AuthContext.Provider value={{ token, userId, userName, userEmail, isLoggedIn: !!token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
