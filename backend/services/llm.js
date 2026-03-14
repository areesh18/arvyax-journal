import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeEmotion = async (text) => {
  const prompt = `
        Analyze this journal entry and return a JSON object with exactly these keys:
        "emotion" (single word), "keywords" (array of 3 words), "summary" (one sentence)
        
        Journal entry: "${text}"
    `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction:
        "You are an emotion analysis AI. Always respond with valid JSON only containing emotion (single word), keywords (array of 3 words), summary (one sentence).",
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
};
