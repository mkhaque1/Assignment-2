import { Response } from 'express';
import pool from '../config/db';
import { QueryResult, QueryResultRow } from 'pg';

// ---------- HTTP response ----------

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

// ---------- Database ----------

export const query = async <T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};
