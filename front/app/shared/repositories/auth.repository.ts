import { post } from "../http-client.js";

export type UserRole = "user";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const register = (request: Readonly<RegisterRequest>): Promise<AuthUser> =>
  post<AuthUser>("/api/auth/register", request);

export const login = (request: Readonly<LoginRequest>): Promise<AuthSession> =>
  post<AuthSession>("/api/auth/login", request);
