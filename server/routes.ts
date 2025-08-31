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

let currentGame: any = null;
let gameTimer: NodeJS.Timeout | null = null;
let priceUpdateTimer: NodeJS.Timeout | null = null;

export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Use the separate route modules
  app.use("/api/user", userRoutes);
  app.use("/api/deposit", depositRoutes);
  app.use("/api/withdraw", withdrawRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/admin", adminRoutes);

  // Get current user
  app.get("/api/user/current", async (req, res) => {
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

  // Game endpoints
  app.get("/api/game/current", async (req, res) => {
    if (!currentGame) {
      await createNewGame();
    }
    res.json(currentGame);
  });

  // Betting endpoints
  app.post("/api/bets", async (req, res) => {
    try {
      const { side, amount } = req.body;

      if (!currentGame || currentGame.phase !== "betting") {
        return res.status(400).json({ message: "Betting is not available right now" });
      }

      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
      let user = await User.findOne({ ipAddress });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const betAmount = parseFloat(amount);
      if (user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct amount from user balance
      user.balance -= betAmount;
      await user.save();

      const bet = {
        id: Math.random().toString(36),
        userId: user.userId,
        gameId: currentGame.id,
        side,
        amount: betAmount,
        createdAt: new Date()
      };

      // Persist bet to storage
      await storage.createBet(bet);

      res.json(bet);
    } catch (error) {
      console.error("Error creating bet:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bet data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bet" });
    }
  });

  app.get("/api/bets/current", async (req, res) => {
    if (!currentGame) {
      return res.json([]);
    }

    // Generate some bot bets for display
    const botBets = generateBotBets(currentGame.id);
    res.json(botBets);
  });

  app.get("/api/bets/history", async (req, res) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const user = await User.findOne({ ipAddress });

      if (!user) {
        return res.json([]);
      }

      const bets = await storage.getBetsByUser(user.userId);
      res.json(bets);
    } catch (error) {
      console.error("Error getting bet history:", error);
      res.status(500).json({ message: "Failed to get bet history" });
    }
  });

  // Price endpoints
  app.get("/api/price/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const priceHistory = await storage.getRecentPriceHistory(limit);
      res.json(priceHistory);
    } catch (error) {
      console.error("Error getting price history:", error);
      res.status(500).json({ message: "Failed to get price history" });
    }
  });

  // Start game engine
  startGameEngine();
  startPriceUpdates();

  return server;
}

async function createNewGame() {
  const priceHistory = await storage.getRecentPriceHistory(1);
  const startPrice = priceHistory.length > 0 ? priceHistory[0].price : "118000.00";

  currentGame = {
    id: Math.random().toString(36).substring(2),
    startPrice,
    phase: "betting",
    timeRemaining: 20,
    createdAt: new Date()
  };
  // Save the initial game state
  await storage.createGame(currentGame);
}

function generateBotBets(gameId: string) {
  const numBets = Math.floor(Math.random() * 8) + 3; // 3-10 bets
  const bets = [];

  for (let i = 0; i < numBets; i++) {
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const side = Math.random() > 0.5 ? "up" : "down";
    const amount = Math.floor(Math.random() * 500) + 50; // 50-550

    const botBet = {
      id: Math.random().toString(36).substring(2),
      userId: `bot-${Math.random().toString(36).substr(2, 5)}`,
      gameId,
      side,
      amount: amount.toFixed(2),
      isBot: true,
      botName,
      createdAt: new Date(Date.now() - Math.random() * 20000) // Random time within betting period
    };
    bets.push(botBet);
  }

  // Sort bets by creation time (newest first)
  bets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Persist bot bets to storage
  bets.forEach(bet => storage.createBet(bet));

  return bets;
}

async function startGameEngine() {
  async function runGameCycle() {
    // Ensure a game exists, create one if not
    if (!currentGame) {
      await createNewGame();
    }

    if (currentGame.phase === "betting") {
      currentGame.timeRemaining--;

      if (currentGame.timeRemaining <= 0) {
        // Move to result phase
        currentGame.phase = "result";
        currentGame.timeRemaining = 5; // Time to display results

        // Set end price based on the latest price history
        const priceHistory = await storage.getRecentPriceHistory(1);
        currentGame.endPrice = priceHistory.length > 0 ? priceHistory[0].price : currentGame.startPrice;

        // Determine the result based on price movement
        const startPrice = parseFloat(currentGame.startPrice);
        const endPrice = parseFloat(currentGame.endPrice);
        currentGame.result = endPrice > startPrice ? "up" : "down";

        // Update the game state in storage
        await storage.updateGame(currentGame.id, {
          phase: currentGame.phase,
          timeRemaining: currentGame.timeRemaining,
          endPrice: currentGame.endPrice,
          result: currentGame.result
        });

        // Process bets for the completed game
        await processBets(currentGame);
      } else {
        // Update game time remaining if still in betting phase
        await storage.updateGame(currentGame.id, { timeRemaining: currentGame.timeRemaining });
      }
    } else if (currentGame.phase === "result") {
      currentGame.timeRemaining--;

      if (currentGame.timeRemaining <= 0) {
        // Start a new game
        await createNewGame();
      } else {
        // Update game time remaining if still in result phase
        await storage.updateGame(currentGame.id, { timeRemaining: currentGame.timeRemaining });
      }
    }
  }

  // Clear any existing timer and start a new one
  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(runGameCycle, 1000);
}

async function processBets(game: any) {
  try {
    const bets = await storage.getBetsByGame(game.id);
    const priceHistory = await storage.getRecentPriceHistory(2); // Need two points for comparison

    if (priceHistory.length < 2) {
      console.error("Not enough price history to determine result.");
      return; // Cannot process if we don't have enough price data
    }

    const startPrice = parseFloat(priceHistory[1].price); // Earlier price
    const endPrice = parseFloat(priceHistory[0].price);   // Latest price
    const isActualUp = endPrice > startPrice;

    // Determine the game result based on the strategy
    // The game's result is already set in `game.result` during the transition
    const gameResult = game.result;

    // Process each bet
    for (const bet of bets) {
      let winAmount: string | undefined = undefined;
      let isWin = false;

      if (bet.isBot) {
        // Bot bets - simulate win/loss based on game result with a slight bias
        const botWon = Math.random() < 0.45; // Bot win chance
        isWin = botWon && bet.side === gameResult;
        if (isWin) {
          winAmount = (parseFloat(bet.amount) * 1.9).toFixed(2); // 1.9x payout
        }
      } else {
        // User bets - win if prediction matches game result
        isWin = bet.side === gameResult;
        if (isWin) {
          winAmount = (parseFloat(bet.amount) * 1.9).toFixed(2); // 1.9x payout (5% house edge)
          // Add winnings to user balance
          const user = await User.findOne({ userId: bet.userId });
          if (user) {
            user.balance += parseFloat(winAmount);
            await user.save();
            console.log(`User ${user.userId} won ${winAmount}, new balance: ${user.balance}`);
          }
        }
      }

      // Update bet status in storage
      await storage.updateBet(bet.id, { isWin, winAmount });
    }
  } catch (error) {
    console.error("Error processing bets:", error);
  }
}


function startPriceUpdates() {
  async function updatePrice() {
    try {
      const lastPriceHistory = await storage.getRecentPriceHistory(1);
      const currentPrice = lastPriceHistory.length > 0 ? parseFloat(lastPriceHistory[0].price) : 118000;

      // Generate realistic price movement: a random variation around the current price
      const variation = (Math.random() - 0.5) * 200; // ±100
      let newPrice = currentPrice + variation;

      // Ensure price doesn't go below a minimum threshold
      newPrice = Math.max(newPrice, 50000); // Minimum price of $50,000

      await storage.addPriceHistory({ price: newPrice.toFixed(2) });
    } catch (error) {
      console.error("Error updating price:", error);
    }
  }

  // Clear any existing timer and start a new one
  if (priceUpdateTimer) clearInterval(priceUpdateTimer);
  priceUpdateTimer = setInterval(updatePrice, 2000); // Update price every 2 seconds
}