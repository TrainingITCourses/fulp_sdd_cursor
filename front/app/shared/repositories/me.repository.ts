import { get } from "../http-client.js";

export interface UserProfile {
  id: number;
  email: string;
  name: string;
}

export const getMe = (token: string): Promise<UserProfile> =>
  get<UserProfile>("/api/me", { Authorization: `Bearer ${token}` });
