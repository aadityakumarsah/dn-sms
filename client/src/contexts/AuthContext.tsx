import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, UserRole } from "@/types";
import { api } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string, asSuperAdmin?: boolean) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "dn_sms_token";
const USER_KEY = "dn_sms_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const hasStoredSession = !!localStorage.getItem(TOKEN_KEY);
  const [isInitializing, setIsInitializing] = useState(hasStoredSession);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!stored || !token) { setIsInitializing(false); return; }
    let u: User;
    try { u = JSON.parse(stored); } catch { setIsInitializing(false); return; }

    const clearSession = () => {
      setUser(null);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    };

    const verify = u.role === "super_admin"
      ? api.auth.meSuperAdmin().then((data) => {
          const refreshed: User = { id: data.id, name: data.name, email: data.email, role: "super_admin" };
          setUser(refreshed);
          localStorage.setItem(USER_KEY, JSON.stringify(refreshed));
        })
      : api.auth.meSchool().then((data) => {
          const refreshed: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, schoolId: data.schoolId, schoolName: data.schoolName, features: data.features, planSlug: data.planSlug, planName: data.planName, schoolStatus: data.schoolStatus };
          setUser(refreshed);
          localStorage.setItem(USER_KEY, JSON.stringify(refreshed));
        });

    verify
      .catch((e: any) => {
        // Only log out on explicit 401 — network errors / server restarts should keep session alive
        const msg: string = e?.message ?? "";
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          clearSession();
        }
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string, asSuperAdmin?: boolean): Promise<User> => {
    setIsLoading(true);
    try {
      if (asSuperAdmin) {
        const res = await api.auth.loginSuperAdmin(email, password);
        localStorage.setItem(TOKEN_KEY, res.token);
        const u: User = { id: res.user.id, name: res.user.name, email: res.user.email, role: "super_admin" };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        return u;
      } else {
        const res = await api.auth.loginSchool(email, password);
        localStorage.setItem(TOKEN_KEY, res.token);
        const u: User = { id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role as UserRole, schoolId: res.user.schoolId, schoolName: res.user.schoolName, features: res.user.features, planSlug: res.user.planSlug, planName: res.user.planName, schoolStatus: res.user.schoolStatus };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        return u;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitializing, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
