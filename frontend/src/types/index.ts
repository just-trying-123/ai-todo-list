export interface Task {
  id: number;
  title: string;
  description: string;
  ai_enhanced_description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priority_score?: number;
  due_date?: string;
  ai_suggested_deadline?: string;
  is_completed: boolean;
  category?: Category;
  context_relevance_score?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Category {
  id: number;
  name: string;
  color_code: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

export interface ContextEntry {
  id: number;
  content: string;
  entry_type: 'email' | 'message' | 'note' | 'meeting' | 'other';
  processed_summary?: string;
  sentiment_score?: number;
  keywords?: string[];
  entities?: Record<string, any>;
  ai_suggested_tasks?: string[];
  date: string;
  created_at: string;
}

export interface ContextInsight {
  id: number;
  date: string;
  productivity_score: number;
  mood_analysis: string;
  key_themes: string[];
  suggested_focus_areas: string[];
  created_at: string;
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  avg_completion_time_hours: number;
  tasks_by_priority: Record<string, number>;
  tasks_by_category: Record<string, number>;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  category_id?: number;
  enhance_with_ai?: boolean;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  category_id?: number;
  is_completed?: boolean;
}

export interface CreateContextRequest {
  content: string;
  entry_type: 'email' | 'message' | 'note' | 'meeting' | 'other';
  process_with_ai?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
} 