import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../utils/response';
import type { User, SafeUser, JwtPayload } from '../../types/index';

const SALT_ROUNDS = 10; // bcrypt requirement: between 8 and 12

// Signupprocess

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: 'contributor' | 'maintainer',
): Promise<SafeUser> => {
  // 1. Check if email already exists
  const existing = await query<User>('SELECT id FROM users WHERE email = $1', [
    email,
  ]);

  if (existing.rows.length > 0) {
    throw new Error('EMAIL_EXISTS');
  }

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Insert user into database

  const result = await query<User>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role],
  );

  // result.rows[0] is the newly created user
  return result.rows[0] as SafeUser;
};

// Login

export const loginUser = async (
  email: string,
  password: string,
): Promise<{ token: string; user: SafeUser }> => {
  // 1. Find user by email — we need the password hash to compare

  const result = await query<User>(
    'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
    [email],
  );

  if (result.rows.length === 0) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  // 2. Compare plain password with stored hash

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('INVALID_CREDENTIALS'); // tricky error for security
  }

  // 3. Sign a JWT token with user's id, name, role
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET not configured');

  const payload: JwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

  // 4. Return token,  user (without password)
  const { password: _removed, ...safeUser } = user;

  return {
    token,
    user: safeUser as SafeUser,
  };
};
