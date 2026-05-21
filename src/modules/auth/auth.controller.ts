import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { registerUser, loginUser } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

// POST /api/auth/signup

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: string;
  };

  // Validate required fields
  if (!name || !email || !password) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Name, email, and password are required',
    );
    return;
  }

  // Validate role if provided
  const validRoles = ['contributor', 'maintainer'];
  const userRole = role && validRoles.includes(role) ? role : 'contributor';

  try {
    const user = await registerUser(
      name,
      email,
      password,
      userRole as 'contributor' | 'maintainer',
    );

    sendSuccess(res, StatusCodes.CREATED, 'User registered successfully', user);
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      sendError(res, StatusCodes.BAD_REQUEST, 'Email already in use');
      return;
    }
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Registration failed',
      error,
    );
  }
};

// POST /api/auth/login

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  // Validate required fields
  if (!email || !password) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Email and password are required');
    return;
  }

  try {
    const { token, user } = await loginUser(email, password);

    sendSuccess(res, StatusCodes.OK, 'Login successful', { token, user });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid email or password');
      return;
    }
    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Login failed', error);
  }
};
