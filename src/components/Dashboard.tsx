import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CalendarEvent } from './Calendar';
import { CalendarSidebar } from './CalendarSidebar';
import { EventDialog } from './EventDialog';
import { AIAssistant } from './AIAssistant';
// Import API functions from the centralized API file
import { taskAPI, categoryAPI, taskUtils } from './APIs/TaskAPI';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string;
  loginMethod: 'session' | 'token';
  sessionActive?: boolean;
  tokenValid?: boolean;
}

interface TaskCategory {
  id: string;
  name: string;
  color_hex: string;
  icon: string;
  user?: string;
  is_system_category: boolean;
}

interface Task {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  deadline?: string;
  estimated_duration_minutes: number;
  minimum_duration_minutes?: number;
  maximum_duration_minutes?: number;
  base_priority: number;
  urgency_multiplier: number;
  can_be_split: boolean;
  requires_consecutive_time: boolean;
  preferred_time_of_day?: string[];
  avoid_time_of_day?: string[];
  deadline_flexibility_minutes: number;
  is_repeat: boolean;
  repeat_pattern?: string;
  repeat_frequency: number;
  repeat_days_of_week?: string[];
  repeat_end_date?: string;
  priority: number;
  urgency: number;
  difficulty_level: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  location?: string;
  ai_suggested: boolean;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  is_overdue?: boolean;
  category_name?: string;
}

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate: number;
}

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    in_progress: 0,
    overdue: 0,
    completion_rate: 0,
  });

  // Calendar specific state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState<boolean>(false);
  
  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);

  // Data fetching functions
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching tasks with filter:', filter);
      const tasksData = await taskAPI.loadTasks(filter);
      console.log('Tasks loaded:', tasksData);
      
      setTasks(tasksData);
      // Convert tasks to calendar events
      const calendarEvents = tasksData.map(task => taskUtils.taskToCalendarEvent(task));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      // You could show a toast notification here
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchCategories = useCallback(async () => {
    try {
      console.log('Fetching categories...');
      const categoriesData = await categoryAPI.loadCategories();
      console.log('Categories loaded:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      console.log('Fetching stats...');
      const statsData = await taskAPI.getTaskStats();
      console.log('Stats loaded:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchStats();
  }, [fetchTasks, fetchCategories, fetchStats]);

  // Calendar event handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Find the task associated with this event
    const task = tasks.find(t => t.id === event.id);
    setSelectedTask(task || null);
    setSelectedDate(event.date);
    setIsTaskDialogOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedDate(new Date());
    setSelectedTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      console.log('Saving task:', taskData);
      
      if (selectedTask) {
        // Update existing task
        console.log('Updating existing task:', selectedTask.id);
        const updatedTask = await taskAPI.updateTask(selectedTask.id!, taskData);
        console.log('Task updated:', updatedTask);
        
        if (updatedTask) {
          setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
          setEvents(prev => prev.map(e => e.id === selectedTask.id ? taskUtils.taskToCalendarEvent(updatedTask) : e));
        }
      } else {
        // Create new task
        console.log('Creating new task');
        const newTask = await taskAPI.createTask(taskData);
        console.log('Task created:', newTask);
        
        if (newTask) {
          setTasks(prev => [newTask, ...prev]);
          setEvents(prev => [...prev, taskUtils.taskToCalendarEvent(newTask)]);
        }
      }
      
      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error.message}`);
      throw error; // Re-throw so dialog can handle the error
    }
  };

  // AI Assistant handlers
  const handleOpenAI = () => {
    setShowAIAssistant(true);
  };

  const handleCloseAI = () => {
    setShowAIAssistant(false);
  };

  // Show AI Assistant if requested
  if (showAIAssistant) {
    return (
      <div className="relative min-h-screen">
        {/* Close AI Button */}
        <button
          onClick={handleCloseAI}
          className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-3 hover:bg-white transition-colors shadow-lg"
          title="Close AI Assistant"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* AI Assistant Component */}
        <AIAssistant />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🎯</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">DeepTalk</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* AI Assistant Button */}
            <button
              onClick={handleOpenAI}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              title="Open AI Assistant"
            >
              <span className="text-lg">🤖</span>
              <span className="font-medium">AI Assistant</span>
            </button>
            
            <div className="flex items-center gap-3">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-8 h-8 rounded-full"
              />
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <button 
                onClick={onSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign Out"
              >
                <span className="text-lg">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-gray-600 mb-6">
            Let's make today productive. You have {stats.pending} pending tasks.
          </p>
          
          {/* AI Assistant Quick Access */}
          <div className="mb-6">
            <button 
              onClick={handleOpenAI}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 group w-full max-w-md"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white text-xl">🤖</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Ask AI Assistant</div>
                <div className="text-sm text-gray-600">Get help with tasks and planning</div>
              </div>
              <div className="ml-auto text-indigo-500 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-900">{stats.total}</h3>
                  <p className="text-blue-700 text-sm">Total Tasks</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-amber-600 text-lg">⏳</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-amber-900">{stats.pending}</h3>
                  <p className="text-amber-700 text-sm">Pending</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-900">{stats.completed}</h3>
                  <p className="text-green-700 text-sm">Completed</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg">🚨</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-900">{stats.overdue}</h3>
                  <p className="text-red-700 text-sm">Overdue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Calendar Sidebar */}
        <CalendarSidebar
          events={events}
          onCreateEvent={handleCreateTask}
          selectedDate={selectedDate}
        />

        {/* Calendar Main View */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your calendar...</p>
              </div>
            </div>
          ) : (
            <Calendar
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <EventDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        onSaveTask={handleSaveTask}
        selectedDate={selectedDate}
        selectedTask={selectedTask}
        categories={categories}
      />
    </div>
  );
};

export default Dashboard;