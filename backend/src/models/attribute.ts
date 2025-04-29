import { query } from '../db';

export interface Attribute {
  id: number;
  user_id: number;
  key: string;
  value: string;
  where_used: string;
  created_at: Date;
  updated_at: Date;
}

export interface AttributeInput {
  user_id: number;
  key: string;
  value: string;
  where_used: string;
}

export const createAttribute = async (attributeInput: AttributeInput): Promise<Attribute> => {
  const result = await query(
    'INSERT INTO attributes (user_id, key, value, where_used) VALUES ($1, $2, $3, $4) RETURNING *',
    [attributeInput.user_id, attributeInput.key, attributeInput.value, attributeInput.where_used]
  );
  return result.rows[0];
};

export const getUserAttributes = async (userId: number): Promise<Attribute[]> => {
  const result = await query('SELECT * FROM attributes WHERE user_id = $1', [userId]);
  return result.rows;
};

export const updateAttribute = async (id: number, value: string): Promise<Attribute> => {
  const result = await query(
    'UPDATE attributes SET value = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [value, id]
  );
  return result.rows[0];
};

export const deleteAttribute = async (id: number): Promise<void> => {
  await query('DELETE FROM attributes WHERE id = $1', [id]);
}; 