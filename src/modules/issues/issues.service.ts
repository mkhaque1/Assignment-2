import { query } from '../../utils/response';
import type {
  Issue,
  IssueWithReporter,
  CreateIssueBody,
  UpdateIssueBody,
} from '../../types/index';

const attachReporters = async (
  issues: Issue[],
): Promise<IssueWithReporter[]> => {
  if (issues.length === 0) return [];

  // Collect unique reporter ids from all issues
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];

  const reporterResult = await query<{
    id: number;
    name: string;
    role: 'contributor' | 'maintainer';
  }>('SELECT id, name, role FROM users WHERE id = ANY($1::int[])', [
    reporterIds,
  ]);

  const reporterMap = new Map(reporterResult.rows.map((r) => [r.id, r]));

  // Merge reporter into each issue
  return issues.map((issue) => {
    const reporter = reporterMap.get(issue.reporter_id);
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: reporter?.id ?? issue.reporter_id,
        name: reporter?.name ?? 'Unknown',
        role: reporter?.role ?? 'contributor',
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
  });
};

// Create Issue

export const createIssue = async (
  body: CreateIssueBody,
  reporterId: number,
): Promise<Issue> => {
  const { title, description, type } = body;

  const result = await query<Issue>(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporterId],
  );

  return result.rows[0];
};

// Get All Issues

export const getAllIssues = async (
  sort: string = 'newest',
  type?: string,
  status?: string,
): Promise<IssueWithReporter[]> => {
  // Build query dynamically based on filters
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort direction
  const orderBy = sort === 'oldest' ? 'ASC' : 'DESC';

  const result = await query<Issue>(
    `SELECT * FROM issues ${whereClause} ORDER BY created_at ${orderBy}`,
    params,
  );

  // Attach reporter data (no JOINs)
  return attachReporters(result.rows);
};

// Get Single Issue

export const getIssueById = async (
  id: number,
): Promise<IssueWithReporter | null> => {
  const result = await query<Issue>('SELECT * FROM issues WHERE id = $1', [id]);

  if (result.rows.length === 0) return null;

  const withReporter = await attachReporters(result.rows);
  return withReporter[0];
};

// Update Issue

export const updateIssue = async (
  id: number,
  body: UpdateIssueBody,
): Promise<Issue | null> => {
  const { title, description, type } = body;

  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (title !== undefined) {
    fields.push(`title = $${paramIndex}`);
    params.push(title);
    paramIndex++;
  }

  if (description !== undefined) {
    fields.push(`description = $${paramIndex}`);
    params.push(description);
    paramIndex++;
  }

  if (type !== undefined) {
    fields.push(`type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  // Always update updated_at timestamp
  fields.push(`updated_at = NOW()`);

  // id goes last as the final param
  params.push(id);

  const result = await query<Issue>(
    `UPDATE issues SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params,
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// Delete Issue

export const deleteIssue = async (id: number): Promise<boolean> => {
  const result = await query<Issue>(
    'DELETE FROM issues WHERE id = $1 RETURNING id',
    [id],
  );

  // If rowCount is 0, the issue didn't exist
  return (result.rowCount ?? 0) > 0;
};
