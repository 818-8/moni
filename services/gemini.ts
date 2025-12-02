// This file used to call `@google/genai` directly. After migrating to Next.js,
// all Gemini calls should happen on the server-side API routes (`/api/gemini/*`).
//
// Keep a lightweight client wrapper here that proxies calls to those endpoints.
// This prevents accidental bundling of `@google/genai` into the browser.

import { Message, AnalysisResult } from '../types';

// 配置选项
const config = {
  offlineMode: false, // 设置为true启用离线模式
  offlineDelay: 800, // 模拟网络延迟（毫秒）
};

// 模拟响应数据
const mockResponses = {
  // 模拟聊天响应
  chat: (messages: Message[]) => {
    const lastMessage = messages[messages.length - 1];
    
    // 根据用户最后一条消息生成模拟响应
    let content = '';
    if (lastMessage.content.toLowerCase().includes('hello') || 
        lastMessage.content.toLowerCase().includes('hi') ||
        lastMessage.content.includes('你好') ||
        lastMessage.content.includes('嗨')) {
      content = '你好！我是一个AI助手。很高兴为您提供帮助。您有什么问题想要咨询吗？';
    } else if (lastMessage.content.toLowerCase().includes('weather') ||
               lastMessage.content.includes('天气')) {
      content = '我无法直接获取当前天气信息，但我可以告诉你，保持良好的沟通是解决问题的关键。';
    } else if (lastMessage.content.toLowerCase().includes('help') ||
               lastMessage.content.includes('帮助') ||
               lastMessage.content.includes('怎么')) {
      content = '我可以帮助您解答各种问题，提供建议，或者协助您完成任务。请告诉我您需要什么帮助？';
    } else {
      content = `我收到了您的消息："${lastMessage.content}"。这是一个离线模式下的模拟响应。要获取真实的AI回复，请确保您的网络连接正常并能够访问Gemini API服务。`;
    }
    
    return {
      content,
      role: 'model',
      timestamp: new Date().toISOString(),
    };
  },
  
  // 模拟分析响应
  analyze: (scenarioTitle: string) => {
    return {
      score: 85,
      feedback: `这是针对"${scenarioTitle}"场景的模拟分析反馈。在离线模式下，无法提供真实的AI分析。`,
      suggestions: [
        '保持良好的沟通节奏',
        '注意倾听用户需求',
        '提供具体的解决方案',
        '跟进用户反馈',
      ],
      improvements: [
        '离线模式下无法提供详细的改进建议',
        '请连接网络以获取更准确的分析',
      ],
    };
  },
};

// 模拟延迟函数
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 切换离线模式的函数
export const setOfflineMode = (enabled: boolean) => {
  config.offlineMode = enabled;
  console.log(`离线模式已${enabled ? '启用' : '禁用'}`);
};

export const sendMessageToAI = async (payload: { messages: Message[]; systemInstruction?: string }) => {
  // 检查是否启用离线模式
  if (config.offlineMode) {
    console.log('离线模式已启用，返回模拟响应');
    await simulateDelay(config.offlineDelay);
    return mockResponses.chat(payload.messages);
  }
  
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      throw new Error(`API响应错误: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('发送消息到AI失败:', error);
    
    // 网络错误时自动返回模拟数据
    console.log('网络错误，返回模拟响应');
    await simulateDelay(config.offlineDelay);
    return mockResponses.chat(payload.messages);
  }
};

export const analyzeConversation = async (scenarioTitle: string, messages: Message[]): Promise<AnalysisResult> => {
  // 检查是否启用离线模式
  if (config.offlineMode) {
    console.log('离线模式已启用，返回模拟分析结果');
    await simulateDelay(config.offlineDelay);
    return mockResponses.analyze(scenarioTitle);
  }
  
  try {
    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioTitle, messages }),
    });
    
    if (!res.ok) {
      throw new Error(`API响应错误: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('分析对话失败:', error);
    
    // 网络错误时自动返回模拟数据
    console.log('网络错误，返回模拟分析结果');
    await simulateDelay(config.offlineDelay);
    return mockResponses.analyze(scenarioTitle);
  }
};

