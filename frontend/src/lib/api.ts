import axios from 'axios';
import {
  Task,
  Category,
  ContextEntry,
  ContextInsight,
  TaskStats,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateContextRequest,
  PaginatedResponse,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tasks API
export const tasksApi = {
  // Get all tasks with optional filtering
  getTasks: async (params?: {
    completed?: boolean;
    priority?: string;
    category?: number;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Task>> => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },

  // Get a single task
  getTask: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  // Create a new task
  createTask: async (task: CreateTaskRequest): Promise<Task> => {
    const response = await api.post('/tasks/', task);
    return response.data;
  },

  // Update a task
  updateTask: async (id: number, updates: UpdateTaskRequest): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/`, updates);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}/`);
  },

  // Complete a task
  completeTask: async (id: number): Promise<Task> => {
    const response = await api.post(`/tasks/${id}/complete/`);
    return response.data;
  },

  // Enhance task with AI
  enhanceTask: async (id: number, contextData?: string[]): Promise<any> => {
    const response = await api.post(`/tasks/${id}/ai_enhance/`, {
      context_data: contextData || []
    });
    return response.data;
  },

  // Get AI task recommendations
  getAIRecommendations: async (limit?: number): Promise<any> => {
    const response = await api.get('/tasks/ai_recommendations/', {
      params: { limit }
    });
    return response.data;
  },

  // Recalculate task priority with AI
  recalculatePriority: async (id: number): Promise<any> => {
    const response = await api.post(`/tasks/${id}/recalculate_priority/`);
    return response.data;
  },

  // Get task statistics
  getStats: async (): Promise<TaskStats> => {
    const response = await api.get('/tasks/stats/');
    return response.data;
  },

  // Get today's tasks
  getTodayTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/today/');
    return response.data;
  },

  // Get overdue tasks
  getOverdueTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/overdue/');
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories/');
    return response.data.results || response.data;
  },

  // Create a new category
  createCategory: async (category: Omit<Category, 'id' | 'usage_count' | 'created_at'>): Promise<Category> => {
    const response = await api.post('/categories/', category);
    return response.data;
  },

  // Update a category
  updateCategory: async (id: number, updates: Partial<Category>): Promise<Category> => {
    const response = await api.patch(`/categories/${id}/`, updates);
    return response.data;
  },

  // Delete a category
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}/`);
  },
};

// Context API
export const contextApi = {
  // Get all context entries
  getContextEntries: async (params?: {
    entry_type?: string;
    date?: string;
    search?: string;
  }): Promise<PaginatedResponse<ContextEntry>> => {
    const response = await api.get('/context/', { params });
    return response.data;
  },

  // Create a new context entry
  createContextEntry: async (entry: CreateContextRequest): Promise<ContextEntry> => {
    const response = await api.post('/context/', entry);
    return response.data;
  },

  // Update a context entry
  updateContextEntry: async (id: number, updates: Partial<ContextEntry>): Promise<ContextEntry> => {
    const response = await api.patch(`/context/${id}/`, updates);
    return response.data;
  },

  // Delete a context entry
  deleteContextEntry: async (id: number): Promise<void> => {
    await api.delete(`/context/${id}/`);
  },

  // Analyze context with AI
  analyzeContext: async (id: number): Promise<any> => {
    const response = await api.post(`/context/${id}/analyze/`);
    return response.data;
  },

  // Get context summary
  getSummary: async (date?: string): Promise<any> => {
    const response = await api.get('/context/summary/', { params: { date } });
    return response.data;
  },

  // Bulk process context entries
  bulkProcess: async (ids: number[]): Promise<any> => {
    const response = await api.post('/context/bulk_process/', { entry_ids: ids });
    return response.data;
  },

  // Get unprocessed context entries
  getUnprocessed: async (): Promise<ContextEntry[]> => {
    const response = await api.get('/context/unprocessed/');
    return response.data;
  },

  // Get high relevance context entries
  getHighRelevance: async (): Promise<ContextEntry[]> => {
    const response = await api.get('/context/high_relevance/');
    return response.data;
  },

  // Get context entries with task suggestions
  getWithSuggestions: async (): Promise<ContextEntry[]> => {
    const response = await api.get('/context/with_suggestions/');
    return response.data;
  },
};

// AI API
export const aiApi = {
  // Task AI endpoints
  enhanceTask: async (taskId: number, contextData?: string[]): Promise<any> => {
    const response = await api.post(`/ai/tasks/${taskId}/enhance/`, {
      context_data: contextData || []
    });
    return response.data;
  },

  getTaskRecommendations: async (limit?: number): Promise<any> => {
    const response = await api.get('/ai/tasks/recommendations/', {
      params: { limit }
    });
    return response.data;
  },

  suggestTasksFromContext: async (contextIds: number[]): Promise<any> => {
    const response = await api.post('/ai/tasks/suggest-from-context/', {
      context_ids: contextIds
    });
    return response.data;
  },

  // Context AI endpoints
  analyzeContext: async (contextId: number): Promise<any> => {
    const response = await api.post(`/ai/context/${contextId}/analyze/`);
    return response.data;
  },

  generateContextSummary: async (startDate?: string, endDate?: string, days?: number): Promise<any> => {
    const response = await api.get('/ai/context/summary/', {
      params: { start_date: startDate, end_date: endDate, days }
    });
    return response.data;
  },

  bulkProcessContext: async (contextIds: number[]): Promise<any> => {
    const response = await api.post('/ai/context/bulk-process/', {
      context_ids: contextIds
    });
    return response.data;
  },

  // Insights endpoints
  generateDailyInsights: async (date?: string): Promise<any> => {
    const response = await api.get('/ai/insights/daily/', {
      params: { date }
    });
    return response.data;
  },

  analyzeProductivityPatterns: async (days?: number): Promise<any> => {
    const response = await api.get('/ai/insights/productivity/', {
      params: { days }
    });
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<any> => {
    const response = await api.get('/ai/health/');
    return response.data;
  },
};

// Insights API
export const insightsApi = {
  // Get all insights
  getInsights: async (params?: { date?: string }): Promise<PaginatedResponse<ContextInsight>> => {
    const response = await api.get('/insights/', { params });
    return response.data;
  },

  // Get insight for a specific date
  getInsight: async (id: number): Promise<ContextInsight> => {
    const response = await api.get(`/insights/${id}/`);
    return response.data;
  },

  // Get actionable insights
  getActionableInsights: async (): Promise<ContextInsight[]> => {
    const response = await api.get('/insights/actionable/');
    return response.data;
  },

  // Dismiss an insight
  dismissInsight: async (id: number): Promise<ContextInsight> => {
    const response = await api.post(`/insights/${id}/dismiss/`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<void> => {
    const response = await api.post('/auth/login/', { username, password });
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  signup: async (username: string, password: string): Promise<void> => {
    await api.post('/auth/signup/', { username, password });
  },
  logout: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export default api; 