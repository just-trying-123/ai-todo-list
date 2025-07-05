'use client';

import React, { useState, useEffect } from 'react';
import { contextApi, aiApi } from '@/lib/api';
import { ContextEntry } from '@/types';

export default function AIContextAnalyzer() {
  const [unprocessedEntries, setUnprocessedEntries] = useState<ContextEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUnprocessedEntries = async () => {
    try {
      const entries = await contextApi.getUnprocessed();
      setUnprocessedEntries(entries);
    } catch (err) {
      console.error('Failed to fetch unprocessed entries:', err);
    }
  };

  useEffect(() => {
    fetchUnprocessedEntries();
  }, []);

  const handleAnalyzeSingle = async (entryId: number) => {
    setAnalyzing(true);
    setError(null);

    try {
      const result = await contextApi.analyzeContext(entryId);
      
      if (result.success) {
        setAnalysisResults(prev => [...prev, result]);
        await fetchUnprocessedEntries(); // Refresh the list
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to analyze context entry');
      console.error('Context analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBulkProcess = async () => {
    if (unprocessedEntries.length === 0) return;

    setAnalyzing(true);
    setError(null);

    try {
      const entryIds = unprocessedEntries.map(entry => entry.id);
      const result = await contextApi.bulkProcess(entryIds);
      
      if (result.success) {
        setAnalysisResults(prev => [...prev, ...result.results]);
        await fetchUnprocessedEntries(); // Refresh the list
      } else {
        setError(result.error || 'Bulk processing failed');
      }
    } catch (err) {
      setError('Failed to process context entries');
      console.error('Bulk processing error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'whatsapp':
        return 'bg-green-100 text-green-800';
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'note':
        return 'bg-yellow-100 text-yellow-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">AI Context Analysis</h3>
        <button
          onClick={fetchUnprocessedEntries}
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

      {unprocessedEntries.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {unprocessedEntries.length} unprocessed entries
            </span>
            <button
              onClick={handleBulkProcess}
              disabled={analyzing}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? 'Processing...' : 'Process All'}
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unprocessedEntries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceTypeColor(entry.source_type)}`}>
                        {entry.source_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.context_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAnalyzeSingle(entry.id)}
                    disabled={analyzing}
                    className="ml-2 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                  >
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisResults.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Recent Analysis Results</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analysisResults.slice(-5).map((result, index) => (
              <div key={index} className="border border-green-200 rounded p-3 bg-green-50">
                {result.analysis && (
                  <div className="space-y-2">
                    {result.analysis.sentiment_score && (
                      <div className="text-sm">
                        <strong>Sentiment:</strong> {result.analysis.sentiment_score}
                      </div>
                    )}
                    
                    {result.analysis.relevance_score && (
                      <div className="text-sm">
                        <strong>Relevance:</strong> {result.analysis.relevance_score}/10
                      </div>
                    )}
                    
                    {result.analysis.keywords && result.analysis.keywords.length > 0 && (
                      <div className="text-sm">
                        <strong>Keywords:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.analysis.keywords.map((keyword: string, idx: number) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.analysis.task_suggestions && result.analysis.task_suggestions.length > 0 && (
                      <div className="text-sm">
                        <strong>Task Suggestions:</strong>
                        <ul className="mt-1 space-y-1">
                          {result.analysis.task_suggestions.map((suggestion: any, idx: number) => (
                            <li key={idx} className="text-xs text-gray-600">
                              • {suggestion.title} ({suggestion.priority})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {unprocessedEntries.length === 0 && analysisResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No unprocessed context entries found.</p>
          <p className="text-sm mt-2">Add some context entries to see AI analysis in action.</p>
        </div>
      )}
    </div>
  );
} 