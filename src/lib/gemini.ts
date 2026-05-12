import { GoogleGenAI } from "@google/genai";

// Use the user's provided API key or fallback to environment variable
export const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBdRy2AwADanBucdbWH8KKuvf3IDKeQ5sg" || process.env.GEMINI_API_KEY || '' 
});

export const MODELS = {
  FLASH: "gemini-2.0-flash",
  PRO: "gemini-2.0-pro-exp",
  TTS: "gemini-1.5-flash",
};
