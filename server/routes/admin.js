
import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Get pending transactions
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: 'pending' });
    res.json(transactions);
  } catch (error) {
    console.error("Error getting admin transactions:", error);
    res.status(500).json({ message: "Failed to get pending transactions" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Failed to get users" });
  }
});

// Get recent activity
router.get("/recent-activity", async (req, res) => {
  try {
    const recentTransactions = await Transaction.find({ limit: 4 });
    res.json(recentTransactions);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    res.status(500).json({ message: "Failed to get recent activity" });
  }
});

// Update transaction status
router.patch("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // If approving a deposit, add amount to user balance
    if (status === "approved" && transaction.type === "deposit") {
      const user = await User.findOne({ userId: transaction.userId });
      if (user) {
        const newBalance = user.balance + transaction.amount;
        await User.updateBalance(transaction.userId, newBalance);
      }
    }

    // If approving a withdrawal, deduct amount from user balance
    if (status === "approved" && transaction.type === "withdraw") {
      const user = await User.findOne({ userId: transaction.userId });
      if (user) {
        const newBalance = user.balance - transaction.amount;
        await User.updateBalance(transaction.userId, newBalance);
      }
    }

    await Transaction.updateStatus(id, status);
    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

export default router;
