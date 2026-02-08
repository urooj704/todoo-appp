'use client';

import { useState } from 'react';
import { api, ApiClientError } from '@/lib/api';
import { Task } from '@/lib/types';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await api.toggleTaskComplete(task.id);
      onUpdate(updated);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setError('You do not have access to this task');
      } else {
        setError('Failed to update task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updated = await api.updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setError('You do not have access to this task');
      } else {
        setError('Failed to update task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description || '');
    setEditing(false);
    setError('');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.deleteTask(task.id);
      onDelete(task.id);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setError('You do not have access to this task');
      } else {
        setError('Failed to delete task');
      }
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="card-3d mb-3 p-4 sm:p-5 animate-scale-in">
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-3 animate-fade-in">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`input ${!title.trim() && error ? 'input-error' : ''}`}
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
              rows={2}
              maxLength={2000}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-3d mb-3 p-4 sm:p-5 animate-slide-up ${task.completed ? 'opacity-75' : ''}`}>
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-3 animate-fade-in">
          {error}
        </div>
      )}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Custom checkbox with 3D feel */}
        <div className="flex-shrink-0 pt-0.5">
          <button
            onClick={handleToggleComplete}
            disabled={loading}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 disabled:opacity-50
              ${task.completed
                ? 'bg-gradient-to-br from-brand-400 to-brand-600 border-brand-400 shadow-glow-brand'
                : 'border-gray-300 hover:border-brand-400 hover:shadow-sm bg-white/50'
              }`}
          >
            {task.completed && (
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-base sm:text-[15px] font-medium break-words leading-relaxed ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className={`mt-1 text-sm break-words ${task.completed ? 'text-gray-300' : 'text-gray-500'}`}>
              {task.description}
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-400">
            {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-1">
          <button
            onClick={() => setEditing(true)}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50/50 disabled:opacity-50 transition-all duration-200"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 disabled:opacity-50 transition-all duration-200"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
