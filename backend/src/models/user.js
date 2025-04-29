const bcrypt = require('bcrypt');
const { query } = require('../db');

class UserModel {
  static async create(userData) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [userData.name, userData.email, passwordHash]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
}

module.exports = { UserModel }; 