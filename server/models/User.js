
import db from "../db.js";

class User {
  static async findOne(query) {
    try {
      let sql = "SELECT * FROM users WHERE ";
      let params = [];
      
      if (query.ipAddress) {
        sql += "ipAddress = ?";
        params.push(query.ipAddress);
      } else if (query.userId) {
        sql += "userId = ?";
        params.push(query.userId);
      }
      
      const [rows] = await db.execute(sql, params);
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding user:", error);
      return null;
    }
  }

  static async find() {
    try {
      const [rows] = await db.execute("SELECT * FROM users ORDER BY createdAt DESC");
      return rows;
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  constructor(userData) {
    this.userId = userData.userId;
    this.ipAddress = userData.ipAddress;
    this.balance = userData.balance || 100.00;
    this.createdAt = new Date();
  }

  async save() {
    try {
      const sql = `
        INSERT INTO users (userId, ipAddress, balance, createdAt) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        balance = VALUES(balance)
      `;
      
      const [result] = await db.execute(sql, [
        this.userId,
        this.ipAddress,
        this.balance,
        this.createdAt
      ]);
      
      return result;
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  }

  static async updateBalance(userId, newBalance) {
    try {
      const sql = "UPDATE users SET balance = ? WHERE userId = ?";
      const [result] = await db.execute(sql, [newBalance, userId]);
      return result;
    } catch (error) {
      console.error("Error updating user balance:", error);
      throw error;
    }
  }
}

export default User;
