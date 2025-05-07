const bcrypt = require('bcrypt');
const authConfig = require('../config/auth.config');

class PasswordUtils {
  /**
   * Hash a password with salt and pepper
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const saltedPassword = password + authConfig.pepper;
    return await bcrypt.hash(saltedPassword, authConfig.saltRounds);
  }

  /**
   * Compare a plain password with hashed password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} True if matches
   */
  static async comparePassword(password, hashedPassword) {
    const saltedPassword = password + authConfig.pepper;
    return await bcrypt.compare(saltedPassword, hashedPassword);
  }
}

module.exports = PasswordUtils;