import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

/**
 * GET - Pending Transactions
 */
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error("Error getting admin transactions:", error);
    res.status(500).json({ message: "Failed to get pending transactions" });
  }
});

/**
 * GET - All Users
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Failed to get users" });
  }
});

/**
 * GET - Recent Activity (last 4 transactions)
 */
router.get("/recent-activity", async (req, res) => {
  try {
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(4);
    res.json(recentTransactions);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    res.status(500).json({ message: "Failed to get recent activity" });
  }
});

/**
 * PATCH - Update Transaction Status
 */
router.patch("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // validate status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Prevent double approval/rejection
    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Transaction already processed" });
    }

    transaction.status = status;
    await transaction.save();

    // Deposit -> Approve = Add balance
    if (transaction.type === "deposit" && status === "approved") {
      const user = await User.findOne({ userId: transaction.userId });
      if (user) {
        user.balance += transaction.amount;
        await user.save();
        console.log(`✅ Deposit approved: Added ${transaction.amount} to user ${user.userId}, balance: ${user.balance}`);
      }
    }

    // Withdraw -> Approve = Already deducted in request
    if (transaction.type === "withdraw" && status === "approved") {
      console.log(`✅ Withdrawal approved: ${transaction.amount} for user ${transaction.userId}`);
    }

    // Withdraw -> Reject = Return balance
    if (transaction.type === "withdraw" && status === "rejected") {
      const user = await User.findOne({ userId: transaction.userId });
      if (user) {
        user.balance += transaction.amount;
        await user.save();
        console.log(`❌ Withdrawal rejected: Returned ${transaction.amount} to user ${user.userId}, balance: ${user.balance}`);
      }
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

export default router;
