
import {
  taskAPI,
  categoryAPI,
  taskUtils
} from './APIs/TaskAPI';

// src/components/CalendarContainer.tsx
// Fixed to work with your existing TaskAPI.js

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar } from './Calendar';
import { Button } from '@/components/calendar_ui/button';
import { Card } from '@/components/calendar_ui/card';
import { 
  X, Clock, Calendar as CalendarIcon, Type, Flag, 
  MapPin, Target, AlertCircle, Loader2,
  Wifi, WifiOff, Tag
} from 'lucide-react';
import { format } from 'date-fns';
// Calendar Event interface
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  deadline?: Date;
  duration?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  category?: string;
  tags?: string[];
  location?: string;
  type?: 'task' | 'event' | 'reminder';
  completed?: boolean;
  progress?: number;
  color?: string;
}

// Comprehensive Task Event Dialog matching your Task model
interface ComprehensiveTaskDialogProps {
  isOpen: boolean;
  date: Date | null;
  editEvent?: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  categories: any[];
  existingTasks: any[];
  isLoading?: boolean;
}

const ComprehensiveTaskDialog: React.FC<ComprehensiveTaskDialogProps> = ({ 
  isOpen, 
  date, 
  editEvent,
  onClose, 
  onSave,
  categories,
  existingTasks = [],
  isLoading = false
}) => {
  // Basic Information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string>('');

  // Timing Information
  const [deadline, setDeadline] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [specificTime, setSpecificTime] = useState('');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<number>(60);
  const [minimumDurationMinutes, setMinimumDurationMinutes] = useState<number>(30);
  const [maximumDurationMinutes, setMaximumDurationMinutes] = useState<number>(120);

  // Priority and Difficulty
  const [priority, setPriority] = useState<number>(3); // 1-5 scale
  const [urgency, setUrgency] = useState<number>(3); // 1-5 scale
  const [difficultyLevel, setDifficultyLevel] = useState<number>(3); // 1-5 scale
  const [basePriority, setBasePriority] = useState<number>(3);
  const [urgencyMultiplier, setUrgencyMultiplier] = useState<number>(1.0);

  // Progress and Effort
  const [status, setStatus] = useState<string>('pending');
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [estimatedEffortHours, setEstimatedEffortHours] = useState<number>(1.0);
  const [actualTimeSpentMinutes, setActualTimeSpentMinutes] = useState<number>(0);

  // Location and Tools
  const [location, setLocation] = useState('');
  const [requiredTools, setRequiredTools] = useState<string>('');

  // Dependencies and Relationships
  const [prerequisiteTasks, setPrerequisiteTasks] = useState<string>('');
  const [blockingTasks, setBlockingTasks] = useState<string>('');

  // Scheduling Constraints
  const [canBeSplit, setCanBeSplit] = useState<boolean>(true);
  const [requiresConsecutiveTime, setRequiresConsecutiveTime] = useState<boolean>(false);
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<string>('');
  const [avoidTimeOfDay, setAvoidTimeOfDay] = useState<string>('');

  // Advanced Fields
  const [deadlineFlexibilityMinutes, setDeadlineFlexibilityMinutes] = useState<number>(0);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [repeatPattern, setRepeatPattern] = useState<string>('');
  const [repeatFrequency, setRepeatFrequency] = useState<number>(1);
  const [repeatDaysOfWeek, setRepeatDaysOfWeek] = useState<string>('');

  // AI and Quality
  const [aiSuggested, setAiSuggested] = useState<boolean>(false);
  const [userSatisfactionRating, setUserSatisfactionRating] = useState<number>(0);
  const [aiConfidenceScore, setAiConfidenceScore] = useState<number>(0);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'timing', 'priority']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  useEffect(() => {
    if (editEvent) {
      // Load existing task data - you'll need to fetch full task details here
      setName(editEvent.title);
      setDescription(editEvent.description || '');
      setDeadline(editEvent.deadline ? format(editEvent.deadline, 'yyyy-MM-dd') : '');
      setSpecificTime(editEvent.time || '');
      setDurationMinutes(editEvent.duration || 60);
      
      // Map priority
      const priorityMap: { [key: string]: number } = {
        'urgent': 1, 'high': 2, 'medium': 3, 'low': 5
      };
      setPriority(priorityMap[editEvent.priority || 'medium'] || 3);
      setUrgency(priorityMap[editEvent.priority || 'medium'] || 3);
      
      // Map status
      const statusMap: { [key: string]: string } = {
        'not_started': 'pending', 'in_progress': 'in_progress',
        'completed': 'completed', 'cancelled': 'cancelled', 'on_hold': 'on_hold'
      };
      setStatus(statusMap[editEvent.status || 'not_started'] || 'pending');
      
      setCategory(editEvent.category || '');
      setTags(editEvent.tags?.join(', ') || '');
      setLocation(editEvent.location || '');
      setCompletionPercentage(editEvent.progress || 0);
    } else {
      // Reset all fields
      setName(''); setDescription(''); setDeadline(''); setSpecificTime('');
      setDurationMinutes(60); setEstimatedDurationMinutes(60);
      setMinimumDurationMinutes(30); setMaximumDurationMinutes(120);
      setPriority(3); setUrgency(3); setDifficultyLevel(3);
      setBasePriority(3); setUrgencyMultiplier(1.0);
      setStatus('pending'); setCompletionPercentage(0);
      setEstimatedEffortHours(1.0); setActualTimeSpentMinutes(0);
      setLocation(''); setRequiredTools(''); setPrerequisiteTasks('');
      setBlockingTasks(''); setCategory(''); setTags('');
      setCanBeSplit(true); setRequiresConsecutiveTime(false);
      setPreferredTimeOfDay(''); setAvoidTimeOfDay('');
      setDeadlineFlexibilityMinutes(0); setIsRepeat(false);
      setRepeatPattern(''); setRepeatFrequency(1); setRepeatDaysOfWeek('');
      setAiSuggested(false); setUserSatisfactionRating(0); setAiConfidenceScore(0);
    }
    setSubmitError(null);
  }, [editEvent, isOpen]);

  const handleSave = async () => {
    if (!name || !date) {
      setSubmitError('Task name and date are required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create comprehensive task data for your backend
      const taskData = {
        // Basic Information
        name: name,
        description: description,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        
        // Timing Information
        duration_minutes: durationMinutes,
        estimated_duration_minutes: estimatedDurationMinutes,
        minimum_duration_minutes: minimumDurationMinutes,
        maximum_duration_minutes: maximumDurationMinutes,
        deadline_flexibility_minutes: deadlineFlexibilityMinutes,
        
        // Priority System
        priority: priority,
        urgency: urgency,
        difficulty_level: difficultyLevel,
        base_priority: basePriority,
        urgency_multiplier: urgencyMultiplier,
        
        // Progress and Status
        status: status,
        completion_percentage: completionPercentage,
        estimated_effort_hours: estimatedEffortHours,
        actual_time_spent_minutes: actualTimeSpentMinutes,
        
        // Location and Context
        location: location,
        required_tools: requiredTools ? requiredTools.split(',').map(tool => tool.trim()).filter(Boolean) : [],
        
        // Dependencies
        prerequisite_tasks: prerequisiteTasks ? prerequisiteTasks.split(',').map(id => id.trim()).filter(Boolean) : [],
        blocking_tasks: blockingTasks ? blockingTasks.split(',').map(id => id.trim()).filter(Boolean) : [],
        
        // Scheduling Constraints
        can_be_split: canBeSplit,
        requires_consecutive_time: requiresConsecutiveTime,
        preferred_time_of_day: preferredTimeOfDay ? preferredTimeOfDay.split(',').map(time => time.trim()).filter(Boolean) : [],
        avoid_time_of_day: avoidTimeOfDay ? avoidTimeOfDay.split(',').map(time => time.trim()).filter(Boolean) : [],
        
        // Repetition
        is_repeat: isRepeat,
        repeat_pattern: repeatPattern,
        repeat_frequency: repeatFrequency,
        repeat_days_of_week: repeatDaysOfWeek ? repeatDaysOfWeek.split(',').map(day => day.trim()).filter(Boolean) : [],
        
        // AI Fields
        ai_suggested: aiSuggested,
        user_satisfaction_rating: userSatisfactionRating || null,
        ai_confidence_score: aiConfidenceScore || null,
      };

      // Set deadline and specific time
      if (deadline) {
        if (specificTime) {
          const [hours, minutes] = specificTime.split(':');
          const deadlineDate = new Date(deadline);
          deadlineDate.setHours(parseInt(hours), parseInt(minutes));
          taskData.deadline = deadlineDate.toISOString();
          taskData.specific_time = deadlineDate.toISOString();
        } else {
          taskData.deadline = new Date(deadline).toISOString();
        }
      }

      // Set category ID
      if (category) {
        const selectedCategory = categories.find(cat => cat.name === category);
        if (selectedCategory) {
          taskData.category = selectedCategory.id;
        }
      }

      console.log('Creating comprehensive task:', taskData);

      // Call your API
      if (editEvent) {
        await taskAPI.updateTask(editEvent.id, taskData);
      } else {
        await taskAPI.createTask(taskData);
      }

      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save task');
      console.error('Failed to save comprehensive task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <Card className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              {editEvent ? 'Edit Task' : 'Create Comprehensive Task'}
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
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Type className="h-5 w-5" />
                Basic Information
              </h3>
              {expandedSections.has('basic') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('basic') && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Task Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    placeholder="Detailed description of the task..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
            )}
          </div>

          {/* Timing Information */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('timing')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timing & Duration
              </h3>
              {expandedSections.has('timing') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('timing') && (
              <div className="p-4 space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline Flexibility (minutes)</label>
                    <input
                      type="number"
                      value={deadlineFlexibilityMinutes}
                      onChange={(e) => setDeadlineFlexibilityMinutes(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      min="0"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      min="1"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration</label>
                    <input
                      type="number"
                      value={estimatedDurationMinutes}
                      onChange={(e) => setEstimatedDurationMinutes(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      min="1"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Duration</label>
                    <input
                      type="number"
                      value={minimumDurationMinutes}
                      onChange={(e) => setMinimumDurationMinutes(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      min="1"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Duration</label>
                    <input
                      type="number"
                      value={maximumDurationMinutes}
                      onChange={(e) => setMaximumDurationMinutes(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      min="1"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Effort (hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={estimatedEffortHours}
                      onChange={(e) => setEstimatedEffortHours(parseFloat(e.target.value))}
                      disabled={isSubmitting}
                      min="0"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Time Spent (minutes)</label>
                    <input
                      type="number"
                      value={actualTimeSpentMinutes}
                      onChange={(e) => setActualTimeSpentMinutes(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      min="0"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Priority & Difficulty */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('priority')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Priority & Difficulty
              </h3>
              {expandedSections.has('priority') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('priority') && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-5)</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value={1}>🔴 Critical (1)</option>
                      <option value={2}>🟠 High (2)</option>
                      <option value={3}>🟡 Medium (3)</option>
                      <option value={4}>🟢 Low (4)</option>
                      <option value={5}>🔵 Lowest (5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency (1-5)</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value={1}>🔴 Urgent (1)</option>
                      <option value={2}>🟠 High (2)</option>
                      <option value={3}>🟡 Medium (3)</option>
                      <option value={4}>🟢 Low (4)</option>
                      <option value={5}>🔵 Lowest (5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty (1-5)</label>
                    <select
                      value={difficultyLevel}
                      onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value={1}>💎 Very Hard (1)</option>
                      <option value={2}>🔴 Hard (2)</option>
                      <option value={3}>🟡 Medium (3)</option>
                      <option value={4}>🟢 Easy (4)</option>
                      <option value={5}>⭐ Very Easy (5)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Priority</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={basePriority}
                      onChange={(e) => setBasePriority(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5.0"
                      value={urgencyMultiplier}
                      onChange={(e) => setUrgencyMultiplier(parseFloat(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="pending">⭕ Pending</option>
                      <option value="in_progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="on_hold">⏸️ On Hold</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Percentage: {completionPercentage}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={completionPercentage}
                    onChange={(e) => setCompletionPercentage(parseInt(e.target.value))}
                    disabled={isSubmitting}
                    className="w-full disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Tools */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('location')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Tools
              </h3>
              {expandedSections.has('location') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('location') && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      placeholder="Where will this happen?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Tools (comma-separated)</label>
                    <input
                      type="text"
                      value={requiredTools}
                      onChange={(e) => setRequiredTools(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      placeholder="laptop, notebook, calculator..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dependencies */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('dependencies')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Dependencies & Relationships
              </h3>
              {expandedSections.has('dependencies') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('dependencies') && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisite Tasks (comma-separated IDs)</label>
                    <input
                      type="text"
                      value={prerequisiteTasks}
                      onChange={(e) => setPrerequisiteTasks(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      placeholder="task1, task2, task3..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blocking Tasks (comma-separated IDs)</label>
                    <input
                      type="text"
                      value={blockingTasks}
                      onChange={(e) => setBlockingTasks(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      placeholder="task4, task5, task6..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scheduling Constraints */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('scheduling')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Scheduling Constraints
              </h3>
              {expandedSections.has('scheduling') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('scheduling') && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={canBeSplit}
                        onChange={(e) => setCanBeSplit(e.target.checked)}
                        disabled={isSubmitting}
                        className="rounded border-gray-300"
                      />
                      Can be split into smaller chunks
                    </label>

                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={requiresConsecutiveTime}
                        onChange={(e) => setRequiresConsecutiveTime(e.target.checked)}
                        disabled={isSubmitting}
                        className="rounded border-gray-300"
                      />
                      Requires consecutive time block
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time of Day</label>
                      <input
                        type="text"
                        value={preferredTimeOfDay}
                        onChange={(e) => setPreferredTimeOfDay(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        placeholder="morning, afternoon, evening..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Avoid Time of Day</label>
                      <input
                        type="text"
                        value={avoidTimeOfDay}
                        onChange={(e) => setAvoidTimeOfDay(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        placeholder="late night, early morning..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Repetition */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('repetition')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Repetition & Recurrence
              </h3>
              {expandedSections.has('repetition') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('repetition') && (
              <div className="p-4 space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isRepeat}
                    onChange={(e) => setIsRepeat(e.target.checked)}
                    disabled={isSubmitting}
                    className="rounded border-gray-300"
                  />
                  This is a recurring task
                </label>

                {isRepeat && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Pattern</label>
                      <select
                        value={repeatPattern}
                        onChange={(e) => setRepeatPattern(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select pattern...</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <input
                        type="number"
                        min="1"
                        value={repeatFrequency}
                        onChange={(e) => setRepeatFrequency(parseInt(e.target.value))}
                        disabled={isSubmitting}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Days of Week</label>
                      <input
                        type="text"
                        value={repeatDaysOfWeek}
                        onChange={(e) => setRepeatDaysOfWeek(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        placeholder="Monday, Tuesday, Friday..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI & Quality */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('ai')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI & Quality Metrics
              </h3>
              {expandedSections.has('ai') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {expandedSections.has('ai') && (
              <div className="p-4 space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={aiSuggested}
                    onChange={(e) => setAiSuggested(e.target.checked)}
                    disabled={isSubmitting}
                    className="rounded border-gray-300"
                  />
                  AI-suggested task
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Satisfaction (1-5)</label>
                    <select
                      value={userSatisfactionRating}
                      onChange={(e) => setUserSatisfactionRating(parseInt(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value={0}>Not rated</option>
                      <option value={1}>⭐ Poor (1)</option>
                      <option value={2}>⭐⭐ Fair (2)</option>
                      <option value={3}>⭐⭐⭐ Good (3)</option>
                      <option value={4}>⭐⭐⭐⭐ Very Good (4)</option>
                      <option value={5}>⭐⭐⭐⭐⭐ Excellent (5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Confidence Score (0-1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={aiConfidenceScore}
                      onChange={(e) => setAiConfidenceScore(parseFloat(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
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
              disabled={!name || isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editEvent ? 'Update' : 'Create'} Comprehensive Task
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Main Calendar Container (same as before, just updated dialog component)
const ComprehensiveCalendarContainer: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [existingTasks, setExistingTasks] = useState<any[]>([]);

  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Transform backend task to calendar event (same as before)
  const transformTaskToEvent = (task: any): CalendarEvent => {
    let displayDate = new Date();
    if (task.specific_time) {
      displayDate = new Date(task.specific_time);
    } else if (task.deadline) {
      displayDate = new Date(task.deadline);
    } else {
      displayDate = new Date(task.created_at || Date.now());
    }

    const priorityMap: { [key: number]: 'low' | 'medium' | 'high' | 'urgent' } = {
      1: 'urgent', 2: 'high', 3: 'medium', 4: 'medium', 5: 'low'
    };

    return {
      id: task.id,
      title: task.name,
      description: task.description,
      date: displayDate,
      time: task.specific_time ? taskUtils.formatTime(task.specific_time) : undefined,
      deadline: task.deadline ? new Date(task.deadline) : undefined,
      duration: task.duration_minutes,
      priority: priorityMap[task.priority] || 'medium',
      status: task.status === 'pending' ? 'not_started' : task.status,
      category: task.category?.name,
      tags: Array.isArray(task.tags) ? task.tags : [],
      location: task.location,
      type: 'task',
      completed: task.status === 'completed',
      progress: task.completion_percentage || 0,
      color: taskUtils.getPriorityColor(task.priority),
    };
  };

  // Load data functions (same as before)
  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading comprehensive tasks...');
      const tasks = await taskAPI.loadTasks();
      setExistingTasks(tasks); // Store full task data
      const calendarEvents = tasks.map(transformTaskToEvent);
      setEvents(calendarEvents);
      console.log(`✅ Loaded ${calendarEvents.length} comprehensive tasks`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
      console.error('❌ Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await categoryAPI.loadCategories();
      setCategories(cats);
    } catch (err) {
      console.error('❌ Failed to load categories:', err);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await taskAPI.getTaskStats();
      setStats(statsData);
    } catch (err) {
      console.error('❌ Failed to load stats:', err);
    }
  };

  // Event handlers (same as before)
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

  useEffect(() => {
    loadTasks();
    loadCategories();
    loadStats();
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    console.log('📅 Date selected:', format(date, 'yyyy-MM-dd'));
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    console.log('🎯 Comprehensive task clicked:', event);
    setEditingEvent(event);
    setSelectedDate(event.date);
    setShowEventDialog(true);
  }, []);

  const handleAddEvent = useCallback((date: Date) => {
    console.log('➕ Adding comprehensive task for date:', format(date, 'yyyy-MM-dd'));
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventDialog(true);
  }, []);

  const handleRefreshEvents = useCallback(() => {
    console.log('🔄 Refreshing comprehensive tasks...');
    loadTasks();
    loadStats();
  }, []);

  const handleSaveEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      await loadTasks();
      await loadStats();
      
      setShowEventDialog(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('❌ Failed to save comprehensive task:', error);
      throw error;
    }
  }, []);

  const getTodayEvents = (events: CalendarEvent[]) => {
    const today = new Date().toDateString();
    return events.filter(event => event.date.toDateString() === today);
  };

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
              <div className="text-2xl font-bold text-blue-600">{getTodayEvents(events).length}</div>
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

        {/* Comprehensive Task Dialog */}
        <ComprehensiveTaskDialog
          isOpen={showEventDialog}
          date={selectedDate}
          editEvent={editingEvent}
          onClose={() => {
            setShowEventDialog(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          categories={categories}
          existingTasks={existingTasks}
          isLoading={loading}
        />
      </div>
    </div>
  );
};

export default ComprehensiveCalendarContainer;