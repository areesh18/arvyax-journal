import express from "express";
import dotenv from "dotenv";
import journalRoutes from "./routes/journal.js";
import pool from "./db/index.js";
import cors from "cors";
import rateLimit from "express-rate-limit";
dotenv.config();

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Analyze limit reached, slow down." },
});
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use("/api/journal/analyze", analyzeLimiter);
app.use("/api/journal", journalRoutes);

const createTables = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS journal_entries (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(100) NOT NULL,
            ambience VARCHAR(50) NOT NULL,
            text TEXT NOT NULL,
            emotion VARCHAR(100),
            keywords TEXT[],
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
  console.log("Tables ready");
};

const start = async () => {
  await createTables();
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
};
start();
