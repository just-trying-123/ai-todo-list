"use client";

import { PlusIcon } from '@heroicons/react/24/outline';

export default function Header({ onAddTask }: { onAddTask?: () => void }) {
  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-20 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm flex items-center">
              Smart Todo List
            </span>
          </div>
        </div>
      </div>
    </header>
  );
} 