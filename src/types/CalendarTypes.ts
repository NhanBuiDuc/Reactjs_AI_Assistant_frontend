// src/types/CalendarTypes.ts
// Comprehensive calendar event interface with all necessary fields

export interface ComprehensiveCalendarEvent {
  // Basic Information
  id: string;
  title: string;
  description?: string;
  notes?: string;
  
  // Time & Schedule
  date: Date;
  time?: string; // For backward compatibility
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  deadline?: Date;
  duration?: number; // in minutes
  timezone?: string;
  
  // Task Management
  type?: 'task' | 'event' | 'reminder';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  progress?: number; // 0-100%
  completed?: boolean; // For backward compatibility
  category?: string;
  tags?: string[];
  
  // Assignment & Location
  assignee?: string;
  createdBy?: string;
  modifiedBy?: string;
  location?: string;
  
  // Recurrence & Reminders
  isRecurring?: boolean;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrenceEnd?: Date;
  reminders?: number[]; // minutes before event
  
  // Visual & Organization
  color?: string;
  
  // Project Management
  estimatedHours?: number;
  actualHours?: number;
  cost?: number;
  budget?: number;
  client?: string;
  project?: string;
  
  // Dependencies & Relationships
  dependencies?: string[]; // IDs of dependent tasks
  parentTask?: string; // For subtasks
  subtasks?: string[]; // IDs of subtasks
  
  // Files & Links
  attachments?: AttachmentType[];
  links?: LinkType[];
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
  
  // Custom Fields (for extensibility)
  customFields?: Record<string, any>;
}

export interface AttachmentType {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface LinkType {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface CalendarFilter {
  categories?: string[];
  priorities?: string[];
  statuses?: string[];
  types?: string[];
  assignees?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  hasDeadline?: boolean;
  overdue?: boolean;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda' | 'timeline';
  currentDate: Date;
  showWeekends: boolean;
  showCompleted: boolean;
  groupBy?: 'category' | 'assignee' | 'priority' | 'status';
}

export interface CalendarStats {
  totalEvents: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
  todayEvents: number;
  thisWeekEvents: number;
  thisMonthEvents: number;
  
  // Progress stats
  averageProgress: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  
  // By category
  eventsByCategory: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
}

export interface NotificationSettings {
  emailReminders: boolean;
  pushNotifications: boolean;
  reminderTimes: number[]; // default reminder times
  deadlineWarnings: number[]; // days before deadline to warn
  overdueNotifications: boolean;
  weeklyDigest: boolean;
  dailyAgenda: boolean;
}

export interface CalendarSettings {
  defaultView: 'month' | 'week' | 'day';
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  workingHours: {
    start: string;
    end: string;
    workingDays: number[]; // 0-6, Sunday-Saturday
  };
  timeFormat: '12h' | '24h';
  dateFormat: string;
  timezone: string;
  defaultEventDuration: number; // minutes
  defaultReminderTime: number; // minutes
  autoCreateEvents: boolean;
  showDeclinedEvents: boolean;
  notifications: NotificationSettings;
}

// API Response Types
export interface CalendarEventResponse {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  date: string; // ISO date string
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  deadline?: string; // ISO date string
  duration?: number;
  timezone?: string;
  type?: string;
  priority?: string;
  status?: string;
  progress?: number;
  category?: string;
  tags?: string[];
  assignee?: string;
  created_by?: string;
  location?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  reminders?: number[];
  color?: string;
  estimated_hours?: number;
  actual_hours?: number;
  cost?: number;
  client?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  notes?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  deadline?: string;
  duration?: number;
  type?: string;
  priority?: string;
  status?: string;
  progress?: number;
  category?: string;
  tags?: string[];
  assignee?: string;
  location?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  reminders?: number[];
  color?: string;
  estimated_hours?: number;
  cost?: number;
  client?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: string;
}

// Utility Functions
export const transformApiEventToCalendarEvent = (apiEvent: CalendarEventResponse): ComprehensiveCalendarEvent => {
  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description,
    notes: apiEvent.notes,
    date: new Date(apiEvent.date),
    time: apiEvent.start_time, // For backward compatibility
    startTime: apiEvent.start_time,
    endTime: apiEvent.end_time,
    allDay: apiEvent.all_day,
    deadline: apiEvent.deadline ? new Date(apiEvent.deadline) : undefined,
    duration: apiEvent.duration,
    timezone: apiEvent.timezone,
    type: apiEvent.type as any,
    priority: apiEvent.priority as any,
    status: apiEvent.status as any,
    progress: apiEvent.progress,
    completed: apiEvent.status === 'completed',
    category: apiEvent.category,
    tags: apiEvent.tags,
    assignee: apiEvent.assignee,
    createdBy: apiEvent.created_by,
    location: apiEvent.location,
    isRecurring: apiEvent.is_recurring,
    recurrenceRule: apiEvent.recurrence_rule as any,
    reminders: apiEvent.reminders,
    color: apiEvent.color,
    estimatedHours: apiEvent.estimated_hours,
    actualHours: apiEvent.actual_hours,
    cost: apiEvent.cost,
    client: apiEvent.client,
    createdAt: apiEvent.created_at ? new Date(apiEvent.created_at) : undefined,
    updatedAt: apiEvent.updated_at ? new Date(apiEvent.updated_at) : undefined,
  };
};

export const transformCalendarEventToApiRequest = (event: Partial<ComprehensiveCalendarEvent>): CreateEventRequest => {
  return {
    title: event.title || '',
    description: event.description,
    notes: event.notes,
    date: event.date?.toISOString().split('T')[0] || '',
    start_time: event.startTime,
    end_time: event.endTime,
    all_day: event.allDay,
    deadline: event.deadline?.toISOString().split('T')[0],
    duration: event.duration,
    type: event.type,
    priority: event.priority,
    status: event.status,
    progress: event.progress,
    category: event.category,
    tags: event.tags,
    assignee: event.assignee,
    location: event.location,
    is_recurring: event.isRecurring,
    recurrence_rule: event.recurrenceRule,
    reminders: event.reminders,
    color: event.color,
    estimated_hours: event.estimatedHours,
    cost: event.cost,
    client: event.client,
  };
};

// Validation Functions
export const validateEvent = (event: Partial<ComprehensiveCalendarEvent>): string[] => {
  const errors: string[] = [];
  
  if (!event.title || event.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!event.date) {
    errors.push('Date is required');
  }
  
  if (event.startTime && event.endTime) {
    const start = new Date(`2000-01-01T${event.startTime}`);
    const end = new Date(`2000-01-01T${event.endTime}`);
    if (start >= end) {
      errors.push('End time must be after start time');
    }
  }
  
  if (event.deadline && event.date && event.deadline < event.date) {
    errors.push('Deadline cannot be before event date');
  }
  
  if (event.progress !== undefined && (event.progress < 0 || event.progress > 100)) {
    errors.push('Progress must be between 0 and 100');
  }
  
  if (event.estimatedHours !== undefined && event.estimatedHours < 0) {
    errors.push('Estimated hours cannot be negative');
  }
  
  return errors;
};

// Constants
export const EVENT_TYPES = ['task', 'event', 'reminder'] as const;
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const STATUSES = ['not_started', 'in_progress', 'completed', 'cancelled', 'on_hold'] as const;
export const RECURRENCE_RULES = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b', 
  high: '#ef4444',
  urgent: '#dc2626'
} as const;

export const STATUS_COLORS = {
  not_started: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  on_hold: '#f59e0b'
} as const;

export const DEFAULT_CATEGORIES = [
  'Work',
  'Personal', 
  'Health',
  'Finance',
  'Education',
  'Travel',
  'Meeting',
  'Project',
  'Maintenance',
  'Social',
  'Family',
  'Fitness',
  'Shopping',
  'Appointment',
  'Other'
] as const;