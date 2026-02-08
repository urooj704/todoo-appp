'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Task } from '@/lib/types';

interface TaskFormProps {
  onTaskCreated: (task: Task) => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const task = await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onTaskCreated(task);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-6 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        {/* 3D Add icon */}
        <div className="icon-3d w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-brand">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">New Task</h2>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`input ${!title.trim() && error ? 'input-error' : ''}`}
            placeholder="What needs to be done?"
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none"
            placeholder="Add more details..."
            rows={2}
            maxLength={2000}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Adding...
            </span>
          ) : (
            'Add Task'
          )}
        </button>
      </div>
    </form>
  );
}
