
import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Create withdrawal request
router.post("/", async (req, res) => {
  try {
    const { amount, network, address } = req.body;

    // Validate required fields
    if (!amount || !network || !address) {
      return res.status(400).json({ message: "Amount, network, and address are required" });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!["trc20", "polygon", "ton", "bep20"].includes(network)) {
      return res.status(400).json({ message: "Invalid network" });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // Check if user exists
    let user = await User.findOne({ ipAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < withdrawAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const transaction = new Transaction({
      userId: user.userId,
      type: 'withdraw',
      amount: withdrawAmount,
      network,
      address,
      status: 'pending'
    });

    await transaction.save();
    console.log("Withdrawal transaction created:", transaction);
    res.json(transaction);
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res.status(500).json({ message: "Failed to create withdrawal request" });
  }
});

export default router;
