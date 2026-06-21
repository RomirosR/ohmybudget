import { api } from "./client";

export interface AuthUser {
  id: number;
  username: string;
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
  username: string;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export const authApi = {
  register: (body: RegisterInput) =>
    api.post<RegisterResponse>("/auth/register", body),
  login: (body: LoginInput) => api.post<TokenResponse>("/auth/login", body),
  verifyEmail: (token: string) =>
    api.get<MessageResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (username: string) =>
    api.post<MessageResponse>("/auth/resend-verification", { username }),
  forgotPassword: (email: string) =>
    api.post<MessageResponse>("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post<MessageResponse>("/auth/reset-password", { token, password }),
  requestEmailChange: (newEmail: string) =>
    api.post<MessageResponse>("/auth/request-email-change", {
      new_email: newEmail,
    }),
  confirmEmailChange: (token: string) =>
    api.get<MessageResponse>(
      `/auth/confirm-email-change?token=${encodeURIComponent(token)}`,
    ),
  me: () => api.get<AuthUser>("/auth/me"),
};
