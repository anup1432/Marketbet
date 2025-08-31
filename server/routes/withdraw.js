import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Create withdrawal request
router.post("/", async (req, res) => {
  try {
    const { userId, amount, network, address } = req.body;

    if (!userId || !amount || !network || !address) {
      return res.status(400).json({ message: "userId, amount, network, and address are required" });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!["trc20", "polygon", "ton", "bep20"].includes(network)) {
      return res.status(400).json({ message: "Invalid network" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < withdrawAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance immediately (hold funds)
    user.balance -= withdrawAmount;
    await user.save();

    const transaction = new Transaction({
      userId,
      type: "withdraw",
      amount: withdrawAmount,
      network,
      address,
      status: "pending"
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
