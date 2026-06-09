import { api } from "./client";

export interface AuthUser {
  id: number;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (body: LoginInput) =>
    api.post<RegisterResponse>("/auth/register", body),
  login: (body: LoginInput) => api.post<TokenResponse>("/auth/login", body),
  verifyEmail: (token: string) =>
    api.get<MessageResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email: string) =>
    api.post<MessageResponse>("/auth/resend-verification", { email }),
  me: () => api.get<AuthUser>("/auth/me"),
};
