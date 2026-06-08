import { api } from "./client";

export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (body: LoginInput) =>
    api.post<TokenResponse>("/auth/register", body),
  login: (body: LoginInput) => api.post<TokenResponse>("/auth/login", body),
  me: () => api.get<AuthUser>("/auth/me"),
};
