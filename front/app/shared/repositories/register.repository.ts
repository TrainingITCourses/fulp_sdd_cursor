import { post } from "../http-client.js";

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface RegisterResult {
  id: number;
  email: string;
  name: string;
  token: string;
}

export const register = (input: Readonly<RegisterInput>): Promise<RegisterResult> =>
  post<RegisterResult>("/api/register", input);
