import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// ✅ Create deposit request
router.post("/", async (req, res) => {
  try {
    const { amount, network, address } = req.body;

    // 1. Validate required fields
    if (!amount || !network || !address) {
      return res.status(400).json({ success: false, message: "Amount, network, and address are required" });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // 2. Validate network
    const allowedNetworks = ["trc20", "polygon", "ton", "bep20"];
    if (!allowedNetworks.includes(network.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid network" });
    }

    // 3. Get user by IP (or create new)
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    let user = await User.findOne({ ipAddress });
    if (!user) {
      const userId = "user-" + Math.random().toString(36).substring(2, 9);
      user = new User({ userId, ipAddress });
      await user.save();
      console.log("✅ New user created:", user.userId);
    }

    // 4. Create transaction
    const transaction = new Transaction({
      userId: user.userId,
      type: "deposit",
      amount: parsedAmount,
      network: network.toLowerCase(),
      address,
      status: "pending",
      createdAt: new Date()
    });

    await transaction.save();

    console.log("✅ Deposit transaction created:", transaction);

    // 5. Return success response
    return res.status(201).json({
      success: true,
      message: "Deposit request created successfully",
      transaction,
    });

  } catch (error) {
    console.error("❌ Error creating deposit:", error);
    return res.status(500).json({ success: false, message: "Failed to create deposit request" });
  }
});

export default router;
