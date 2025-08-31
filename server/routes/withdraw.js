import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// ✅ Create withdrawal request
router.post("/", async (req, res) => {
  try {
    const { amount, network, address } = req.body;

    // 1. Validate required fields
    if (!amount || !network || !address) {
      return res.status(400).json({ success: false, message: "Amount, network, and address are required" });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // 2. Validate network
    const allowedNetworks = ["trc20", "polygon", "ton", "bep20"];
    if (!allowedNetworks.includes(network.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid network" });
    }

    // 3. Get user by IP
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const user = await User.findOne({ ipAddress });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 4. Balance check
    if (user.balance < withdrawAmount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // 5. Create withdrawal transaction
    const transaction = new Transaction({
      userId: user.userId,
      type: "withdraw",
      amount: withdrawAmount,
      network: network.toLowerCase(),
      address,
      status: "pending",
      createdAt: new Date()
    });

    await transaction.save();

    // ⚡ Update user balance immediately (optional: or wait for admin approval)
    user.balance -= withdrawAmount;
    await user.save();

    console.log("✅ Withdrawal transaction created:", transaction);

    return res.status(201).json({
      success: true,
      message: "Withdrawal request created successfully",
      transaction,
    });

  } catch (error) {
    console.error("❌ Error creating withdrawal:", error);
    return res.status(500).json({ success: false, message: "Failed to create withdrawal request" });
  }
});

export default router;
