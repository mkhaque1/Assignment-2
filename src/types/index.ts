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

export interface Issue {
  id: number;
  title: string;
  description: string;
  type: 'bug' | 'feature_request';
  status: 'open' | 'in_progress' | 'resolved';
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

// Issue with reporter details attached (used in GET responses)
export interface IssueWithReporter {
  id: number;
  title: string;
  description: string;
  type: 'bug' | 'feature_request';
  status: 'open' | 'in_progress' | 'resolved';
  reporter: {
    id: number;
    name: string;
    role: 'contributor' | 'maintainer';
  };
  created_at: Date;
  updated_at: Date;
}

// Request body for creating an issue
export interface CreateIssueBody {
  title: string;
  description: string;
  type: 'bug' | 'feature_request';
}

// Request body for updating an issue
export interface UpdateIssueBody {
  title?: string;
  description?: string;
  type?: 'bug' | 'feature_request';
}
