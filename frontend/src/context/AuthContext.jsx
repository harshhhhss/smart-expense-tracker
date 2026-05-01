import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!token) {
        setLoading(false);
        return;
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      try {
        const { data } = await API.get("/auth/me");
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const persistSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    persistSession(data);
    return data;
  };

  const signup = async (name, email, password) => {
    const { data } = await API.post("/auth/signup", { name, email, password });
    persistSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, signup, logout, loading }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
