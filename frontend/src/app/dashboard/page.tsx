"use client";
import React, { useState } from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import DashboardStats from '@/components/dashboard/DashboardStats';
import AITaskEnhancer from '@/components/dashboard/AITaskEnhancer';
import AIRecommendations from '@/components/dashboard/AIRecommendations';
import { useTasks, useTaskStats, useTodayTasks, useOverdueTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  CpuChipIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

const MOTIVATIONAL_QUOTES = [
  "You can do it!",
  "Stay productive, stay happy!",
  "Every task done is a step forward.",
  "Small steps every day!",
  "Your future self will thank you!",
];

export default function DashboardPage() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: '',
    ordering: '-created_at',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'ai'>('tasks');
  const [activePanel, setActivePanel] = useState<'tasks' | 'ai'>('tasks');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      router.replace('/login');
    }
  }, [router]);

  // Personalized greeting (try to get username from localStorage or fallback)
  let username = '';
  if (typeof window !== 'undefined') {
    username = localStorage.getItem('username') || '';
  }
  const greeting = username
    ? `Welcome back, ${username}!`
    : MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  // Convert string filters to proper API types
  const apiFilters = {
    search: filters.search || undefined,
    priority: filters.priority || undefined,
    status: filters.status || undefined,
    ordering: filters.ordering || undefined,
  };
  console.log('API FILTERS:', apiFilters);

  const { data: tasksResponse, isLoading: tasksLoading, refetch } = useTasks(apiFilters);
  const { data: categories = [] } = useCategories();
  const tasks = tasksResponse?.results || [];
  const { data: stats, isLoading: statsLoading } = useTaskStats();
  const { data: todayTasks = [] } = useTodayTasks();
  const { data: overdueTasks = [] } = useOverdueTasks();

  // Confetti logic: show when all tasks are completed
  React.useEffect(() => {
    if (tasks.length > 0 && tasks.every(t => t.is_completed)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [tasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      priority: '',
      status: '',
      ordering: '-created_at',
    });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    refetch(); // Refresh the tasks list
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 pb-12 animate-fade-in relative overflow-x-hidden font-sans">
      {/* SVG Pattern Background */}
      <svg className="absolute top-0 left-0 w-full h-64 opacity-10 pointer-events-none" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#2563eb" fillOpacity="0.2" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
      </svg>
      {/* Confetti Animation */}
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={250} recycle={false} gravity={0.2} />} 
      {/* Top Stats Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Total Tasks */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border-t-4 border-blue-500">
            <ChartBarIcon className="w-8 h-8 text-blue-500 mb-2" />
            <div className="text-sm font-semibold text-gray-500 mb-1">Total Tasks</div>
            <div className="text-3xl font-extrabold text-gray-900">{stats?.total_tasks || 0}</div>
          </div>
          {/* Completed */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border-t-4 border-green-500">
            <CheckCircleIcon className="w-8 h-8 text-green-500 mb-2" />
            <div className="text-sm font-semibold text-gray-500 mb-1">Completed</div>
            <div className="text-3xl font-extrabold text-green-600">{stats?.completed_tasks || 0}</div>
          </div>
          {/* Due Today */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border-t-4 border-purple-500">
            <ClockIcon className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-sm font-semibold text-gray-500 mb-1">Due Today</div>
            <div className="text-3xl font-extrabold text-purple-600">{todayTasks.length}</div>
          </div>
          {/* Overdue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border-t-4 border-red-500">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mb-2" />
            <div className="text-sm font-semibold text-gray-500 mb-1">Overdue</div>
            <div className="text-3xl font-extrabold text-red-600">{overdueTasks.length}</div>
          </div>
          {/* Completion Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border-t-4 border-green-400">
            <div className="text-sm font-semibold text-gray-500 mb-1">Completion Rate</div>
            <div className="text-2xl font-extrabold text-green-600 mb-1">{Math.round((stats?.completion_rate || 0) * 100)}%</div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-green-500 transition-all duration-500" style={{ width: `${Math.round((stats?.completion_rate || 0) * 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content: Sidebar + Main Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar: Tasks by Category & Priority */}
        <aside className="md:w-72 w-full space-y-8 bg-white border border-gray-200 rounded-lg shadow p-4 h-fit">
          {/* Tasks by Category */}
          <div>
            <div className="text-lg font-bold text-blue-900 mb-4">Tasks by Category</div>
            <div className="grid grid-cols-2 gap-2">
              {stats && Object.entries(stats.tasks_by_category || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center p-2 bg-blue-50 rounded shadow-sm text-blue-800 font-medium">
                  <span className="truncate">{category}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Tasks by Priority */}
          <div>
            <div className="text-lg font-bold text-blue-900 mb-4">Tasks by Priority</div>
            <div className="space-y-2">
              {stats && Object.entries(stats.tasks_by_priority || {}).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center bg-blue-50 rounded shadow-sm p-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      priority === 'urgent' ? 'bg-red-500' :
                      priority === 'high' ? 'bg-orange-500' :
                      priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="capitalize text-blue-800 font-medium">{priority}</span>
                  </div>
                  <span className="font-semibold text-blue-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
        {/* Main Panel: Tab Switcher and Content */}
        <div className="flex-1">
          {/* Tab Switcher */}
          <div className="flex gap-4 mb-6">
              <button
              className={`flex-1 py-3 rounded-lg text-lg font-bold transition border shadow-sm focus:outline-none ${
                activePanel === 'tasks'
                  ? 'bg-white border-blue-500 text-blue-900 shadow-md'
                  : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-white'
              }`}
              onClick={() => setActivePanel('tasks')}
            >
              Your Tasks
              </button>
              <button
              className={`flex-1 py-3 rounded-lg text-lg font-bold transition border shadow-sm focus:outline-none ${
                activePanel === 'ai'
                  ? 'bg-white border-blue-500 text-blue-900 shadow-md'
                  : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-white'
              }`}
              onClick={() => setActivePanel('ai')}
            >
              AI
              </button>
            </div>
          {/* Main Panel Content */}
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6 min-h-[400px]">
            {activePanel === 'tasks' ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-blue-900">Your Tasks</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                      <FunnelIcon className="w-4 h-4 mr-1" /> Filters
                </Button>
                    <Button onClick={() => setShowTaskForm(true)}>
                      <PlusIcon className="w-4 h-4 mr-1" /> Add Task
                </Button>
              </div>
            </div>
            {showFilters && (
                  <Card className="mb-6">
                <CardHeader>
                      <CardTitle>Filter Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div>
                          <label className="block text-sm font-semibold text-blue-800 mb-1">
                        Search
                      </label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          placeholder="Search tasks..."
                          className="pl-10 w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                          aria-label="Search Tasks"
                        />
                      </div>
                    </div>
                    {/* Priority */}
                    <div>
                          <label className="block text-sm font-semibold text-blue-800 mb-1">
                        Priority
                      </label>
                      <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                      {/* Status */}
                    <div>
                          <label className="block text-sm font-semibold text-blue-800 mb-1">
                        Status
                      </label>
                      <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                          <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                      </select>
                    </div>
                      {/* Sort */}
                    <div>
                          <label className="block text-sm font-semibold text-blue-800 mb-1">
                        Sort By
                      </label>
                      <select
                        value={filters.ordering}
                        onChange={(e) => handleFilterChange('ordering', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        <option value="-created_at">Newest First</option>
                        <option value="created_at">Oldest First</option>
                      </select>
                    </div>
                  </div>
                    {/* Clear Filters */}
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                          className="text-blue-600 hover:text-blue-800 border-blue-300"
                      >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
                {/* Task List */}
              {tasksLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : tasks.length === 0 ? (
                  <Card className="text-center py-12 bg-white/90 shadow-lg rounded-xl">
                  <CardContent>
                    <div className="text-gray-500">
                      <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                      <p className="text-sm mb-4">Create your first task to get started!</p>
                        <Button onClick={() => setShowTaskForm(true)} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Your First Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                        className="transition-transform hover:scale-[1.03] hover:shadow-xl border border-blue-100 bg-white/90 rounded-xl p-4"
                    />
                  ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <AIRecommendations />
                {selectedTask && <AITaskEnhancer task={selectedTask} onTaskUpdated={handleTaskUpdated} />}
              </div>
            )}
            </div>
        </div>
      </div>

      {/* AI Assistant Section */}
      {/* This section is now part of the right panel, so it's removed from here. */}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
          onSuccess={() => handleTaskUpdated}
        />
      )}
    </div>
  );
} 