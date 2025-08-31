
import db from "../db.js";

class Transaction {
  static async find(query = {}) {
    try {
      let sql = "SELECT * FROM transactions";
      let params = [];
      
      if (query.status) {
        sql += " WHERE status = ?";
        params.push(query.status);
      }
      
      sql += " ORDER BY createdAt DESC";
      
      if (query.limit) {
        sql += " LIMIT ?";
        params.push(query.limit);
      }
      
      const [rows] = await db.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("Error finding transactions:", error);
      return [];
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute("SELECT * FROM transactions WHERE id = ?", [id]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding transaction by ID:", error);
      return null;
    }
  }

  constructor(transactionData) {
    this.userId = transactionData.userId;
    this.type = transactionData.type;
    this.amount = transactionData.amount;
    this.network = transactionData.network;
    this.address = transactionData.address;
    this.status = transactionData.status || 'pending';
    this.createdAt = new Date();
  }

  async save() {
    try {
      const sql = `
        INSERT INTO transactions (userId, type, amount, network, address, status, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(sql, [
        this.userId,
        this.type,
        this.amount,
        this.network,
        this.address,
        this.status,
        this.createdAt
      ]);
      
      this.id = result.insertId;
      return this;
    } catch (error) {
      console.error("Error saving transaction:", error);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const sql = "UPDATE transactions SET status = ? WHERE id = ?";
      const [result] = await db.execute(sql, [status, id]);
      return result;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  }
}

export default Transaction;
