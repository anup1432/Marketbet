import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from "mongoose";
import { Telegraf } from "telegraf";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // ✅ MongoDB connection
  const mongoURL =
    process.env.MONGODB_URI ||
    "mongodb+srv://anup1432:%40nup1432@betwin-cluster.ubok6wv.mongodb.net/betwin?retryWrites=true&w=majority&appName=betwin-cluster";

  try {
    await mongoose.connect(mongoURL);
    log("MongoDB connected successfully");
  } catch (err) {
    log("MongoDB connection error:", err);
    process.exit(1);
  }

  // ✅ Telegram bot setup (Webhook instead of polling)
  const bot = new Telegraf(process.env.BOT_TOKEN!);

  bot.start((ctx) => ctx.reply("🤖 Bot is running on Render 🚀"));
  bot.hears("hi", (ctx) => ctx.reply("Hello 👋"));

  // Webhook callback
  app.use(bot.webhookCallback("/telegram-bot"));

  // Register webhook URL with Telegram
  if (process.env.RENDER_EXTERNAL_URL) {
    await bot.telegram.setWebhook(
      `${process.env.RENDER_EXTERNAL_URL}/telegram-bot`
    );
    log("Telegram bot webhook set successfully ✅");
  } else {
    log("⚠️ Warning: RENDER_EXTERNAL_URL not set, Telegram bot may not work");
  }

  // ✅ Your app routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ✅ Vite setup (only in dev)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ Render requires PORT
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
