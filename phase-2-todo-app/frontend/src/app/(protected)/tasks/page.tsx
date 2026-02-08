'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Task } from '@/lib/types';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Dashboard header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="icon-3d w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Todoo</h1>
              <p className="text-sm text-gray-500">Your AI-powered task dashboard</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {/* Total tasks */}
          <div className="stat-card">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{totalTasks}</p>
              <p className="text-xs text-gray-400 truncate">Total</p>
            </div>
          </div>

          {/* Pending */}
          <div className="stat-card">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{pendingTasks}</p>
              <p className="text-xs text-gray-400 truncate">Pending</p>
            </div>
          </div>

          {/* Completion rate */}
          <div className="stat-card">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{completionRate}%</p>
              <p className="text-xs text-gray-400 truncate">Done</p>
            </div>
          </div>
        </div>

        {/* Task form */}
        <TaskForm onTaskCreated={handleTaskCreated} />

        {/* Error state */}
        {error && (
          <div className="glass-panel rounded-2xl bg-red-50/60 border-red-200/40 px-4 py-3 text-sm text-red-700 mb-6 animate-fade-in">
            {error}
            <button
              onClick={loadTasks}
              className="ml-3 text-red-800 underline hover:no-underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Task list */}
        <TaskList
          tasks={tasks}
          loading={loading}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      </div>
    </div>
  );
}
