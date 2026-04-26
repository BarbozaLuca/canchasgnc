import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

const saveSession = (data) => {
  if (data.token) localStorage.setItem("gnc_token", data.token);
  if (data.refreshToken) localStorage.setItem("gnc_refresh_token", data.refreshToken);
  localStorage.setItem("gnc_user", JSON.stringify(data.usuario));
};

const clearSession = () => {
  localStorage.removeItem("gnc_token");
  localStorage.removeItem("gnc_refresh_token");
  localStorage.removeItem("gnc_user");
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("gnc_token");
    const refreshToken = localStorage.getItem("gnc_refresh_token");
    if (!token && !refreshToken) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      const u = data.usuario;
      if (!u.rol && u.rol_nombre) u.rol = u.rol_nombre;
      setUser(u);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveSession(data);
    setUser(data.usuario);
    return data;
  };

  const register = async (nombre, email, password, celular) => {
    const { data } = await api.post("/auth/register", { nombre, email, password, celular: celular || undefined });
    if (data.requiresVerification) {
      return data;
    }
    saveSession(data);
    setUser(data.usuario);
    return data;
  };

  const verifyEmail = async (email, codigo) => {
    const { data } = await api.post("/auth/verify-email", { email, codigo });
    saveSession(data);
    setUser(data.usuario);
    return data;
  };

  const resendVerification = async (email) => {
    const { data } = await api.post("/auth/resend-verification", { email });
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    saveSession(data);
    setUser(data.usuario);
    return data;
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      const u = data.usuario;
      if (!u.rol && u.rol_nombre) u.rol = u.rol_nombre;
      localStorage.setItem("gnc_user", JSON.stringify(u));
      setUser(u);
    } catch {
      // Si falla, no hacemos nada
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("gnc_refresh_token");
    try {
      // Invalidar el refresh token en el backend
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Si falla (red caída, etc.), igual limpiamos localmente
    } finally {
      clearSession();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendVerification, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
