
export enum Sender {
  USER = 'user',
  AI = 'model'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
}

export enum Difficulty {
  EASY = '入门',
  MEDIUM = '进阶',
  HARD = '挑战'
}

export enum Category {
  DORM = '宿舍关系',
  ACADEMIC = '师生沟通',
  ROMANCE = '情感恋爱',
  CAREER = '社团职场',
  SOCIAL = '日常社交',
  INTERPERSONAL = '人际交往'
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  systemInstruction: string;
  initialMessage: string; // The first message the AI sends to start the roleplay
  icon: string; // Emoji
  backgroundImage?: string; // Optional background image URL
}

export interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  toneAnalysis: string;
}

export interface ChatSession {
  scenarioId: string;
  messages: Message[];
}
