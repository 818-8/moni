import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not set in environment - API routes will fail without it');
}

// 创建GoogleGenAI实例，只有在有密钥时
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Debug: indicate whether server process has the GEMINI_API_KEY (will not log the key)
  console.log('GEMINI_API_KEY present:', Boolean(process.env.GEMINI_API_KEY));
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, systemInstruction } = req.body as { messages?: Array<any>; systemInstruction?: string };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array in request body' });
    }

    if (!apiKey || !ai) {
      return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY not set or invalid' });
    }

    // Build a textual prompt from messages (server side maintains key responsibility: apiKey never exposed)
    const transcript = messages.map((m: any) => `${m.sender === 'user' ? '用户' : '对方'}: ${m.text}`).join('\n');

    const prompt = `${systemInstruction || ''}\n\nTranscript:\n${transcript}\n\nRespond as the role-play partner in a natural conversational way.`;

    // 尝试使用备用模型，添加网络连接测试和超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    let response;
    try {
      // 首先尝试使用指定模型
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.9 },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (modelError) {
      clearTimeout(timeoutId);
      console.warn('Primary model failed, trying fallback...', modelError);
      // 如果失败，尝试备用模型
      try {
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 30000);
        
        response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { temperature: 0.9 },
          signal: fallbackController.signal
        });
        clearTimeout(fallbackTimeoutId);
      } catch (fallbackError) {
        clearTimeout(timeoutId);
        throw fallbackError; // 重新抛出以便在外部catch中处理
      }
    }

    // 安全获取文本响应
    const responseText = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || '';
    return res.status(200).json({ text: responseText });
  } catch (error) {
    console.error('API /api/gemini/chat error:', error);
    // 详细记录错误类型和信息
    const errorDetails = {
      type: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    console.error('Detailed error information:', JSON.stringify(errorDetails, null, 2));
    
    // 详细的错误分类和响应
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: '网络连接超时：无法连接到Gemini服务。',
        details: '请求处理时间超过了30秒的超时限制。\n\n可能的解决方案：\n1. 检查防火墙设置，确保允许连接到Google API\n2. 如果使用VPN，请尝试暂时断开\n3. 检查网络代理设置\n4. 稍后再试，服务可能暂时不可用',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.message.includes('403') || error.message.includes('unauthorized')) {
      return res.status(401).json({ 
        error: 'API密钥无效或权限不足',
        details: '提供的Gemini API密钥无效或者没有足够的权限访问指定的资源。',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.message.includes('429')) {
      return res.status(429).json({ 
        error: '请求频率过高，请稍后再试',
        details: '您已达到API请求限制。请减少请求频率或稍后再试。',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: '网络连接失败：无法连接到Gemini服务。',
        details: '\n\n可能的解决方案：\n1. 检查防火墙设置，确保允许连接到Google API\n2. 如果使用VPN，请尝试暂时断开\n3. 检查网络代理设置\n4. 稍后再试，服务可能暂时不可用',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: '服务器配置错误：API密钥无效',
        details: '服务器无法使用提供的API密钥。请检查环境变量配置。',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error instanceof Error && error.message.includes('fetch failed')) {
      return res.status(500).json({
        error: '网络错误连接到Gemini API',
        details: '可能是网络连接问题或Gemini API服务不可用。请检查网络连接并重试。',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({ 
      error: '服务器处理请求时出错',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
