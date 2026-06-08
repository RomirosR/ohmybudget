import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi, type AuthUser } from "../api/auth";
import { getToken, setOnUnauthorized, setToken } from "../api/client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, [logout]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, [logout]);

  const login = async (email: string, password: string) => {
    const { access_token } = await authApi.login({ email, password });
    setToken(access_token);
    setUser(await authApi.me());
  };

  const register = async (email: string, password: string) => {
    const { access_token } = await authApi.register({ email, password });
    setToken(access_token);
    setUser(await authApi.me());
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
