import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, Scenario } from '../types';

interface ChatInterfaceProps {
  scenario: Scenario;
  onEndSession: (messages: Message[]) => void;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ scenario, onEndSession, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat (no client-side API key use)
  useEffect(() => {
    const initialMsg: Message = {
      id: 'init-1',
      text: scenario.initialMessage,
      sender: Sender.AI,
      timestamp: new Date()
    };
    setMessages([initialMsg]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    setInputValue('');

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: Sender.USER,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Send conversation history + new user message to backend which holds the API key
      const payload = { messages: [...messages, userMsg], systemInstruction: scenario.systemInstruction };
      
      // 添加请求超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      const r = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      let responseText = '（对方未回应）';

      if (!r.ok) {
        // Try to read server-provided error details
        try {
          const err = await r.json();
          // 根据错误类型提供更友好的用户提示
          if (err?.error?.includes('Network error')) {
            responseText = `网络连接问题：无法连接到Gemini服务。${err?.details ? '\n技术原因：' + String(err.details).slice(0, 150) : ''}`;
          } else if (err?.error?.includes('API key')) {
            responseText = `服务配置问题：API密钥无效。${err?.details ? '\n技术原因：' + String(err.details).slice(0, 150) : ''}`;
          } else {
            responseText = `系统错误：${err?.error || '请求失败'}${err?.details ? '\n' + String(err.details).slice(0, 200) : ''}`;
          }
        } catch (e) {
          responseText = `系统错误：HTTP ${r.status}`;
        }
      } else {
        const data = await r.json();
        responseText = data?.text || responseText;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.AI,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error('Chat request failed:', error);
        let errorMessage = '网络错误：无法连接到服务器，请检查网络或稍后重试。';
        
        // 根据不同的错误类型提供更具体的提示
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = '请求超时：服务器响应时间过长，请稍后重试。';
          } else if (error.message.includes('fetch failed') || error.message.includes('Network')) {
            // 明确指出可能是网络连接到Google API的问题
            errorMessage = `网络连接失败：无法连接到Gemini服务。\n\n可能的解决方案：\n1. 检查防火墙设置，确保允许连接到Google API\n2. 如果使用VPN，请尝试暂时断开\n3. 检查网络代理设置\n4. 稍后再试，服务可能暂时不可用`;
          } else {
            errorMessage = `通信错误：${error.message.slice(0, 100)}`;
          }
        }
        
        const aiMsg: Message = {
          id: (Date.now() + 2).toString(),
          text: errorMessage,
          sender: Sender.AI,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="text-center">
          <h2 className="font-bold text-slate-800">{scenario.title}</h2>
          <p className="text-xs text-slate-500">正在与 AI 角色对话中...</p>
        </div>
        <button 
          onClick={() => onEndSession(messages)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-full font-medium transition-colors shadow-sm"
        >
          结束并评估
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <div className="flex justify-center my-4">
           <div className="bg-slate-200 text-slate-600 text-xs py-1 px-4 rounded-full max-w-[90%] text-center">
             场景目标：{scenario.description}
           </div>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
              ${msg.sender === Sender.USER 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start w-full">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex space-x-1 items-center">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 pb-6 md:pb-4">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 bg-slate-100 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="输入你的回复..."
              className="w-full bg-transparent border-none outline-none text-slate-800 text-sm px-2 resize-none max-h-32 overflow-y-auto"
              rows={1}
              style={{ minHeight: '24px' }}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className={`
              p-3 rounded-full flex-shrink-0 transition-all
              ${!inputValue.trim() || isTyping 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:scale-105 active:scale-95'}
            `}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;