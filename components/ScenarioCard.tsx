
import React, { useState } from 'react';
import { Scenario, Difficulty } from '../types';

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: (scenario: Scenario) => void;
  onUpdateDescription?: (id: string, newDescription: string) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onClick, onUpdateDescription }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDescription, setTempDescription] = useState(scenario.description);
  
  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY: return 'bg-green-100 text-green-700 border-green-200';
      case Difficulty.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case Difficulty.HARD: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempDescription(scenario.description);
    setIsEditing(true);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateDescription) {
      onUpdateDescription(scenario.id, tempDescription);
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setTempDescription(scenario.description);
  };

  const handleTextareaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      onClick={() => !isEditing && onClick(scenario)}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 p-5 flex flex-col h-full group ${!isEditing ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{scenario.icon}</div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getDifficultyColor(scenario.difficulty)}`}>
          {scenario.difficulty}
        </span>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-slate-800">{scenario.title}</h3>
        {!isEditing && onUpdateDescription && (
          <button 
            onClick={handleEditClick}
            className="text-slate-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="编辑描述"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="flex-grow flex flex-col mb-4">
          <textarea
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            onClick={handleTextareaClick}
            className="w-full text-sm text-slate-700 border border-indigo-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none bg-slate-50 mb-2 h-24"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={handleCancel}
              className="text-xs px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 font-medium transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors shadow-sm"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-grow">
          {scenario.description}
        </p>
      )}

      <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center">
        <span className="text-xs text-slate-400 font-medium">{scenario.category}</span>
        {!isEditing && (
          <span className="text-indigo-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
            开始练习 &rarr;
          </span>
        )}
      </div>
    </div>
  );
};

export default ScenarioCard;
