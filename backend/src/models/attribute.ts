import { query } from '../db';

export interface Attribute {
  id: number;
  user_id: number;
  key: string;
  value: string;
  where_used: string[];
  file_path: string;
  file_name?: string;
  file_type: 'image' | 'document' | 'other';
  file_size?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AttributeInput {
  user_id: number;
  key: string;
  value: string;
  where_used: string[];
  file_path?: string;
  file_name?: string;
  file_type?: 'image' | 'document' | 'other';
  file_size?: number;
}

const parseWhereUsed = (whereUsed: any): string[] => {
  if (!whereUsed) return [];
  if (Array.isArray(whereUsed)) return whereUsed;
  
  try {
    // First try to parse as JSON
    const parsed = JSON.parse(whereUsed);
    
    // If it's an array, flatten it and remove any empty values
    if (Array.isArray(parsed)) {
      return parsed.flatMap(item => {
        if (typeof item === 'string') {
          try {
            // Try to parse if it's a JSON string
            const nestedParsed = JSON.parse(item);
            return Array.isArray(nestedParsed) ? nestedParsed : [nestedParsed];
          } catch {
            return [item];
          }
        }
        return [item];
      }).filter(Boolean);
    }
    
    // If it's a string that looks like JSON, try parsing it again
    if (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{'))) {
      try {
        const doubleParsed = JSON.parse(parsed);
        return Array.isArray(doubleParsed) ? doubleParsed.flat().filter(Boolean) : [doubleParsed];
      } catch {
        return [parsed];
      }
    }
    
    return [parsed];
  } catch {
    // If parsing fails, return as single item array
    return [whereUsed];
  }
};

export const createAttribute = async (attributeInput: AttributeInput): Promise<Attribute> => {
  // Ensure where_used is a clean array before saving
  const cleanWhereUsed = Array.isArray(attributeInput.where_used) 
    ? attributeInput.where_used.flatMap(item => {
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [item];
          }
        }
        return [item];
      }).filter(Boolean)
    : [];

  const result = await query(
    'INSERT INTO attributes (user_id, key, value, where_used, file_path, file_name, file_type, file_size) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [
      attributeInput.user_id,
      attributeInput.key,
      attributeInput.value,
      JSON.stringify(cleanWhereUsed),
      attributeInput.file_path || '',
      attributeInput.file_name,
      attributeInput.file_type || 'other',
      attributeInput.file_size
    ]
  );
  return {
    ...result.rows[0],
    where_used: parseWhereUsed(result.rows[0].where_used)
  };
};

export const getUserAttributes = async (userId: number): Promise<Attribute[]> => {
  const result = await query('SELECT * FROM attributes WHERE user_id = $1', [userId]);
  return result.rows.map((row: any) => ({
    ...row,
    where_used: parseWhereUsed(row.where_used)
  }));
};

export const getAttributeById = async (id: number): Promise<Attribute | null> => {
  const result = await query('SELECT * FROM attributes WHERE id = $1', [id]);
  if (!result.rows[0]) return null;
  return {
    ...result.rows[0],
    where_used: parseWhereUsed(result.rows[0].where_used)
  };
};

export const updateAttribute = async (id: number, attributeInput: Partial<AttributeInput>): Promise<Attribute> => {
  // Ensure where_used is a clean array before saving
  const cleanWhereUsed = Array.isArray(attributeInput.where_used) 
    ? attributeInput.where_used.flatMap(item => {
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [item];
          }
        }
        return [item];
      }).filter(Boolean)
    : [];

  const result = await query(
    'UPDATE attributes SET key = $1, value = $2, where_used = $3, file_path = $4, file_name = $5, file_type = $6, file_size = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
    [
      attributeInput.key,
      attributeInput.value,
      JSON.stringify(cleanWhereUsed),
      attributeInput.file_path || '',
      attributeInput.file_name,
      attributeInput.file_type || 'other',
      attributeInput.file_size,
      id
    ]
  );
  return {
    ...result.rows[0],
    where_used: parseWhereUsed(result.rows[0].where_used)
  };
};

export const deleteAttribute = async (id: number): Promise<void> => {
  await query('DELETE FROM attributes WHERE id = $1', [id]);
}; 