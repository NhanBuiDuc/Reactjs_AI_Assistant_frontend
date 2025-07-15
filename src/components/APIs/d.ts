// src/api/calendarApi.ts
// Adapted to work with your existing Django Task backend

import { useState, useEffect, useCallback } from 'react';

// Backend Task Interface (matches your Django Task model)
export interface BackendTask {
  id: string;
  name: string;
  description: string;
  category?: {
    id: string;
    name: string;
    color_hex: string;
  };
  tags: string[];
  
  // Timing
  deadline?: string; // ISO datetime string
  duration_minutes?: number;
  specific_time?: string; // ISO datetime string
  
  // Priority & Status
  priority: number; // 1-5 scale
  urgency: number; // 1-5 scale
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  completion_percentage: number;
  
  // Location & Tools
  location: string;
  required_tools: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Frontend Calendar Event Interface (for display)
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  
  // Extended fields mapped from Task
  deadline?: Date;
  duration?: number; // minutes
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  category?: string;
  tags?: string[];
  location?: string;
  color?: string;
  type?: 'task' | 'event' | 'reminder';
  completed?: boolean;
  progress?: number;
}

// Request interfaces for your backend
export interface CreateTaskRequest {
  name: string;
  description?: string;
  category?: string; // category ID
  tags?: string[];
  deadline?: string; // ISO datetime
  duration_minutes?: number;
  specific_time?: string; // ISO datetime
  priority?: number;
  urgency?: number;
  location?: string;
  required_tools?: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
  status?: string;
  completion_percentage?: number;
}

class AdaptedCalendarAPI {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.updateAuthToken();
  }

  private updateAuthToken(): void {
    this.authToken = localStorage.getItem('deeptalk_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    this.updateAuthToken();
    
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error: ${response.status}`, errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Get all tasks (mapped to calendar events)
  async getTasks(status?: string): Promise<BackendTask[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    const endpoint = `/api/tasks/${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<{ tasks: BackendTask[] }>(endpoint);
    return response.tasks || [];
  }

  // Create a new task
  async createTask(task: CreateTaskRequest): Promise<BackendTask> {
    console.log('📝 Creating task:', task);
    const response = await this.request<{ task: BackendTask }>('/api/tasks/', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return response.task;
  }

  // Update an existing task
  async updateTask(taskId: string, updates: Partial<CreateTaskRequest>): Promise<BackendTask> {
    console.log(`📝 Updating task ${taskId}:`, updates);
    const response = await this.request<{ task: BackendTask }>(`/api/tasks/${taskId}/`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.task;
  }

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    console.log(`🗑️ Deleting task ${taskId}`);
    await this.request<void>(`/api/tasks/${taskId}/`, {
      method: 'DELETE',
    });
  }

  // Toggle task status (using your existing endpoint)
  async toggleTaskStatus(taskId: string): Promise<BackendTask> {
    console.log(`🔄 Toggling task status ${taskId}`);
    const response = await this.request<{ task: BackendTask }>(`/api/tasks/${taskId}/toggle-status/`, {
      method: 'POST',
    });
    return response.task;
  }

  // Get task statistics
  async getTaskStats(): Promise<any> {
    const response = await this.request<any>('/api/task-stats/');
    return response;
  }

  // Get task categories
  async getCategories(): Promise<any[]> {
    const response = await this.request<{ categories: any[] }>('/api/categories/');
    return response.categories || [];
  }

  // Search tasks
  async searchTasks(query: string, filters?: { status?: string; priority?: number }): Promise<BackendTask[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority.toString());
    
    const response = await this.request<{ tasks: BackendTask[] }>(`/api/search-tasks/?${params.toString()}`);
    return response.tasks || [];
  }
}

// Create a singleton instance
export const calendarApi = new AdaptedCalendarAPI();

// Transformation Functions
export const transformBackendTaskToCalendarEvent = (task: BackendTask): CalendarEvent => {
  // Determine the date to display on calendar
  let displayDate = new Date();
  if (task.specific_time) {
    displayDate = new Date(task.specific_time);
  } else if (task.deadline) {
    displayDate = new Date(task.deadline);
  } else {
    displayDate = new Date(task.created_at);
  }

  // Map priority (1-5 backend) to frontend strings
  const priorityMap: { [key: number]: 'low' | 'medium' | 'high' | 'urgent' } = {
    1: 'urgent',
    2: 'high', 
    3: 'medium',
    4: 'medium',
    5: 'low'
  };

  // Map status
  const statusMap: { [key: string]: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' } = {
    'pending': 'not_started',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'on_hold': 'on_hold'
  };

  return {
    id: task.id,
    title: task.name,
    description: task.description,
    date: displayDate,
    time: task.specific_time ? format(new Date(task.specific_time), 'HH:mm') : undefined,
    
    // Extended fields
    deadline: task.deadline ? new Date(task.deadline) : undefined,
    duration: task.duration_minutes,
    priority: priorityMap[task.priority] || 'medium',
    status: statusMap[task.status] || 'not_started',
    category: task.category?.name,
    tags: task.tags,
    location: task.location,
    color: task.category?.color_hex || '#3b82f6',
    type: 'task', // All items from backend are tasks
    completed: task.status === 'completed',
    progress: task.completion_percentage,
  };
};

export const transformCalendarEventToBackendTask = (event: Partial<CalendarEvent>): CreateTaskRequest => {
  // Map frontend priority to backend (1-5)
  const priorityMap: { [key: string]: number } = {
    'urgent': 1,
    'high': 2,
    'medium': 3,
    'low': 5
  };

  // Map frontend status to backend
  const statusMap: { [key: string]: string } = {
    'not_started': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'on_hold': 'on_hold'
  };

  const task: CreateTaskRequest = {
    name: event.title || '',
    description: event.description || '',
    tags: event.tags || [],
    location: event.location || '',
    priority: event.priority ? priorityMap[event.priority] : 3,
    urgency: event.priority ? priorityMap[event.priority] : 3, // Use same as priority for now
  };

  // Set timing fields
  if (event.date) {
    if (event.time) {
      // Specific time set
      const [hours, minutes] = event.time.split(':');
      const specificDateTime = new Date(event.date);
      specificDateTime.setHours(parseInt(hours), parseInt(minutes));
      task.specific_time = specificDateTime.toISOString();
    }
    
    if (event.deadline) {
      task.deadline = event.deadline.toISOString();
    } else {
      // Use event date as deadline if no specific deadline set
      task.deadline = event.date.toISOString();
    }
  }

  if (event.duration) {
    task.duration_minutes = event.duration;
  }

  return task;
};

// Enhanced React Hook for your backend
export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch tasks and convert to calendar events
  const fetchEvents = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Fetching tasks from backend...');
      const backendTasks = await calendarApi.getTasks(status);
      
      const calendarEvents = backendTasks.map(transformBackendTaskToCalendarEvent);
      setEvents(calendarEvents);
      console.log(`✅ Loaded ${calendarEvents.length} tasks as calendar events`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('❌ Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new task
  const addEvent = useCallback(async (event: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('➕ Adding new task:', event.title);
      const taskData = transformCalendarEventToBackendTask(event);
      const newBackendTask = await calendarApi.createTask(taskData);
      const newCalendarEvent = transformBackendTaskToCalendarEvent(newBackendTask);
      
      setEvents(prev => [...prev, newCalendarEvent]);
      console.log('✅ Task added successfully:', newCalendarEvent.title);
      return newCalendarEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add task';
      setError(errorMessage);
      console.error('❌ Failed to add task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update task
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 Updating task:', eventId);
      const taskUpdates = transformCalendarEventToBackendTask(updates);
      const updatedBackendTask = await calendarApi.updateTask(eventId, taskUpdates);
      const updatedCalendarEvent = transformBackendTaskToCalendarEvent(updatedBackendTask);
      
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedCalendarEvent : event
      ));
      
      console.log('✅ Task updated successfully:', updatedCalendarEvent.title);
      return updatedCalendarEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      console.error('❌ Failed to update task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete task
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ Deleting task:', eventId);
      await calendarApi.deleteTask(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      console.log('✅ Task deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      console.error('❌ Failed to delete task:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle task completion (using your backend endpoint)
  const markTaskCompleted = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      console.log('✅ Toggling task completion:', eventId);
      const updatedBackendTask = await calendarApi.toggleTaskStatus(eventId);
      const updatedCalendarEvent = transformBackendTaskToCalendarEvent(updatedBackendTask);
      
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedCalendarEvent : event
      ));
      
      console.log('✅ Task status toggled successfully');
      return true;
    } catch (err) {
      console.error('❌ Failed to toggle task status:', err);
      return false;
    }
  }, []);

  // Get task statistics
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await calendarApi.getTaskStats();
      setStats(statsData);
      return statsData;
    } catch (err) {
      console.error('❌ Failed to fetch task stats:', err);
      return null;
    }
  }, []);

  // Get categories
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await calendarApi.getCategories();
      setCategories(categoriesData);
      return categoriesData;
    } catch (err) {
      console.error('❌ Failed to fetch categories:', err);
      return [];
    }
  }, []);

  // Search tasks
  const searchEvents = useCallback(async (query: string, filters?: { status?: string; priority?: number }) => {
    try {
      const searchResults = await calendarApi.searchTasks(query, filters);
      const calendarEvents = searchResults.map(transformBackendTaskToCalendarEvent);
      return calendarEvents;
    } catch (err) {
      console.error('❌ Failed to search tasks:', err);
      return [];
    }
  }, []);

  // Refresh everything
  const refreshEvents = useCallback(() => {
    console.log('🔄 Refreshing tasks...');
    fetchEvents();
    fetchStats();
    fetchCategories();
  }, [fetchEvents, fetchStats, fetchCategories]);

  return {
    // Data
    events,
    loading,
    error,
    stats,
    categories,
    
    // Basic operations
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    
    // Advanced operations
    markTaskCompleted,
    fetchStats,
    fetchCategories,
    searchEvents,
  };
};

// Utility functions for working with your task data
export const CalendarUtils = {
  // Filter events by type (all are tasks in your backend)
  filterByType: (events: CalendarEvent[], type: string) => 
    events.filter(event => event.type === type),
  
  // Filter events by priority
  filterByPriority: (events: CalendarEvent[], priority: string) => 
    events.filter(event => event.priority === priority),
  
  // Get events for today
  getTodayEvents: (events: CalendarEvent[]) => {
    const today = new Date().toDateString();
    return events.filter(event => event.date.toDateString() === today);
  },
  
  // Get overdue tasks
  getOverdueTasks: (events: CalendarEvent[]) => {
    const today = new Date();
    return events.filter(event => 
      event.deadline && 
      event.deadline < today && 
      event.status !== 'completed'
    );
  },
  
  // Get completion percentage
  getCompletionRate: (events: CalendarEvent[]) => {
    const tasks = events.filter(event => event.type === 'task');
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  },
};

export default calendarApi;