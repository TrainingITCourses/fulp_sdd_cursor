/** Request body for POST /api/login */
export interface LoginInput {
  email: string;
  password: string;
}

/** Wire format of a successful POST /api/login */
export interface LoginResult {
  id: number;
  email: string;
  name: string;
  token: string;
}

/** Public profile returned by GET /api/me */
export interface UserProfile {
  id: number;
  email: string;
  name: string;
}

export interface StoredUser {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  token: string;
}
