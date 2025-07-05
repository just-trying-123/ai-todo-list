'use client';

import React, { useState } from 'react';
import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUpdateTask, useCompleteTask, useDeleteTask, useEnhanceTask } from '@/hooks/useTasks';
import { formatDate, getPriorityConfig, getDateStatus, truncateText } from '@/lib/utils';
import {
  CheckIcon,
  TrashIcon,
  PencilIcon,
  SparklesIcon,
  CalendarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';


interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  className?: string;
}

export default function TaskCard({ task, onEdit, className }: TaskCardProps) {
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const enhanceTask = useEnhanceTask();
  const [showModal, setShowModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const handleToggleComplete = () => {
    if (task.is_completed) {
      updateTask.mutate({ id: task.id, updates: { is_completed: false } });
    } else {
      completeTask.mutate(task.id);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id);
    }
  };

  const handleEnhance = () => {
    enhanceTask.mutate(task.id);
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const dateStatus = task.due_date ? getDateStatus(task.due_date) : null;

  // Only open modal if the click is not on a button, input, or icon
  const handleCardClick = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (["button", "svg", "path", "input", "label"].includes(tag)) return;
    setShowModal(true);
  };

  return (
    <>
      <Card
        className={`transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${task.is_completed ? 'opacity-75' : ''} ${className || ''} bg-white text-gray-900 border-gray-200 m-1`}
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        <CardContent className="p-3 bg-white text-gray-900 flex flex-col h-full">
          <div className="flex items-start justify-between mb-1 flex-wrap">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={handleToggleComplete}
                disabled={completeTask.isPending || updateTask.isPending}
                className="w-6 h-6 rounded border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 transition-colors"
                style={{ accentColor: task.is_completed ? '#22c55e' : undefined }}
                onClick={e => e.stopPropagation()}
                title={task.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
              />
              <h3
                className={`font-semibold text-base leading-snug break-words line-clamp-2 ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
                title={task.title}
              >
                {task.title}
              </h3>
            </div>
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              {!task.is_completed && !task.ai_enhanced_description && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEnhance}
                  disabled={enhanceTask.isPending}
                  loading={enhanceTask.isPending}
                  onMouseDown={e => e.stopPropagation()}
                  title="Enhance with AI"
                >
                  <SparklesIcon className="w-5 h-5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={e => { e.stopPropagation(); onEdit?.(task); }}
                onMouseDown={e => e.stopPropagation()}
                title="Edit task"
              >
                <PencilIcon className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={e => { e.stopPropagation(); handleDelete(); }}
                disabled={deleteTask.isPending}
                loading={deleteTask.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onMouseDown={e => e.stopPropagation()}
                title="Delete task"
              >
                <TrashIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${priorityConfig.badge}`}>
              <TagIcon className="w-4 h-4 mr-1" />{priorityConfig.label}
            </span>
            {task.category && (
              <span className="flex items-center px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: task.category.color_code, color: '#fff' }}>
                <TagIcon className="w-4 h-4 mr-1" />{task.category.name}
              </span>
            )}
            {task.due_date && (
              <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${dateStatus?.className || 'bg-gray-100 text-gray-700'}`}> 
                <CalendarIcon className="w-4 h-4 mr-1" />{formatDate(task.due_date)}
                {dateStatus?.isOverdue && <span className="ml-1 text-red-600">(Overdue)</span>}
              </span>
            )}
            {task.ai_suggested_deadline && task.ai_suggested_deadline !== task.due_date && (
              <span className="flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <SparklesIcon className="w-4 h-4 mr-1" />AI suggests: {formatDate(task.ai_suggested_deadline)}
              </span>
            )}
          </div>

          {/* Description with expand/collapse */}
          {(task.ai_enhanced_description || task.description) && (
            <div className="mb-2">
              <p className={`text-sm text-gray-700 ${descExpanded ? '' : 'line-clamp-2'}`}>{task.ai_enhanced_description || task.description}</p>
              {((task.ai_enhanced_description || task.description).length > 120) && (
                <button
                  className="text-xs text-blue-600 hover:underline mt-1"
                  onClick={e => { e.stopPropagation(); setDescExpanded(v => !v); }}
                >
                  {descExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* AI Priority Score as progress bar */}
          {typeof task.priority_score === 'number' && task.priority_score >= 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500" title="Higher score = more important task">AI Priority Score:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-2 bg-green-500 transition-all duration-500" style={{ width: `${Math.min(100, Math.round(task.priority_score))}%` }}></div>
              </div>
              <span className="text-xs text-gray-700 font-semibold">{Math.round(task.priority_score)}%</span>
            </div>
          )}

          {/* Created/Updated time */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            {task.created_at && <span>Created: {formatDate(task.created_at)}</span>}
            {task.updated_at && <span>Updated: {formatDate(task.updated_at)}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Modal for Task Details */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs" onClick={() => setShowModal(false)}>
          <div
            className="bg-white text-gray-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-extrabold mb-2 text-black flex items-center">
              {task.title}
              {task.is_completed && <CheckIconSolid className="w-5 h-5 text-green-500 ml-2" />}
            </h2>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${priorityConfig.badge}`}>
                <TagIcon className="w-4 h-4 mr-1" />{priorityConfig.label}
              </span>
              {task.category && (
                <span className="flex items-center px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: task.category.color_code, color: '#fff' }}>
                  <TagIcon className="w-4 h-4 mr-1" />{task.category.name}
                </span>
              )}
              {task.due_date && (
                <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${dateStatus?.className || 'bg-gray-100 text-gray-700'}`}> 
                  <CalendarIcon className="w-4 h-4 mr-1" />{formatDate(task.due_date)}
                  {dateStatus?.isOverdue && <span className="ml-1 text-red-600">(Overdue)</span>}
                </span>
              )}
              {task.ai_suggested_deadline && task.ai_suggested_deadline !== task.due_date && (
                <span className="flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <SparklesIcon className="w-4 h-4 mr-1" />AI suggests: {formatDate(task.ai_suggested_deadline)}
                </span>
              )}
            </div>
            <div className="mb-2 text-gray-700">
              <strong>Description:</strong>
              <div className="mt-1 text-sm">{task.ai_enhanced_description || task.description}</div>
            </div>
            {typeof task.priority_score === 'number' && task.priority_score >= 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500" title="Higher score = more important task">AI Priority Score:</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-green-500 transition-all duration-500" style={{ width: `${Math.min(100, Math.round(task.priority_score))}%` }}></div>
                </div>
                <span className="text-xs text-gray-700 font-semibold">{Math.round(task.priority_score)}%</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              {task.created_at && <span>Created: {formatDate(task.created_at)}</span>}
              {task.updated_at && <span>Updated: {formatDate(task.updated_at)}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 