import { post } from "../http-client.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  id: number;
  email: string;
  name: string;
  token: string;
}

export const login = (input: Readonly<LoginInput>): Promise<LoginResult> =>
  post<LoginResult>("/api/login", input);
