import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/types';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

// Get all categories
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 15 * 60 * 1000, // 15 minutes - categories don't change often
  });
}

// Create category mutation
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Omit<Category, 'id' | 'usage_count' | 'created_at'>) =>
      categoriesApi.createCategory(category),
    onSuccess: (newCategory) => {
      // Add to the categories list
      queryClient.setQueryData(categoryKeys.lists(), (old: Category[] | undefined) => {
        if (!old) return [newCategory];
        return [...old, newCategory];
      });

      toast.success('Category created successfully!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update category mutation
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Category> }) =>
      categoriesApi.updateCategory(id, updates),
    onSuccess: (updatedCategory) => {
      // Update the specific category in cache
      queryClient.setQueryData(categoryKeys.detail(updatedCategory.id), updatedCategory);
      
      // Update in the list
      queryClient.setQueryData(categoryKeys.lists(), (old: Category[] | undefined) => {
        if (!old) return [updatedCategory];
        return old.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat);
      });

      toast.success('Category updated successfully!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete category mutation
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoriesApi.deleteCategory(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: categoryKeys.detail(deletedId) });
      
      // Remove from list
      queryClient.setQueryData(categoryKeys.lists(), (old: Category[] | undefined) => {
        if (!old) return [];
        return old.filter(cat => cat.id !== deletedId);
      });

      toast.success('Category deleted successfully!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
} 