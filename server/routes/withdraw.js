
import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Create withdrawal request
router.post("/", async (req, res) => {
  try {
    const { amount, network, address, username } = req.body;

    if (!amount || !network || !address || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const withdrawAmount = parseFloat(amount);
    if (user.balance < withdrawAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance immediately
    user.balance -= withdrawAmount;
    await user.save();

    const transaction = new Transaction({
      userId: username,
      type: 'withdraw',
      amount: withdrawAmount,
      network,
      address,
      status: 'pending'
    });

    await transaction.save();

    res.json({ message: "Withdrawal request submitted successfully" });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res.status(500).json({ message: "Failed to create withdrawal request" });
  }
});

export default router;
