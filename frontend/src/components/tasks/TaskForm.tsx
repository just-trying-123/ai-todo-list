'use client';

import React, { useState, useEffect } from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { format } from 'date-fns';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TaskForm({ task, onClose, onSuccess }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'medium' | 'low' | 'high' | 'urgent',
    due_date: '',
    category_id: '',
    enhance_with_ai: true,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: categories = [] } = useCategories();

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        category_id: task.category?.id?.toString() || '',
        enhance_with_ai: false, // Don't re-enhance when editing
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      due_date: formData.due_date || undefined,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
      enhance_with_ai: formData.enhance_with_ai,
    };

    try {
      if (isEditing) {
        const updateData: UpdateTaskRequest = {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.due_date,
          category_id: taskData.category_id,
        };
        await updateTask.mutateAsync({ id: task.id, updates: updateData });
      } else {
        const createData: CreateTaskRequest = taskData;
        await createTask.mutateAsync(createData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isLoading = createTask.isPending || updateTask.isPending;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter task description"
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          {/* Category */}
          {/* Removed category selection field */}

          {/* AI Enhancement */}
          {!isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enhance_with_ai"
                name="enhance_with_ai"
                checked={formData.enhance_with_ai}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enhance_with_ai" className="flex items-center text-sm text-gray-700">
                <SparklesIcon className="w-4 h-4 mr-1 text-blue-500" />
                Enhance with AI (description, priority, deadline)
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading || !formData.title.trim()}
            >
              {isEditing ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 