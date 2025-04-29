import { query } from '../db';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
}

export const createUser = async (userInput: UserInput): Promise<User> => {
  const hashedPassword = await bcrypt.hash(userInput.password, 10);
  const result = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [userInput.name, userInput.email, hashedPassword]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
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