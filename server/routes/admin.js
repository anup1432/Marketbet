
import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Get all pending transactions
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get recent activity
router.get("/recent-activity", async (req, res) => {
  try {
    const recentActivity = await Transaction.find().sort({ createdAt: -1 }).limit(4);
    res.json(recentActivity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

// Update transaction status
router.patch("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    transaction.status = status;
    await transaction.save();

    if (status === 'approved' && transaction.type === 'deposit') {
      // Add balance to user
      await User.findOneAndUpdate(
        { username: transaction.userId },
        { $inc: { balance: transaction.amount } }
      );
    } else if (status === 'approved' && transaction.type === 'withdraw') {
      // Deduct balance from user (already deducted when request was made)
      // No action needed here
    }

    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

export default router;
