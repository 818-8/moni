import React, { useEffect, useState } from 'react';
import { AnalysisResult, Message, Scenario } from '../types';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface AnalysisViewProps {
  messages: Message[];
  scenario: Scenario;
  onClose: () => void;
  onRetry: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ messages, scenario, onClose, onRetry }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      // If conversation is too short, provide a mock 'incomplete' analysis or prompt warning
      if (messages.length < 3) {
        setResult({
          score: 0,
          summary: "对话太短，无法进行有效分析。请尝试多交流几句。",
          strengths: [],
          improvements: ["请尝试多说几句话。", "不要过早结束对话。"],
          toneAnalysis: "样本不足"
        });
        setLoading(false);
        return;
      }

      try {
        // 添加请求超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000); // 40秒超时
        
        const r = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioTitle: scenario.title, messages }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!r.ok) {
          // 处理HTTP错误
          try {
            const errorData = await r.json();
            console.error('Analysis API error:', errorData);
            
            // 创建一个错误分析结果
            setResult({
              score: 50, // 中性分数
              summary: `分析服务暂时不可用：${errorData?.error || '服务器错误'}`,
              strengths: ['对话已完成'],
              improvements: ['请稍后重新尝试分析功能'],
              toneAnalysis: '分析过程中断'
            });
          } catch (e) {
            // 无法解析错误响应时的回退
            setResult({
              score: 50,
              summary: `分析服务暂时不可用：HTTP ${r.status}`,
              strengths: ['对话已完成'],
              improvements: ['请稍后重新尝试分析功能'],
              toneAnalysis: '分析过程中断'
            });
          }
        } else {
          const data = await r.json();
          setResult(data as AnalysisResult);
        }
      } catch (error) {
        console.error('Analysis fetch failed:', error);
        
        // 根据错误类型提供适当的错误分析结果
        let errorMessage = '分析服务暂时不可用，请稍后重试';
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = '分析请求超时，请稍后重试';
          } else if (error.message.includes('fetch failed') || error.message.includes('Network')) {
            errorMessage = '网络连接问题，无法完成分析';
          } else {
            errorMessage = `分析过程中发生错误: ${error.message.slice(0, 50)}`;
          }
        }
        
        // 创建一个回退的分析结果
        setResult({
          score: 50,
          summary: errorMessage,
          strengths: ['对话已完成'],
          improvements: ['请尝试重新分析或检查网络连接'],
          toneAnalysis: '分析过程中断'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 space-y-6">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-800">正在分析你的表现...</h3>
          <p className="text-slate-500 mt-2">AI 教练正在评估你的沟通技巧、语气和共情能力。</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const scoreData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4f46e5'; // Indigo-600
    if (score >= 60) return '#eab308'; // Yellow-500
    return '#ef4444'; // Red-500
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header Section with Score */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center md:flex-row md:justify-between border border-slate-100">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800">评估报告</h2>
            <p className="text-slate-500 text-sm mt-1">{scenario.title}</p>
            <p className="text-xs text-slate-400 mt-1">共 {messages.length} 条对话记录</p>
          </div>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell key="score" fill={getScoreColor(result.score)} />
                  <Cell key="remaining" fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-bold text-slate-800">{result.score}</span>
               <span className="text-[10px] text-slate-400 uppercase">Score</span>
            </div>
          </div>
        </div>

        {/* Summary & Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 relative overflow-hidden">
             {/* Background image */}
             <div 
               className="absolute inset-0 opacity-10 bg-cover bg-center"
               style={{ 
                 backgroundImage: `url('https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500&h=300&fit=crop')`
               }}
             ></div>
             <div className="relative z-10">
               <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">📝</span> 总结
               </h3>
               <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
             </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 relative overflow-hidden">
             {/* Background image */}
             <div 
               className="absolute inset-0 opacity-10 bg-cover bg-center"
               style={{ 
                 backgroundImage: `url('https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500&h=300&fit=crop')`
               }}
             ></div>
             <div className="relative z-10">
               <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">🎭</span> 语气分析
               </h3>
               <p className="text-sm text-slate-600 leading-relaxed">{result.toneAnalysis}</p>
             </div>
          </div>
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 opacity-10 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500&h=300&fit=crop')`
            }}
          ></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              表现亮点
            </h3>
            <ul className="space-y-3">
              {result.strengths.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Improvements */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 opacity-10 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500&h=300&fit=crop')`
            }}
          ></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-orange-600 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              提升建议
            </h3>
            <ul className="space-y-3">
              {result.improvements.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                   <span className="bg-orange-100 text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 pb-8">
          <button 
            onClick={onRetry}
            className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            重新挑战
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            返回首页
          </button>
        </div>

      </div>
    </div>
  );
};

export default AnalysisView;