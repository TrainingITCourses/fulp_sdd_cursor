/** Request body for POST /api/register */
export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

/** Wire format of a successful POST /api/register */
export interface RegisterResult {
  id: number;
  email: string;
  name: string;
  token: string;
}

export interface NewUserRecord {
  email: string;
  name: string;
  passwordHash: string;
  token: string;
}
