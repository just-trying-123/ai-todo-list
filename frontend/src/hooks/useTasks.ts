import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStats } from '@/types';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: any) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
  today: () => [...taskKeys.all, 'today'] as const,
  overdue: () => [...taskKeys.all, 'overdue'] as const,
};

// Get all tasks
export function useTasks(filters?: {
  completed?: boolean;
  priority?: string;
  category?: number;
  search?: string;
  ordering?: string;
}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => tasksApi.getTasks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get a single task
export function useTask(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
  });
}

// Get task statistics
export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => tasksApi.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get today's tasks
export function useTodayTasks() {
  return useQuery({
    queryKey: taskKeys.today(),
    queryFn: () => tasksApi.getTodayTasks(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get overdue tasks
export function useOverdueTasks() {
  return useQuery({
    queryKey: taskKeys.overdue(),
    queryFn: () => tasksApi.getOverdueTasks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: CreateTaskRequest) => tasksApi.createTask(task),
    onSuccess: (newTask) => {
      // Invalidate and refetch task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateTaskRequest }) =>
      tasksApi.updateTask(id, updates),
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
      
      toast.success('Task updated successfully!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tasksApi.deleteTask(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
      
      toast.success('Task deleted successfully!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Complete task mutation
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tasksApi.completeTask(id),
    onSuccess: (completedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(completedTask.id), completedTask);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
      
      toast.success('Task completed! 🎉');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Enhance task with AI mutation
export function useEnhanceTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tasksApi.enhanceTask(id),
    onSuccess: (enhancedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(enhancedTask.id), enhancedTask);
      
      // Invalidate lists to show enhanced description
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      toast.success('Task enhanced with AI! ✨');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
} 