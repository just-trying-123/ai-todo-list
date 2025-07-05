'use client';

import React, { useState, useEffect } from 'react';
import { tasksApi } from '@/lib/api';

interface AIRecommendation {
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
  reasoning: string;
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await tasksApi.getAIRecommendations(5);
      
      if (result.success) {
        setRecommendations(result.recommendations || []);
      } else {
        setError(result.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError('Failed to fetch AI recommendations');
      console.error('AI recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-black">AI Task Recommendations</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black">AI Task Recommendations</h3>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {recommendations.length === 0 && !error ? (
        <div className="text-center py-8 text-gray-500">
          <p>No AI recommendations available at the moment.</p>
          <p className="text-sm mt-2">Try adding some context entries to get personalized recommendations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                  {recommendation.priority}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
              
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {recommendation.category && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {recommendation.category}
                  </span>
                )}
                
                {recommendation.deadline && (
                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                    Due: {recommendation.deadline}
                  </span>
                )}
              </div>
              
              {recommendation.reasoning && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    <strong>AI Reasoning:</strong> {recommendation.reasoning}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 