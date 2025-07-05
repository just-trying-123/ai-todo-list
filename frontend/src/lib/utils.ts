import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Priority utilities
export const priorityConfig = {
  low: {
    label: 'Low',
    color: 'bg-green-100 text-green-800',
    badge: 'bg-green-500',
    value: 1,
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-800',
    badge: 'bg-yellow-500',
    value: 2,
  },
  high: {
    label: 'High',
    color: 'bg-orange-100 text-orange-800',
    badge: 'bg-orange-500',
    value: 3,
  },
  urgent: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-800',
    badge: 'bg-red-500',
    value: 4,
  },
};

export function getPriorityConfig(priority: string) {
  return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
}

// Date utilities
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  }
  
  return format(dateObj, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

export function isOverdue(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isPast(dateObj) && !isToday(dateObj);
}

export function getDateStatus(date: string | Date): {
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  className: string;
} {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const overdue = isPast(dateObj) && !isToday(dateObj);
  const today = isToday(dateObj);
  const tomorrow = isTomorrow(dateObj);
  
  let className = 'text-gray-600';
  if (overdue) className = 'text-red-600';
  else if (today) className = 'text-blue-600';
  else if (tomorrow) className = 'text-purple-600';
  
  return {
    isOverdue: overdue,
    isToday: today,
    isTomorrow: tomorrow,
    className,
  };
}

// Text utilities
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Category color utilities
export const categoryColors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-cyan-500',
];

export function getRandomCategoryColor(): string {
  return categoryColors[Math.floor(Math.random() * categoryColors.length)];
}

// API error handling
export function getErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Local storage utilities
export function getFromStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export function setToStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
} 