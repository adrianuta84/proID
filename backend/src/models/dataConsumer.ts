import { query } from '../db';

export interface DataConsumer {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  is_admin_defined: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DataConsumerInput {
  name: string;
  description?: string;
  created_by: number;
  is_admin_defined?: boolean;
}

export const createDataConsumer = async (input: DataConsumerInput): Promise<DataConsumer> => {
  const result = await query(
    'INSERT INTO data_consumers (name, description, created_by, is_admin_defined) VALUES ($1, $2, $3, $4) RETURNING *',
    [input.name, input.description || null, input.created_by, input.is_admin_defined || false]
  );
  return result.rows[0];
};

export const getDataConsumers = async (): Promise<DataConsumer[]> => {
  const result = await query('SELECT * FROM data_consumers ORDER BY name');
  return result.rows;
};

export const searchDataConsumers = async (searchTerm: string): Promise<DataConsumer[]> => {
  const result = await query(
    'SELECT * FROM data_consumers WHERE name ILIKE $1 ORDER BY name',
    [`%${searchTerm}%`]
  );
  return result.rows;
};

export const getDataConsumerById = async (id: number): Promise<DataConsumer | null> => {
  const result = await query('SELECT * FROM data_consumers WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const updateDataConsumer = async (id: number, input: Partial<DataConsumerInput>): Promise<DataConsumer> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.name) {
    updates.push(`name = $${paramCount}`);
    values.push(input.name);
    paramCount++;
  }

  if (input.description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(input.description);
    paramCount++;
  }

  if (input.is_admin_defined !== undefined) {
    updates.push(`is_admin_defined = $${paramCount}`);
    values.push(input.is_admin_defined);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  values.push(id);
  const result = await query(
    `UPDATE data_consumers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const deleteDataConsumer = async (id: number): Promise<void> => {
  await query('DELETE FROM data_consumers WHERE id = $1', [id]);
}; 