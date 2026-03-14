import express, { Router } from "express";
import pool from "../db/index.js";
import { analyzeEmotion } from "../services/llm.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, ambience, text } = req.body;
  const result = await pool.query(
    `INSERT INTO journal_entries (user_id, ambience, text) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
    [userId, ambience, text],
  );

  res.json(result.rows[0]);
});
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    `SELECT * FROM journal_entries
    WHERE user_id = $1
    ORDER BY created_at DESC`,
    [userId],
  );
  res.json(result.rows);
});

router.post("/analyze", async (req, res) => {
  const { text } = req.body;
  const analysis = await analyzeEmotion(text);
  res.json(analysis)
});
export default router;
