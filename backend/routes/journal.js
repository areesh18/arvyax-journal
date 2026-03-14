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
  const { text, entryId } = req.body;
  const analysis = await analyzeEmotion(text);
  await pool.query(
    `UPDATE journal_entries
    SET emotion= $1, keywords=$2, summary=$3
    WHERE id= $4`,
    [analysis.emotion, analysis.keywords, analysis.summary, entryId],
  );
  res.json(analysis);
});

router.get("/insights/:userId", async (req, res) => {
  const { userId } = req.params;
  const totalResult = await pool.query(
    `SELECT COUNT(*) 
    FROM journal_entries
    WHERE user_id=$1`,
    [userId],
  );

  const topEmotionResult = await pool.query(
    `SELECT emotion, COUNT(*) as count
    FROM journal_entries 
    WHERE user_id=$1 AND emotion IS NOT NULL
    GROUP BY emotion
    ORDER BY count DESC
    LIMIT 1`,
    [userId],
  );
  const topAmbienceResult = await pool.query(
    `SELECT ambience, COUNT(*) as count 
         FROM journal_entries 
         WHERE user_id = $1
         GROUP BY ambience 
         ORDER BY count DESC 
         LIMIT 1`,
    [userId],
  );

  const keywordsResult = await pool.query(
    `SELECT keywords FROM journal_entries 
         WHERE user_id = $1 AND keywords IS NOT NULL
         ORDER BY created_at DESC 
         LIMIT 5`,
    [userId],
  );
  const recentKeywords = keywordsResult.rows
    .flatMap((row) => row.keywords)
    .slice(0, 10);

  res.json({
    totalEntries: parseInt(totalResult.rows[0].count),
    topEmotion: topEmotionResult.rows[0]?.emotion || null,
    mostUsedAmbience: topAmbienceResult.rows[0]?.ambience || null,
    recentKeywords,
  });
});
export default router;
