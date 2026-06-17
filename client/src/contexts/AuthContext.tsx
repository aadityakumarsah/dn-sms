import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, UserRole } from "@/types";
import { api } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole, schoolSlug?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "dn_sms_token";
const USER_KEY = "dn_sms_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return;
    const u: User = JSON.parse(stored);

    if (u.role === "super_admin") {
      api.auth.meSuperAdmin()
        .then((data) => {
          const refreshed: User = { id: data.id, name: data.name, email: data.email, role: "super_admin" };
          setUser(refreshed);
          localStorage.setItem(USER_KEY, JSON.stringify(refreshed));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        });
    } else {
      api.auth.meSchool()
        .then((data) => {
          const refreshed: User = { id: data.id, name: data.name, email: data.email, role: data.role, schoolId: data.schoolId, schoolName: data.schoolName, schoolSlug: data.schoolSlug };
          setUser(refreshed);
          localStorage.setItem(USER_KEY, JSON.stringify(refreshed));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        });
    }
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole, schoolSlug?: string) => {
    setIsLoading(true);
    try {
      if (role === "super_admin") {
        const res = await api.auth.loginSuperAdmin(email, password);
        localStorage.setItem(TOKEN_KEY, res.token);
        const u: User = { id: res.user.id, name: res.user.name, email: res.user.email, role: "super_admin" };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      } else {
        if (!schoolSlug) throw new Error("School slug is required for school portal login");
        const res = await api.auth.loginSchool(email, password, schoolSlug);
        localStorage.setItem(TOKEN_KEY, res.token);
        const u: User = { id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role, schoolId: res.user.schoolId, schoolName: res.user.schoolName, schoolSlug: res.user.schoolSlug };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
