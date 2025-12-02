import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not set in environment - analysis route may fail');
}

// 创建GoogleGenAI实例，只有在有密钥时
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { scenarioTitle, messages } = req.body as { scenarioTitle?: string; messages?: Array<any> };

    if (!scenarioTitle || !messages) {
      return res.status(400).json({ error: 'Missing scenarioTitle or messages' });
    }

    if (!apiKey || !ai) {
      return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY not set or invalid' });
    }

    const transcript = messages.map((m: any) => `${m.sender === 'user' ? '用户' : '对方'}: ${m.text}`).join('\n');

    const prompt = `Analyze the following role-play conversation based on the scenario: "${scenarioTitle}".\nThe user is \"用户\" and the role-play partner is \"对方\".\n\nTranscript:\n${transcript}\n\nPlease return a JSON object with the following structure:\n{\n  "score": number, // 1-10分的评分\n  "summary": string, // 简要总结\n  "strengths": string[], // 用户表现的优点\n  "improvements": string[], // 需要改进的地方\n  "toneAnalysis": string // 语言和语气分析\n}`;

    // 尝试使用备用模型
    let response;
    try {
      // 首先尝试使用指定模型
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        }
      });
    } catch (modelError) {
      console.warn('Primary model failed, trying fallback...', modelError);
      // 如果失败，尝试备用模型
      response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        }
      });
    }

    // 安全获取文本响应
    const jsonText = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || '{}';
    
    // 解析并验证响应
    let parsed = {} as any;
    try {
      parsed = JSON.parse(jsonText);
      // 确保返回的数据包含所有必需字段
      parsed = {
        score: parsed.score || 0,
        summary: parsed.summary || '解析结果为空',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        toneAnalysis: parsed.toneAnalysis || '未知'
      };
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      parsed = { score: 0, summary: '解析结果为空', strengths: [], improvements: [], toneAnalysis: '未知' };
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('API /api/gemini/analyze error:', error);
    // 详细记录错误类型和信息
    const errorDetails = {
      type: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    console.error('Detailed error information:', JSON.stringify(errorDetails, null, 2));
    
    // 根据错误类型返回更具体的错误消息
    let userErrorMessage = 'Internal Server Error';
    let techDetails = String(error);
    
    if (error instanceof Error) {
      if (error.message.includes('fetch failed')) {
        userErrorMessage = 'Network error connecting to Gemini API';
        techDetails = '可能是网络连接问题或Gemini API服务不可用';
      } else if (error.message.includes('API key')) {
        userErrorMessage = 'Invalid API key configuration';
        techDetails = 'Gemini API密钥可能无效或已过期';
      }
    }
    
    // 在API调用失败时返回一个基本的分析结构，而不是完全失败
    const fallbackAnalysis = {
      score: 5,
      summary: '分析服务暂时不可用，但我们仍可以提供一些基础建议。',
      strengths: ['您积极参与了对话', '您尝试了不同的表达方式'],
      improvements: ['可以尝试更清晰地表达您的想法', '注意对话的连贯性和逻辑性'],
      toneAnalysis: '服务不可用，无法提供详细分析'
    };
    
    return res.status(500).json({ 
      error: userErrorMessage,
      details: techDetails,
      timestamp: new Date().toISOString(),
      fallbackAnalysis: fallbackAnalysis
    });
  }
}
