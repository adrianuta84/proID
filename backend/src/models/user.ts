import { query } from '../db';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserInput {
  username: string;
  name: string;
  email: string;
  password: string;
  is_admin?: boolean;
}

export const createUser = async (userInput: UserInput): Promise<User> => {
  const hashedPassword = await bcrypt.hash(userInput.password, 10);
  const result = await query(
    'INSERT INTO users (username, name, email, password_hash, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userInput.username, userInput.name, userInput.email, hashedPassword, userInput.is_admin || false]
  );
  return result.rows[0];
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const result = await query('SELECT id, username, name, email, is_admin, created_at, updated_at FROM users');
  return result.rows;
};

export const deleteUser = async (id: number): Promise<void> => {
  await query('DELETE FROM users WHERE id = $1', [id]);
};

export const updateUser = async (id: number, userData: Partial<UserInput>): Promise<User> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (userData.username) {
    updates.push(`username = $${paramCount}`);
    values.push(userData.username);
    paramCount++;
  }

  if (userData.name) {
    updates.push(`name = $${paramCount}`);
    values.push(userData.name);
    paramCount++;
  }

  if (userData.email) {
    updates.push(`email = $${paramCount}`);
    values.push(userData.email);
    paramCount++;
  }

  if (userData.password) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    updates.push(`password_hash = $${paramCount}`);
    values.push(hashedPassword);
    paramCount++;
  }

  if (userData.is_admin !== undefined) {
    updates.push(`is_admin = $${paramCount}`);
    values.push(userData.is_admin);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  values.push(id);
  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const verifyPassword = async (user: User, password: string): Promise<boolean> => {
  return bcrypt.compare(password, user.password_hash);
};

export const updateUserPassword = async (userId: number, newPassword: string): Promise<User> => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [hashedPassword, userId]
  );
  return result.rows[0];
}; 