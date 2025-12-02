import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { Message, Sender, AnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Chat instance storage to maintain session state outside of React render cycle if needed, 
// though we usually manage this via React state for the UI.
let currentChatSession: Chat | null = null;

export const initializeChat = (systemInstruction: string) => {
  currentChatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 1.0, // Higher temperature for more varied/natural roleplay responses
    },
  });
  return currentChatSession;
};

export const sendMessageToAI = async (text: string): Promise<string> => {
  if (!currentChatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const result = await currentChatSession.sendMessage({ message: text });
    return result.text || "（对方沉默了...）";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "系统错误：无法连接到对方。请稍后再试。";
  }
};

export const analyzeConversation = async (
  scenarioTitle: string,
  messages: Message[]
): Promise<AnalysisResult> => {
  
  // Convert messages to a transcript string
  const transcript = messages
    .map((m) => `${m.sender === Sender.USER ? '用户' : '对方'}: ${m.text}`)
    .join('\n');

  const prompt = `
    Analyze the following role-play conversation based on the scenario: "${scenarioTitle}".
    The user is "用户" and the role-play partner is "对方".
    
    Evaluate the user's social skills, empathy, clarity, and goal achievement.
    
    Transcript:
    ${transcript}
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "A score from 0 to 100 based on performance." },
      summary: { type: Type.STRING, description: "A brief summary of how the conversation went." },
      strengths: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 2-3 things the user did well." 
      },
      improvements: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 2-3 specific advice for improvement." 
      },
      toneAnalysis: { type: Type.STRING, description: "Analysis of the user's tone (e.g., aggressive, passive, confident, empathetic)." }
    },
    required: ["score", "summary", "strengths", "improvements", "toneAnalysis"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    // Fallback data in case of failure
    return {
      score: 0,
      summary: "分析生成失败，请检查网络连接。",
      strengths: [],
      improvements: [],
      toneAnalysis: "未知"
    };
  }
};
