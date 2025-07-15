// src/components/CalendarContainer.tsx
// Adapted to work with your existing Django Task backend

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar } from './Calendar';
import { Button } from '@/components/calendar_ui/button';
import { Card } from '@/components/calendar_ui/card';
import { 
  X, Clock, Calendar as CalendarIcon, Type, Flag, 
  MapPin, FileText, Target, AlertCircle, Loader2,
  Wifi, WifiOff, Tag
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useCalendarEvents,
  CalendarEvent,
  CalendarUtils
} from './APIs/TaskAPI';

// Simplified Event Dialog for your backend
interface TaskEventDialogProps {
  isOpen: boolean;
  date: Date | null;
  editEvent?: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  categories: any[];
  isLoading?: boolean;
}

const TaskEventDialog: React.FC<TaskEventDialogProps> = ({ 
  isOpen, 
  date, 
  editEvent,
  onClose, 
  onSave,
  categories,
  isLoading = false
}) => {
  // Form state matching your Task model
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [specificTime, setSpecificTime] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'>('not_started');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string>('');
  const [location, setLocation] = useState('');

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description || '');
      setDeadline(editEvent.deadline ? format(editEvent.deadline, 'yyyy-MM-dd') : '');
      setSpecificTime(editEvent.time || '');
      setDuration(editEvent.duration || 60);
      setPriority(editEvent.priority || 'medium');
      setStatus(editEvent.status || 'not_started');
      setCategory(editEvent.category || '');
      setTags(editEvent.tags?.join(', ') || '');
      setLocation(editEvent.location || '');
    } else {
      // Reset form
      setTitle(''); setDescription(''); setDeadline('');
      setSpecificTime(''); setDuration(60); setPriority('medium');
      setStatus('not_started'); setCategory(''); setTags(''); setLocation('');
    }
    setSubmitError(null);
  }, [editEvent, isOpen]);

  const handleSave = async () => {
    if (!title || !date) {
      setSubmitError('Title and date are required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const eventData: Omit<CalendarEvent, 'id'> = {
        title,
        description: description || undefined,
        date,
        time: specificTime || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        duration,
        priority,
        status,
        category: category || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        location: location || undefined,
        type: 'task', // All items are tasks in your backend
        completed: status === 'completed',
        progress: status === 'completed' ? 100 : 0,
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save task');
      console.error('Failed to save task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities = [
    { value: 'low', label: '🟢 Low Priority', description: 'Nice to have' },
    { value: 'medium', label: '🟡 Medium Priority', description: 'Should be done' },
    { value: 'high', label: '🟠 High Priority', description: 'Important' },
    { value: 'urgent', label: '🔴 Urgent', description: 'Must be done now' }
  ];

  const statuses = [
    { value: 'not_started', label: '⭕ Not Started' },
    { value: 'in_progress', label: '🔄 In Progress' },
    { value: 'completed', label: '✅ Completed' },
    { value: 'on_hold', label: '⏸️ On Hold' },
    { value: 'cancelled', label: '❌ Cancelled' }
  ];

  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <Card className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              {editEvent ? 'Edit Task' : 'Create New Task'}
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(date, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {submitError}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Task Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors text-lg"
                placeholder="Enter task name..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                rows={3}
                placeholder="Describe the task..."
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Priority & Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} - {p.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Time & Deadline */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specific Time</label>
                <input
                  type="time"
                  value={specificTime}
                  onChange={(e) => setSpecificTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={isSubmitting}
                  min="1"
                  step="15"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Category & Location */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Organization
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  placeholder="Where will this happen?"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="urgent, meeting, project..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
              className="flex-1 border-2 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title || isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editEvent ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Main Calendar Container for your backend
const AdaptedCalendarContainer: React.FC = () => {
  // Use the adapted API hook for your backend
  const {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    markTaskCompleted,
    fetchStats,
    stats,
    categories,
    fetchCategories
  } = useCalendarEvents();

  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data on mount
  useEffect(() => {
    refreshEvents();
    fetchCategories();
  }, [refreshEvents, fetchCategories]);

  // Event Handlers
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    console.log('📅 Date selected:', format(date, 'yyyy-MM-dd'));
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    console.log('🎯 Task clicked:', event);
    setEditingEvent(event);
    setSelectedDate(event.date);
    setShowEventDialog(true);
  }, []);

  const handleAddEvent = useCallback((date: Date) => {
    console.log('➕ Adding task for date:', format(date, 'yyyy-MM-dd'));
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventDialog(true);
  }, []);

  const handleRefreshEvents = useCallback(() => {
    console.log('🔄 Refreshing tasks from database...');
    refreshEvents();
  }, [refreshEvents]);

  const handleSaveEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      if (editingEvent) {
        console.log('📝 Updating task in database:', editingEvent.id);
        await updateEvent(editingEvent.id, eventData);
      } else {
        console.log('➕ Adding new task to database');
        await addEvent(eventData);
      }
      
      setShowEventDialog(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('❌ Failed to save task:', error);
      throw error; // Re-throw to show error in dialog
    }
  }, [editingEvent, addEvent, updateEvent]);

  const handleQuickComplete = useCallback(async (eventId: string) => {
    try {
      await markTaskCompleted(eventId);
    } catch (error) {
      console.error('❌ Failed to toggle task completion:', error);
    }
  }, [markTaskCompleted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        {/* Connection Status */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              You're offline. Changes will be saved when connection is restored.
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshEvents}
              className="text-red-600 hover:text-red-700"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <div className="text-2xl font-bold text-blue-600">{CalendarUtils.getTodayEvents(events).length}</div>
              <div className="text-sm text-gray-600">Today's Tasks</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <div className="text-2xl font-bold text-green-600">{stats.completion_rate || 0}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <div className="text-2xl font-bold text-orange-600">{stats.overdue || 0}</div>
              <div className="text-sm text-gray-600">Overdue Tasks</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <div className="text-2xl font-bold text-purple-600">{stats.total || 0}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
          </div>
        )}

        {/* Calendar Component */}
        <Calendar
          events={events}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onAddEvent={handleAddEvent}
          onRefreshEvents={handleRefreshEvents}
          isLoading={loading}
        />

        {/* Task Dialog */}
        <TaskEventDialog
          isOpen={showEventDialog}
          date={selectedDate}
          editEvent={editingEvent}
          onClose={() => {
            setShowEventDialog(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          categories={categories}
          isLoading={loading}
        />
      </div>
    </div>
  );
};

export default AdaptedCalendarContainer;