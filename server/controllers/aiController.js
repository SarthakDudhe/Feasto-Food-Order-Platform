import { GoogleGenAI } from "@google/genai";
import { GeminiChatPrompt } from "../prompt/Foodprompt.js";
import foodModel from "../models/foodModel.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateRecommendations = async (req, res) => {
  try {
    const { inp_text } = req.body;

    const prompt = GeminiChatPrompt(inp_text);

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      return res.json({
        success: false,
        message: "Unable to generate a response."
      });
    }

    let cleanedText = text;
    // Strip markdown codeblock if present
    if (cleanedText.includes("```")) {
      const match = cleanedText.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleanedText = match[1].trim();
      } else {
        cleanedText = cleanedText.replace(/```/g, "").trim();
      }
    }

    try {
      const parsed = JSON.parse(cleanedText);
      
      let matchedItems = [];
      if (parsed.intent === "recommend" && parsed.recommendedItems && parsed.recommendedItems.length > 0) {
        // Find matching food items in the database by exact name (case-insensitive for safety)
        const regexNames = parsed.recommendedItems.map(name => new RegExp(`^${name.trim()}$`, "i"));
        matchedItems = await foodModel.find({ name: { $in: regexNames } });
      }

      return res.json({
        success: true,
        intent: parsed.intent,
        message: parsed.message,
        items: matchedItems
      });

    } catch (parseError) {
      console.error("JSON parsing error for Gemini output:", parseError, text);
      // Fallback response: treat the whole text as chat message
      return res.json({
        success: true,
        intent: "chat",
        message: text,
        items: []
      });
    }

  } catch (error) {
    console.error("aiController error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
    });
  }
};



