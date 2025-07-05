'use client';

import React, { useState } from 'react';
import { tasksApi, aiApi } from '@/lib/api';
import { Task } from '@/types';

interface AITaskEnhancerProps {
  task: Task;
  onTaskUpdated: (task: Task) => void;
}

export default function AITaskEnhancer({ task, onTaskUpdated }: AITaskEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnhanceTask = async () => {
    setIsEnhancing(true);
    setError(null);
    setEnhancementResult(null);

    try {
      const result = await tasksApi.enhanceTask(task.id);
      
      if (result.success) {
        setEnhancementResult(result.enhancements);
        onTaskUpdated(result.task);
      } else {
        setError(result.error || 'Enhancement failed');
      }
    } catch (err) {
      setError('Failed to enhance task');
      console.error('Task enhancement error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRecalculatePriority = async () => {
    setIsEnhancing(true);
    setError(null);

    try {
      const result = await tasksApi.recalculatePriority(task.id);
      
      if (result.success) {
        onTaskUpdated(result.task);
        setEnhancementResult({
          new_priority_score: result.new_priority_score,
          message: 'Priority recalculated successfully'
        });
      } else {
        setError(result.error || 'Priority recalculation failed');
      }
    } catch (err) {
      setError('Failed to recalculate priority');
      console.error('Priority recalculation error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-black">AI Task Enhancement</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={handleEnhanceTask}
            disabled={isEnhancing}
            className="bg-blue-100 text-black px-4 py-2 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            {isEnhancing ? 'Enhancing...' : 'Enhance Task'}
          </button>
          
          <button
            onClick={handleRecalculatePriority}
            disabled={isEnhancing}
            className="bg-green-100 text-black px-4 py-2 rounded-md hover:bg-green-200 disabled:opacity-50"
          >
            {isEnhancing ? 'Calculating...' : 'Recalculate Priority'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {enhancementResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-semibold text-green-800 mb-2">Enhancement Results</h4>
            
            {enhancementResult.enhanced_description && (
              <div className="mb-3">
                <strong className="text-sm text-gray-700">Enhanced Description:</strong>
                <p className="text-sm text-gray-600 mt-1">{enhancementResult.enhanced_description}</p>
              </div>
            )}
            
            {enhancementResult.suggested_deadline && (
              <div className="mb-3">
                <strong className="text-sm text-gray-700">Suggested Deadline:</strong>
                <p className="text-sm text-gray-600 mt-1">{enhancementResult.suggested_deadline}</p>
              </div>
            )}
            
            {enhancementResult.suggested_category && (
              <div className="mb-3">
                <strong className="text-sm text-gray-700">Suggested Category:</strong>
                <p className="text-sm text-gray-600 mt-1">{enhancementResult.suggested_category}</p>
              </div>
            )}
            
            {enhancementResult.priority_score && (
              <div className="mb-3">
                <strong className="text-sm text-gray-700">Priority Score:</strong>
                <p className="text-sm text-gray-600 mt-1">{enhancementResult.priority_score}/10</p>
              </div>
            )}
            
            {enhancementResult.reasoning && (
              <div className="mb-3">
                <strong className="text-sm text-gray-700">Reasoning:</strong>
                <p className="text-sm text-gray-600 mt-1">{enhancementResult.reasoning}</p>
              </div>
            )}
            
            {enhancementResult.new_priority_score && (
              <div className="mb-3">
                <strong className="text-sm text-gray-700">New Priority Score:</strong>
                <p className="text-sm text-gray-600 mt-1">{enhancementResult.new_priority_score}/10</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 