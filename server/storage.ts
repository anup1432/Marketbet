import { type User, type InsertUser, type Game, type InsertGame, type Bet, type InsertBet, type Transaction, type InsertTransaction, type PriceHistory, type InsertPriceHistory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: string, balance: string): Promise<User | undefined>;
  
  // Games
  getCurrentGame(): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Bets
  createBet(bet: InsertBet): Promise<Bet>;
  getBetsByGame(gameId: string): Promise<Bet[]>;
  getBetsByUser(userId: string): Promise<Bet[]>;
  updateBet(id: string, updates: Partial<Bet>): Promise<Bet | undefined>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getPendingTransactions(): Promise<Transaction[]>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Price History
  addPriceHistory(price: InsertPriceHistory): Promise<PriceHistory>;
  getRecentPriceHistory(limit: number): Promise<PriceHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private games: Map<string, Game> = new Map();
  private bets: Map<string, Bet> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private priceHistory: PriceHistory[] = [];
  private currentGameId: string | null = null;

  constructor() {
    // Create default user
    this.createUser({ username: "player1", balance: "100.00" });
    
    // Initialize with some price history
    const basePrice = 117650;
    for (let i = 0; i < 50; i++) {
      const variation = (Math.random() - 0.5) * 1000;
      this.addPriceHistory({ price: (basePrice + variation).toFixed(2) });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: string, balance: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.balance = balance;
      this.users.set(id, user);
    }
    return user;
  }

  async getCurrentGame(): Promise<Game | undefined> {
    if (!this.currentGameId) return undefined;
    return this.games.get(this.currentGameId);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = { 
      ...insertGame, 
      id, 
      createdAt: new Date() 
    };
    this.games.set(id, game);
    this.currentGameId = id;
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (game) {
      Object.assign(game, updates);
      this.games.set(id, game);
    }
    return game;
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = randomUUID();
    const bet: Bet = { 
      ...insertBet, 
      id, 
      createdAt: new Date() 
    };
    this.bets.set(id, bet);
    return bet;
  }

  async getBetsByGame(gameId: string): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.gameId === gameId);
  }

  async getBetsByUser(userId: string): Promise<Bet[]> {
    return Array.from(this.bets.values())
      .filter(bet => bet.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async updateBet(id: string, updates: Partial<Bet>): Promise<Bet | undefined> {
    const bet = this.bets.get(id);
    if (bet) {
      Object.assign(bet, updates);
      this.bets.set(id, bet);
    }
    return bet;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: new Date() 
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === "pending")
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      Object.assign(transaction, updates);
      this.transactions.set(id, transaction);
    }
    return transaction;
  }

  async addPriceHistory(insertPrice: InsertPriceHistory): Promise<PriceHistory> {
    const id = randomUUID();
    const priceRecord: PriceHistory = { 
      ...insertPrice, 
      id, 
      timestamp: new Date() 
    };
    this.priceHistory.push(priceRecord);
    
    // Keep only last 100 records
    if (this.priceHistory.length > 100) {
      this.priceHistory = this.priceHistory.slice(-100);
    }
    
    return priceRecord;
  }

  async getRecentPriceHistory(limit: number): Promise<PriceHistory[]> {
    return this.priceHistory.slice(-limit);
  }
}

export const storage = new MemStorage();
