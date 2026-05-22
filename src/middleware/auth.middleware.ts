import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';
import type { JwtPayload } from '../types/index';

// Middleware 1: authenticate
// Verifies the JWT token on every protected route

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // 1. Read token from Authorization header
  const token = req.headers['authorization'];

  if (!token) {
    sendError(
      res,
      StatusCodes.UNAUTHORIZED,
      'Access denied. No token provided.',
    );
    return;
  }

  // 2. Verify the token signature and expiry
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'JWT secret not configured.',
    );
    return;
  }

  try {
    // jwt.verify throws if token is invalid or expired
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // 3. Attach decoded payload to req.user
    req.user = decoded;

    next(); // ← pass control to the next middleware or controller
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(
        res,
        StatusCodes.UNAUTHORIZED,
        'Token has expired. Please login again.',
      );
      return;
    }
    sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid token.');
  }
};

// Middleware 2:

export const requireRole = (...roles: Array<'contributor' | 'maintainer'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // requireRole always runs AFTER authenticate

    if (!req.user) {
      sendError(res, StatusCodes.UNAUTHORIZED, 'Not authenticated.');
      return;
    }

    // Check if the user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        StatusCodes.FORBIDDEN,
        `Access denied. Required role: ${roles.join(' or ')}.`,
      );
      return;
    }

    next();
  };
};
