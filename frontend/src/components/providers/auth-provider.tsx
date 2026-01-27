"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api-client";

export type UserRole = "admin" | "contestant" | "guest";

export type AuthUser = {
  email: string;
  role: Exclude<UserRole, "guest">;
  teamId?: string;
  displayName?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchSession(): Promise<AuthUser | null> {
  try {
    const data = await authApi.getSession();
    return data.user;
  } catch (error) {
    console.error("[AuthProvider] fetch session failed", error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const sessionUser = await fetchSession();
      setUser(sessionUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      await refresh();
    }
  }, [refresh]);

  const role: UserRole = user?.role ?? "guest";

  const value = useMemo<AuthContextValue>(
    () => ({ user, role, loading, logout, refresh }),
    [user, role, loading, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
