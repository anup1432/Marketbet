
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema, insertTransactionSchema, insertGameSchema, insertPriceHistorySchema } from "@shared/schema";
import { z } from "zod";
import User from "./models/User.js";
import Transaction from "./models/Transaction.js";
import express from "express";

// Import separate route files
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import walletRoutes from "./routes/wallet.js";
import adminRoutes from "./routes/admin.js";

// Bot names for generating realistic players
const botNames = [
  "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sneha Gupta", "Vikram Yadav",
  "Kavya Reddy", "Arjun Patel", "Ananya Das", "Rohit Verma", "Nisha Agarwal",
  "Suresh Rao", "Deepika Iyer", "Ravi Nair", "Pooja Joshi", "Kiran Bhat",
  "Meera Menon", "Ajay Tiwari", "Sonia Kapoor", "Manish Soni", "Rekha Mishra"
];



let gameTimer: NodeJS.Timeout | null = null;

export async function registerRoutes(app: Express): Promise<Server> {

  // Get current game state
  app.get("/api/game/current", async (req, res) => {
    try {
      const game = await storage.getCurrentGame();
      if (!game) {
        // Create initial game
        const newGame = await storage.createGame({
          startPrice: "117650.00",
          phase: "betting",
          timeRemaining: 20
        });
        res.json(newGame);
      } else {
        res.json(game);
      }
    } catch (error) {
      console.error("Error getting current game:", error);
      res.status(500).json({ message: "Failed to get current game" });
    }
  });

  // Get current user based on IP address
  app.get("/api/user/current", async (req, res) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

      // Check if user exists, if not create new user
      let user = await User.findOne({ ipAddress });
      if (!user) {
        const userId = 'user-' + Math.random().toString(36).substr(2, 9);
        user = new User({ userId, ipAddress });
        await user.save();
        // Fetch the user again to get the complete data
        user = await User.findOne({ ipAddress });
      }

      res.json({
        id: user.id,
        username: user.userId,
        balance: parseFloat(user.balance).toFixed(2),
        userId: user.userId
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Place a bet
  app.post("/api/bets", async (req, res) => {
    try {
      const betData = insertBetSchema.parse(req.body);
      const betAmount = parseFloat(betData.amount);
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

      // Get user by IP address
      let user = await User.findOne({ ipAddress });
      if (!user) {
        const userId = 'user-' + Math.random().toString(36).substr(2, 9);
        user = new User({ userId, ipAddress });
        await user.save();
      }

      if (user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const game = await storage.getCurrentGame();
      if (!game || game.phase !== "betting") {
        return res.status(400).json({ message: "Betting not available" });
      }

      // Deduct bet amount from user balance
      user.balance -= betAmount;
      await user.save();

      // Create bet with MongoDB user ID
      const bet = await storage.createBet({
        ...betData,
        userId: user.userId,
        gameId: game.id
      });

      res.json(bet);
    } catch (error) {
      console.error("Error placing bet:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bet data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Get bets for current game
  app.get("/api/bets/current", async (req, res) => {
    try {
      const game = await storage.getCurrentGame();
      if (!game) {
        return res.json([]);
      }

      const bets = await storage.getBetsByGame(game.id);
      res.json(bets);
    } catch (error) {
      console.error("Error getting current bets:", error);
      res.status(500).json({ message: "Failed to get bets" });
    }
  });

  // Get user bet history
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

  // Get price history
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

  // Use separate route files
  app.use("/api/transactions/deposit", depositRoutes);
  app.use("/api/transactions/withdraw", withdrawRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/admin", adminRoutes);

  // Start game timer
  function startGameTimer() {
    if (gameTimer) clearInterval(gameTimer);

    gameTimer = setInterval(async () => {
      try {
        const game = await storage.getCurrentGame();
        if (!game) return;

        const newTimeRemaining = game.timeRemaining - 1;

        if (newTimeRemaining <= 0) {
          if (game.phase === "betting") {
            // Switch to result phase
            await storage.updateGame(game.id, {
              phase: "result",
              timeRemaining: 5
            });

            // Process game result
            await processGameResult(game);
          } else {
            // Start new game
            await startNewGame();
          }
        } else {
          await storage.updateGame(game.id, { timeRemaining: newTimeRemaining });
        }

        // Update price
        await updatePrice();
      } catch (error) {
        console.error("Game timer error:", error);
      }
    }, 1000);
  }

  async function processGameResult(game: any) {
    try {
      const bets = await storage.getBetsByGame(game.id);
      const priceHistory = await storage.getRecentPriceHistory(2);

      if (priceHistory.length < 2) return;

      const startPrice = parseFloat(priceHistory[1].price); // Earlier price
      const endPrice = parseFloat(priceHistory[0].price);   // Latest price
      const isUp = endPrice > startPrice;

      // Get user bets only (exclude bots)
      const userBets = bets.filter(bet => !bet.isBot);
      const upBets = userBets.filter(bet => bet.side === "up");
      const downBets = userBets.filter(bet => bet.side === "down");

      // Calculate total amounts for each side
      const upAmount = upBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
      const downAmount = downBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);

      // Strategic result determination
      let result: "up" | "down";

      if (upBets.length > 0 && downBets.length > 0) {
        // User bet on both sides - smaller amount side wins
        result = upAmount <= downAmount ? "up" : "down";
      } else if (upBets.length > 0 || downBets.length > 0) {
        // User bet only one side - 30% win rate (70% loss)
        const shouldUserWin = Math.random() < 0.30; // 30% win rate

        if (upBets.length > 0) {
          // User only bet UP
          result = shouldUserWin ? "up" : "down";
        } else {
          // User only bet DOWN
          result = shouldUserWin ? "down" : "up";
        }
      } else {
        // No user bets, use actual price movement
        result = isUp ? "up" : "down";
      }

      await storage.updateGame(game.id, {
        endPrice: endPrice.toFixed(2),
        result
      });

      // Process each bet
      for (const bet of bets) {
        if (bet.isBot) {
          // Bot bets - random win/loss for simulation
          const botWon = Math.random() < 0.45;
          await storage.updateBet(bet.id, {
            isWin: botWon && bet.side === result,
            winAmount: botWon && bet.side === result ? (parseFloat(bet.amount) * 1.9).toFixed(2) : undefined
          });
          continue;
        }

        // User bets - win if prediction matches result
        const betWon = bet.side === result;

        if (betWon) {
          const winAmount = parseFloat(bet.amount) * 1.9; // 1.9x payout (5% house edge)
          await storage.updateBet(bet.id, {
            isWin: true,
            winAmount: winAmount.toFixed(2)
          });

          // Add winnings to user balance
          const user = await User.findOne({ userId: bet.userId });
          if (user) {
            user.balance += winAmount;
            await user.save();
            console.log(`User ${user.userId} won ${winAmount}, new balance: ${user.balance}`);
          }
        } else {
          await storage.updateBet(bet.id, { isWin: false });
        }
      }
    } catch (error) {
      console.error("Error processing game result:", error);
    }
  }

  async function startNewGame() {
    try {
      const priceHistory = await storage.getRecentPriceHistory(1);
      const currentPrice = priceHistory.length > 0 ? priceHistory[0].price : "117650.00";

      const newGame = await storage.createGame({
        startPrice: currentPrice,
        phase: "betting",
        timeRemaining: 20
      });

      // Generate bot bets
      await generateBotBets(newGame.id);
    } catch (error) {
      console.error("Error starting new game:", error);
    }
  }

  async function generateBotBets(gameId: string) {
    try {
      const numBots = Math.floor(Math.random() * 20) + 15; // 15-35 bots

      for (let i = 0; i < numBots; i++) {
        const botName = botNames[Math.floor(Math.random() * botNames.length)];
        const side = Math.random() > 0.5 ? "up" : "down";
        const amounts = ["1", "5", "10", "20", "50"];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];

        await storage.createBet({
          gameId,
          side,
          amount,
          isBot: true,
          botName
        });
      }
    } catch (error) {
      console.error("Error generating bot bets:", error);
    }
  }

  async function updatePrice() {
    try {
      const priceHistory = await storage.getRecentPriceHistory(1);
      const currentPrice = priceHistory.length > 0 ? parseFloat(priceHistory[0].price) : 117650;

      const variation = (Math.random() - 0.5) * 500;
      const newPrice = Math.max(1000, currentPrice + variation); // Minimum price of $1000

      await storage.addPriceHistory({ price: newPrice.toFixed(2) });
    } catch (error) {
      console.error("Error updating price:", error);
    }
  }

  // Initialize game timer
  startGameTimer();

  const httpServer = createServer(app);
  return httpServer;
}
