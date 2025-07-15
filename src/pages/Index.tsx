// src/pages/Index.tsx - Updated to use your existing Django backend

import React, { useState } from 'react';
import GoogleAuth from '@/components/GoogleAuth';
import AdaptedCalendarContainer from '@/components/CalendarContainer'; // Using the adapted version
import { Button } from '@/components/calendar_ui/button';
import { Calendar as CalendarIcon, User, Settings, LogOut, BarChart3 } from 'lucide-react';

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

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'calendar' | 'dashboard'>('calendar');

  const handleAuthSuccess = (userData: User) => {
    console.log('✅ Authentication successful, connecting to task backend:', userData);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleSignOut = async () => {
    console.log('👋 Signing out...');
    
    // Clear tokens
    localStorage.removeItem('deeptalk_token');
    localStorage.removeItem('deeptalk_token_timestamp');
    
    // Reset state
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('calendar');
  };

  // Show authentication page if not logged in
  if (!isAuthenticated) {
    return (
      <GoogleAuth 
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
      />
    );
  }

  // Main application interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Navigation */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🎯</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  DeepTalk
                </h1>
              </div>
              
              {/* Navigation Buttons */}
              <nav className="flex items-center gap-2">
                <Button
                  variant={currentView === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('calendar')}
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Task Calendar
                </Button>
                <Button
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              </nav>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden md:flex items-center gap-3">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {user?.firstName || user?.name}
                  </div>
                  <div className="text-gray-500">{user?.email}</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {currentView === 'calendar' ? (
          <AdaptedCalendarContainer />
        ) : (
          <TaskDashboardView user={user} />
        )}
      </main>
    </div>
  );
};

// Task Dashboard View Component
const TaskDashboardView: React.FC<{ user: User | null }> = ({ user }) => {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Task Management Dashboard
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Task Calendar */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Task Calendar</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Manage your tasks with deadlines, priorities, and scheduling on a visual calendar.
              </p>
              <ul className="mt-3 text-xs text-gray-500 space-y-1">
                <li>• Create tasks with specific times</li>
                <li>• Set deadlines and priorities</li>
                <li>• Track task completion</li>
                <li>• Organize by categories</li>
              </ul>
            </div>
            
            {/* User Profile */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-10 h-10 rounded-lg border-2 border-white shadow-sm"
                />
                <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Logged in as {user?.firstName} 
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.email}
              </p>
              <p className="text-green-600 text-xs mt-2">
                Auth: {user?.loginMethod === 'session' ? 'Session Active' : 'Token Valid'}
              </p>
            </div>
            
            {/* Task Features */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Task Features</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Priority levels (1-5 scale)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Task categories & tags
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Location tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Duration estimation
                </li>
              </ul>
            </div>
          </div>
          
          {/* Integration Info */}
          <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🔗 Backend Integration
            </h3>
            <p className="text-sm text-gray-600">
              Your calendar is now connected to your existing Django task management backend. 
              All tasks are stored in your database with full CRUD operations, priority management, 
              and category organization.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">✅ Task CRUD</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✅ Categories</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">✅ Priorities</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">✅ Status Tracking</span>
              <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">✅ Statistics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;