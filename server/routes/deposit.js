
import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Create deposit request
router.post("/", async (req, res) => {
  try {
    const { amount, network, address } = req.body;
    
    // Validate required fields
    if (!amount || !network || !address) {
      return res.status(400).json({ message: "Amount, network, and address are required" });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!["trc20", "polygon", "ton", "bep20"].includes(network)) {
      return res.status(400).json({ message: "Invalid network" });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // Check if user exists, if not create new user
    let user = await User.findOne({ ipAddress });
    if (!user) {
      const userId = 'user-' + Math.random().toString(36).substr(2, 9);
      user = new User({ userId, ipAddress });
      await user.save();
    }

    const transaction = new Transaction({
      userId: user.userId,
      type: 'deposit',
      amount: parsedAmount,
      network,
      address,
      status: 'pending'
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
