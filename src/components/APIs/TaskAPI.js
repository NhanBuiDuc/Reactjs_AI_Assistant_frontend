// APIs/TaskAPI.js - Centralized API functions for task management

const API_BASE_URL = 'http://localhost:8000';

// Helper function to get auth headers with proper token format
const getAuthHeaders = () => {
  const token = localStorage.getItem('deeptalk_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    
    // Handle authentication errors
    if (response.status === 401) {
      console.error('Authentication failed, token may be expired');
      // Optionally redirect to login or refresh token
      // window.location.href = '/login';
    }
    
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Task API Functions
export const taskAPI = {
  // Create a new task
  async createTask(taskData) {
    try {
      console.log('Creating task with data:', taskData);
      
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(taskData),
      });
      
      const data = await handleResponse(response);
      console.log('Task created successfully:', data);
      return data; // Return the full response since Django doesn't wrap in .task
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Load tasks with optional filtering
  async loadTasks(filter = 'all') {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const data = await handleResponse(response);
      return data.tasks || [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  },

  // Update an existing task
  async updateTask(taskId, taskData) {
    try {
      console.log('Updating task:', taskId, taskData);
      
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/${taskId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(taskData),
      });
      
      const data = await handleResponse(response);
      console.log('Task updated successfully:', data);
      return data; // Return the full response
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Toggle task status between pending and completed
  async toggleTaskStatus(taskId) {
    try {
      console.log('Toggling task status:', taskId);
      
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/${taskId}/toggle/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const data = await handleResponse(response);
      console.log('Task status toggled:', data);
      return data; // Return the full response
    } catch (error) {
      console.error('Error toggling task status:', error);
      throw error;
    }
  },

  // Delete a task (soft delete)
  async deleteTask(taskId) {
    try {
      console.log('Deleting task:', taskId);
      
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/${taskId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Get task statistics
  async getTaskStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/stats/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const data = await handleResponse(response);
      return {
        total: data.total || 0,
        pending: data.pending || 0,
        completed: data.completed || 0,
        in_progress: data.in_progress || 0,
        overdue: data.overdue || 0,
        completion_rate: data.completion_rate || 0,
      };
    } catch (error) {
      console.error('Error loading task stats:', error);
      return {
        total: 0,
        pending: 0,
        completed: 0,
        in_progress: 0,
        overdue: 0,
        completion_rate: 0,
      };
    }
  },

  // Search tasks
  async searchTasks(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.priority) {
        params.append('priority', filters.priority.toString());
      }
      
      const response = await fetch(`${API_BASE_URL}/task_manager/search/?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const data = await handleResponse(response);
      return data.tasks || [];
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  },

  // Bulk update tasks
  async bulkUpdateTasks(taskIds, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/bulk/update/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          task_ids: taskIds,
          updates: updates,
        }),
      });
      
      const data = await handleResponse(response);
      return data.updated_tasks || [];
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      return [];
    }
  },

  // Bulk delete tasks
  async bulkDeleteTasks(taskIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/task_manager/tasks/bulk/delete/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          task_ids: taskIds,
        }),
      });
      
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      return false;
    }
  },
};

// Category API Functions
export const categoryAPI = {
  // Load all categories
  async loadCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/task_manager/categories/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      const data = await handleResponse(response);
      return data.categories || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  },

  // Create a new category
  async createCategory(categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/task_manager/categories/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(categoryData),
      });
      
      const data = await handleResponse(response);
      return data; // Return the full response
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update a category
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/task_manager/categories/${categoryId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(categoryData),
      });
      
      const data = await handleResponse(response);
      return data; // Return the full response
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete a category
  async deleteCategory(categoryId) {
    try {
      const response = await fetch(`${API_BASE_URL}/task_manager/categories/${categoryId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};

// Authentication API Functions
export const authAPI = {
  // Check if token is valid
  async verifyToken() {
    try {
      const token = localStorage.getItem('deeptalk_token');
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return false;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },

  // Get current user info
  async getCurrentUser() {
    try {
      const verification = await this.verifyToken();
      if (verification) {
        return {
          id: verification.user_id,
          email: verification.email,
          loginMethod: verification.login_method,
          hasGmailAccess: verification.has_gmail_access
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Sign out
  async signOut() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('deeptalk_token');
      localStorage.removeItem('deeptalk_token_timestamp');
    }
  }
};

// Utility functions
export const taskUtils = {
  // Convert Task to CalendarEvent
  taskToCalendarEvent: (task) => ({
    id: task.id || '',
    title: task.name,
    date: task.deadline ? new Date(task.deadline) : new Date(task.created_at || Date.now()),
    time: task.deadline ? taskUtils.formatTime(task.deadline) : undefined,
    color: taskUtils.getPriorityColor(task.priority),
  }),

  // Format time from ISO string
  formatTime: (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  // Get priority color
  getPriorityColor: (priority) => {
    const colors = {
      1: '#ef4444', // Critical - Red
      2: '#f97316', // High - Orange  
      3: '#eab308', // Medium - Yellow
      4: '#3b82f6', // Low - Blue
      5: '#6b7280'  // Lowest - Gray
    };
    return colors[priority] || colors[3];
  },

  // Format date for display
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Check if task is overdue
  isTaskOverdue: (task) => {
    if (!task.deadline || task.status === 'completed') return false;
    return new Date(task.deadline) < new Date();
  },

  // Get status badge color
  getStatusColor: (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || colors.pending;
  },

  // Get priority label
  getPriorityLabel: (priority) => {
    const labels = {
      1: 'Critical',
      2: 'High',
      3: 'Medium',
      4: 'Low',
      5: 'Lowest'
    };
    return labels[priority] || 'Medium';
  },

  // Calculate task progress percentage
  calculateProgress: (task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'in_progress') return 50;
    if (task.status === 'pending') return 0;
    return 0;
  },
};

// Debug function to check authentication
export const debugAuth = {
  checkToken: () => {
    const token = localStorage.getItem('deeptalk_token');
    const timestamp = localStorage.getItem('deeptalk_token_timestamp');
    
    console.log('=== Debug Auth Info ===');
    console.log('Token exists:', !!token);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');
    console.log('Timestamp:', timestamp);
    console.log('Token age (hours):', timestamp ? ((Date.now() - parseInt(timestamp)) / (1000 * 60 * 60)).toFixed(2) : 'N/A');
    console.log('Auth headers:', getAuthHeaders());
    
    return { token, timestamp };
  },
  
  testAPI: async () => {
    try {
      console.log('=== Testing API Call ===');
      const response = await taskAPI.getTaskStats();
      console.log('API call successful:', response);
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      return null;
    }
  }
};

// Export default for convenience
export default {
  taskAPI,
  categoryAPI,
  authAPI,
  taskUtils,
  debugAuth,
};