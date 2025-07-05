'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTaskStats, useTodayTasks, useOverdueTasks } from '@/hooks/useTasks';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardStats() {
  const { data: stats, isLoading: statsLoading } = useTaskStats();
  const { data: todayTasks = [], isLoading: todayLoading } = useTodayTasks();
  const { data: overdueTasks = [], isLoading: overdueLoading } = useOverdueTasks();

  if (statsLoading || todayLoading || overdueLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.total_tasks || 0,
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Completed',
      value: stats?.completed_tasks || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Due Today',
      value: todayTasks.length,
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="transition-all duration-200 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Stats */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-black font-medium">Overall</span>
                  <span className="text-black font-bold text-lg">{Math.round(stats.completion_rate * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completion_rate * 100}%` }}
                  ></div>
                </div>
                {stats.avg_completion_time_hours > 0 && (
                  <p className="text-xs text-gray-500">
                    Average completion time: {Math.round(stats.avg_completion_time_hours)} hours
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.tasks_by_priority || {}).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          priority === 'urgent' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                      <span className="text-sm capitalize text-black">{priority}</span>
                    </div>
                    <span className="text-sm font-medium text-black">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          {Object.keys(stats.tasks_by_category || {}).length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-gray-900">Tasks by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(stats.tasks_by_category).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 truncate">{category}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 