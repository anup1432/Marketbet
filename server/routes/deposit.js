import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Create deposit request
router.post("/", async (req, res) => {
  try {
    const { userId, amount, network, address } = req.body;

    if (!userId || !amount || !network || !address) {
      return res.status(400).json({ message: "userId, amount, network, and address are required" });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!["trc20", "polygon", "ton", "bep20"].includes(network)) {
      return res.status(400).json({ message: "Invalid network" });
    }

    // Find or create user
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, balance: 0 });
      await user.save();
    }

    const transaction = new Transaction({
      userId,
      type: "deposit",
      amount: depositAmount,
      network,
      address,
      status: "pending"
    });

    await transaction.save();
    console.log("Deposit transaction created:", transaction);
    res.json(transaction);
  } catch (error) {
    console.error("Error creating deposit:", error);
    res.status(500).json({ message: "Failed to create deposit request" });
  }
});

export default router;
