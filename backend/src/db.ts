import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/proid';

export const pool = new Pool({
  connectionString: databaseUrl,
});

export const query = (text: string, params?: any[]) => pool.query(text, params); 