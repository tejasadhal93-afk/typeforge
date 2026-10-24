const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config(); // fallback to cwd .env
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/typeforge";

const fs       = require("fs");

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth",        require("./routes/auth"));
app.use("/api/sessions",    require("./routes/sessions"));
app.use("/api/leaderboard", require("./routes/leaderboard"));

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Serve frontend build if dist folder exists (Single-Service Full-Stack Deployment)
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// 404 handler for API routes
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Connect to MongoDB then start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected:", MONGO_URI);
    app.listen(PORT, () => console.log(`🚀 TypeForge API running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.warn("⚠️  MongoDB connection failed:", err.message);
    console.warn("   The API server will NOT start. Frontend falls back to offline mode.");
    console.warn("   Fix: Run 'mongod' or set MONGODB_URI in server/.env");
    process.exit(1);
  });
