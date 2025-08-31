
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get current user by IP
router.get("/current", async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    
    let user = await User.findOne({ ipAddress });
    if (!user) {
      const userId = 'user-' + Math.random().toString(36).substr(2, 9);
      user = new User({ userId, ipAddress });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
});

export default router;
