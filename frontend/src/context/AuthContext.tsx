import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi, type AuthUser, type RegisterResponse } from "../api/auth";
import { getToken, setOnUnauthorized, setToken } from "../api/client";

export interface AuthModalState {
  open: boolean;
  message: string;
  defaultMode: "login" | "register";
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  authModal: AuthModalState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<RegisterResponse>;
  logout: () => void;
  openAuthModal: (opts?: {
    message?: string;
    mode?: "login" | "register";
  }) => void;
  closeAuthModal: () => void;
  runWithAuth: <T>(
    action: () => Promise<T>,
    message?: string,
  ) => Promise<T>;
}

const DEFAULT_MODAL: AuthModalState = {
  open: false,
  message: "",
  defaultMode: "register",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModalState>(DEFAULT_MODAL);
  const pendingRef = useRef<(() => Promise<void>) | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setOnUnauthorized(() => {
      if (getToken()) logout();
    });
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

  const finishLogin = async (email: string, password: string) => {
    const { access_token } = await authApi.login({ email, password });
    setToken(access_token);
    setUser(await authApi.me());
    if (pendingRef.current) {
      await pendingRef.current();
      pendingRef.current = null;
    }
    setAuthModal(DEFAULT_MODAL);
    await queryClient.invalidateQueries();
  };

  const login = async (email: string, password: string) => {
    await finishLogin(email, password);
  };

  const register = async (email: string, password: string) => {
    return authApi.register({ email, password });
  };

  const openAuthModal = useCallback(
    (opts?: { message?: string; mode?: "login" | "register" }) => {
      setAuthModal({
        open: true,
        message:
          opts?.message ??
          "Зарегистрируйтесь или войдите, чтобы сохранить данные в аккаунте.",
        defaultMode: opts?.mode ?? "register",
      });
    },
    [],
  );

  const closeAuthModal = useCallback(() => {
    pendingRef.current = null;
    setAuthModal(DEFAULT_MODAL);
  }, []);

  const runWithAuth = useCallback(
    <T,>(action: () => Promise<T>, message?: string): Promise<T> => {
      if (user) return action();
      return new Promise<T>((resolve, reject) => {
        pendingRef.current = async () => {
          try {
            resolve(await action());
          } catch (err) {
            reject(err);
          }
        };
        openAuthModal({ message });
      });
    },
    [user, openAuthModal],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authModal,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
        runWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
