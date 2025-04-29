const { query } = require('../db');

class AttributeModel {
  static async create(attributeData) {
    const result = await query(
      'INSERT INTO attributes (user_id, key, value, where_used) VALUES ($1, $2, $3, $4) RETURNING *',
      [attributeData.user_id, attributeData.key, attributeData.value, attributeData.where_used]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await query('SELECT * FROM attributes WHERE user_id = $1', [userId]);
    return result.rows;
  }

  static async update(id, attributeData) {
    const updates = Object.entries(attributeData)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _], index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(attributeData).filter(value => value !== undefined);
    const result = await query(
      `UPDATE attributes SET ${updates} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM attributes WHERE id = $1', [id]);
  }
}

module.exports = { AttributeModel }; 