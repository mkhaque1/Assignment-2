// user interface
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'contributor' | 'maintainer';
  created_at: Date;
  updated_at: Date;
}

// sending withour password
export type SafeUser = Omit<User, 'password'>;

export interface JwtPayload {
  id: number;
  name: string;
  role: 'contributor' | 'maintainer';
}

// Extends Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
