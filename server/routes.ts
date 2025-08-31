import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema, insertTransactionSchema, insertGameSchema, insertPriceHistorySchema } from "@shared/schema";
import { z } from "zod";
import User from "./models/User.js";
import Transaction from "./models/Transaction.js";
import express from "express";

// Import separate route files
import userRoutes from "./routes/user.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import walletRoutes from "./routes/wallet.js";
import adminRoutes from "./routes/admin.js";

// Bot names for generating realistic players
const BOT_NAMES = [
  "Raj Kumar", "Priya Sharma", "Amit Singh", "Sneha Patel", "Vikram Gupta",
  "Anita Roy", "Rohit Verma", "Kavya Nair", "Suresh Reddy", "Meera Joshi",
  "Arjun Das", "Pooja Mehta", "Ravi Kumar", "Deepika Agarwal", "Sanjay Yadav"
];

// Game state
let currentGame: any = null;
let gameTimer: NodeJS.Timeout | null = null;
let priceUpdateTimer: NodeJS.Timeout | null = null;
let bots: any[] = [];
let currentPrice = 117650.00;
let priceHistory: any[] = [];

// Initialize price history
const initializePriceHistory = () => {
  const now = Date.now();
  for (let i = 50; i >= 0; i--) {
    priceHistory.push({
      timestamp: now - (i * 5000), // 5 second intervals
      price: currentPrice + (Math.random() - 0.5) * 1000
    });
  }
};

const generateRandomPrice = () => {
  const change = (Math.random() - 0.5) * 500; // Random change of ±250
  const newPrice = Math.max(100000, currentPrice + change);
  currentPrice = newPrice;

  priceHistory.push({
    timestamp: Date.now(),
    price: newPrice
  });

  // Keep only last 50 entries
  if (priceHistory.length > 50) {
    priceHistory.shift();
  }

  return newPrice;
};

const createNewGame = async () => {
  const gameId = `game-${Date.now()}`;

  currentGame = {
    id: gameId,
    phase: "betting",
    startTime: Date.now(),
    duration: 30000, // 30 seconds
    startPrice: currentPrice,
    endPrice: null,
    bets: []
  };

  // Start betting phase
  console.log(`New game started: ${gameId}`);

  // Generate some bot bets
  setTimeout(() => {
    generateBotBets();
  }, Math.random() * 10000); // Random delay up to 10 seconds

  // End betting phase after 30 seconds
  gameTimer = setTimeout(async () => {
    if (currentGame) {
      currentGame.phase = "calculating";

      // Generate final price after 5 seconds
      setTimeout(async () => {
        const finalPrice = generateRandomPrice();
        currentGame.endPrice = finalPrice;
        currentGame.phase = "finished";

        // Process all bets
        await processBets();

        // Start new game after 5 seconds
        setTimeout(() => {
          createNewGame();
        }, 5000);
      }, 5000);
    }
  }, 30000);
};

const generateBotBets = () => {
  const numBots = Math.floor(Math.random() * 8) + 3; // 3-10 bots

  for (let i = 0; i < numBots; i++) {
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const side = Math.random() > 0.5 ? "up" : "down";
    const amount = [10, 25, 50, 100, 250][Math.floor(Math.random() * 5)];

    if (currentGame) {
      currentGame.bets.push({
        id: `bot-bet-${Date.now()}-${i}`,
        userId: botName,
        side,
        amount,
        isBot: true,
        timestamp: Date.now()
      });
    }
  }
};

const processBets = async () => {
  if (!currentGame || !currentGame.endPrice) return;

  const isUp = currentGame.endPrice > currentGame.startPrice;
  const winSide = isUp ? "up" : "down";

  // Process real user bets only
  const userBets = currentGame.bets.filter((bet: any) => !bet.isBot);

  for (const bet of userBets) {
    try {
      const user = await User.findOne({ username: bet.userId });
      if (user) {
        const isWin = bet.side === winSide;
        const winAmount = isWin ? bet.amount * 1.3 : 0; // 130% return

        if (isWin) {
          user.balance += winAmount;
          await user.save();
        }

        // Save bet to history
        bet.isWin = isWin;
        bet.winAmount = winAmount;
        bet.gameId = currentGame.id;
        bet.finalPrice = currentGame.endPrice;

        // Store in storage for history
        const existingBets = await storage.get("betHistory") || [];
        existingBets.unshift(bet);

        // Keep only last 100 bets
        if (existingBets.length > 100) {
          existingBets.splice(100);
        }

        await storage.set("betHistory", existingBets);
      }
    } catch (error) {
      console.error("Error processing bet:", error);
    }
  }
};

function startPriceUpdates() {
  // Clear any existing timer and start a new one
  if (priceUpdateTimer) clearInterval(priceUpdateTimer);
  priceUpdateTimer = setInterval(() => {
    generateRandomPrice();
  }, 5000);
}

export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Initialize price history and game
  initializePriceHistory();

  // Start price updates every 5 seconds
  startPriceUpdates();

  // Use the separate route modules
  app.use("/api/user", userRoutes);
  app.use("/api/transactions/deposit", depositRoutes);
  app.use("/api/transactions/withdraw", withdrawRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/admin", adminRoutes);

  // Get current user by username
  app.get("/api/user/current", async (req, res) => {
    try {
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Game endpoints
  app.get("/api/game/current", async (req, res) => {
    if (!currentGame) {
      await createNewGame();
    }
    res.json(currentGame);
  });

  // Price history endpoint
  app.get("/api/price/history", async (req, res) => {
    res.json(priceHistory);
  });

  // Current bets endpoint
  app.get("/api/bets/current", async (req, res) => {
    if (currentGame && currentGame.bets) {
      res.json(currentGame.bets);
    } else {
      res.json([]);
    }
  });

  // Bet history endpoint
  app.get("/api/bets/history", async (req, res) => {
    try {
      const history = await storage.get("betHistory") || [];
      res.json(history);
    } catch (error) {
      res.json([]);
    }
  });

  // Betting endpoints
  app.post("/api/bets", async (req, res) => {
    try {
      const { side, amount, userId } = req.body;

      if (!currentGame || currentGame.phase !== "betting") {
        return res.status(400).json({ message: "Betting is not available right now" });
      }

      const user = await User.findOne({ username: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const betAmount = parseFloat(amount);
      if (user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct balance
      user.balance -= betAmount;
      await user.save();

      // Add bet to current game
      const bet = {
        id: `bet-${Date.now()}`,
        userId: user.username,
        side,
        amount: betAmount,
        isBot: false,
        timestamp: Date.now()
      };

      currentGame.bets.push(bet);

      res.json({ message: "Bet placed successfully", bet });
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Start the first game
  createNewGame();

  return server;
}
