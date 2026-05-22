import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../../utils/response';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from './issues.service';
import type { CreateIssueBody, UpdateIssueBody } from '../../types/index';
import { query } from '../../utils/response';
import type { Issue } from '../../types/index';

// POST /api/issues

export const create = async (req: Request, res: Response): Promise<void> => {
  const { title, description, type } = req.body as CreateIssueBody;

  // Validate required fields
  if (!title || !description || !type) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'title, description, and type are required',
    );
    return;
  }

  // Validate field constraints
  if (title.length > 150) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Title must be 150 characters or less',
    );
    return;
  }

  if (description.length < 20) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Description must be at least 20 characters',
    );
    return;
  }

  if (!['bug', 'feature_request'].includes(type)) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Type must be bug or feature_request',
    );
    return;
  }

  try {
    // reporter_id always comes from the JWT, never from req.body
    const reporterId = req.user!.id;
    const issue = await createIssue({ title, description, type }, reporterId);

    sendSuccess(res, StatusCodes.CREATED, 'Issue created successfully', issue);
  } catch (error) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create issue',
      error,
    );
  }
};

// GET /api/issues

export const getAll = async (req: Request, res: Response): Promise<void> => {
  const { sort, type, status } = req.query as {
    sort?: string;
    type?: string;
    status?: string;
  };

  // Validate query params if provided
  if (sort && !['newest', 'oldest'].includes(sort)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'sort must be newest or oldest');
    return;
  }

  if (type && !['bug', 'feature_request'].includes(type)) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'type must be bug or feature_request',
    );
    return;
  }

  if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'status must be open, in_progress, or resolved',
    );
    return;
  }

  try {
    const issues = await getAllIssues(sort, type, status);
    sendSuccess(res, StatusCodes.OK, 'Issues retrieved successfully', issues);
  } catch (error) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch issues',
      error,
    );
  }
};

// GET /api/issues/:id

export const getOne = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] ?? '');

  if (isNaN(id)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Invalid issue ID');
    return;
  }

  try {
    const issue = await getIssueById(id);

    if (!issue) {
      sendError(res, StatusCodes.NOT_FOUND, 'Issue not found');
      return;
    }

    sendSuccess(res, StatusCodes.OK, 'Issue retrieved successfully', issue);
  } catch (error) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch issue',
      error,
    );
  }
};

// PATCH /api/issues/:id

export const update = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] ?? '');

  if (isNaN(id)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Invalid issue ID');
    return;
  }

  try {
    // First fetch the issue to check ownership and status
    const existing = await query<Issue>('SELECT * FROM issues WHERE id = $1', [
      id,
    ]);

    if (existing.rows.length === 0) {
      sendError(res, StatusCodes.NOT_FOUND, 'Issue not found');
      return;
    }

    const issue = existing.rows[0];
    const currentUser = req.user!;

    // Permission logic
    if (currentUser.role === 'contributor') {
      if (issue.reporter_id !== currentUser.id) {
        sendError(
          res,
          StatusCodes.FORBIDDEN,
          'You can only update your own issues',
        );
        return;
      }

      if (issue.status !== 'open') {
        sendError(
          res,
          StatusCodes.CONFLICT,
          'You can only update issues that are still open',
        );
        return;
      }
    }

    // validate body

    const { title, description, type } = req.body as UpdateIssueBody;

    if (!title && !description && !type) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        'Provide at least one field to update',
      );
      return;
    }

    if (title && title.length > 150) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        'Title must be 150 characters or less',
      );
      return;
    }

    if (description && description.length < 20) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        'Description must be at least 20 characters',
      );
      return;
    }

    if (type && !['bug', 'feature_request'].includes(type)) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        'Type must be bug or feature_request',
      );
      return;
    }

    const updated = await updateIssue(id, { title, description, type });
    sendSuccess(res, StatusCodes.OK, 'Issue updated successfully', updated);
  } catch (error) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update issue',
      error,
    );
  }
};

// DELETE /api/issues/:id

export const remove = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] ?? '');

  if (isNaN(id)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Invalid issue ID');
    return;
  }

  try {
    const deleted = await deleteIssue(id);

    if (!deleted) {
      sendError(res, StatusCodes.NOT_FOUND, 'Issue not found');
      return;
    }

    sendSuccess(res, StatusCodes.OK, 'Issue deleted successfully');
  } catch (error) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to delete issue',
      error,
    );
  }
};
