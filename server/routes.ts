import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema, insertTransactionSchema, insertGameSchema, insertPriceHistorySchema } from "@shared/schema";
import { z } from "zod";

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

  // Get current user (for demo, we'll use the default user)
  app.get("/api/user/current", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("player1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Place a bet
  app.post("/api/bets", async (req, res) => {
    try {
      const betData = insertBetSchema.parse(req.body);
      const user = await storage.getUserByUsername("player1");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userBalance = parseFloat(user.balance);
      const betAmount = parseFloat(betData.amount);

      if (userBalance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const game = await storage.getCurrentGame();
      if (!game || game.phase !== "betting") {
        return res.status(400).json({ message: "Betting not available" });
      }

      // Deduct bet amount from user balance
      await storage.updateUserBalance(user.id, (userBalance - betAmount).toFixed(2));

      // Create bet
      const bet = await storage.createBet({
        ...betData,
        userId: user.id,
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
      const user = await storage.getUserByUsername("player1");
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
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        type: "deposit"
      });
      
      const user = await storage.getUserByUsername("player1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transaction = await storage.createTransaction({
        ...transactionData,
        userId: user.id
      });

      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deposit request" });
    }
  });

  // Create withdrawal request
  app.post("/api/transactions/withdraw", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        type: "withdraw"
      });
      
      const user = await storage.getUserByUsername("player1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userBalance = parseFloat(user.balance);
      const withdrawAmount = parseFloat(transactionData.amount);

      if (userBalance < withdrawAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const transaction = await storage.createTransaction({
        ...transactionData,
        userId: user.id
      });

      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
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
      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get pending transactions" });
    }
  });

  app.patch("/api/admin/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const transaction = await storage.updateTransaction(id, { status });
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // If deposit approved, add to user balance
      if (transaction.type === "deposit" && status === "approved") {
        const user = await storage.getUser(transaction.userId!);
        if (user) {
          const newBalance = (parseFloat(user.balance) + parseFloat(transaction.amount)).toFixed(2);
          await storage.updateUserBalance(user.id, newBalance);
        }
      }

      // If withdrawal approved, deduct from user balance
      if (transaction.type === "withdraw" && status === "approved") {
        const user = await storage.getUser(transaction.userId!);
        if (user) {
          const newBalance = (parseFloat(user.balance) - parseFloat(transaction.amount)).toFixed(2);
          await storage.updateUserBalance(user.id, newBalance);
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
    
    const startPrice = parseFloat(priceHistory[0].price);
    const endPrice = parseFloat(priceHistory[1].price);
    const isUp = endPrice > startPrice;
    const result = isUp ? "up" : "down";

    await storage.updateGame(game.id, {
      endPrice: endPrice.toFixed(2),
      result
    });

    // Process each bet
    for (const bet of bets) {
      if (bet.isBot) continue; // Skip bot bets
      
      const userWon = Math.random() < 0.3; // 30% win rate for real users
      const betWon = userWon && bet.side === result;
      
      if (betWon) {
        const winAmount = parseFloat(bet.amount) * 1.9; // 5% fee applied (2.0 - 0.1)
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
