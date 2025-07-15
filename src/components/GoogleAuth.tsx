import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';

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

interface GmailData {
  profile: {
    messages_total: number;
    threads_total: number;
  };
  messages: Array<{
    id: string;
    subject: string;
    from: string;
    snippet: string;
  }>;
  lastUpdated?: string;
}

interface GoogleAuthProps {
  onAuthSuccess?: (user: User) => void;
  onSignOut?: () => void;
}

const DJANGO_BASE_URL = 'http://localhost:8000';

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthSuccess, onSignOut }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async (): Promise<void> => {
    console.log('🔍 Starting authentication check...');
    setLoading(true);
    setError(null);
    
    try {
      // Check for token in URL params (from Django callback)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        console.log('✅ Found token in URL, verifying...', urlToken.substring(0, 20) + '...');
        setToken(urlToken);
        
        // STANDARDIZE: Always use 'deeptalk_token' as the key
        localStorage.setItem('deeptalk_token', urlToken);
        localStorage.setItem('deeptalk_token_timestamp', Date.now().toString());
        
        // Clean up old token if it exists
        localStorage.removeItem('gmail_token');
        localStorage.removeItem('gmail_token_timestamp');
        
        const isValid = await verifyToken(urlToken);
        if (isValid) {
          console.log('✅ Token verification successful, should show dashboard');
          // Clean up URL after successful verification
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        } else {
          console.error('❌ Token verification failed');
          cleanupAllTokens();
        }
      }
      
      // Check for stored token with both possible keys (for migration)
      let storedToken = localStorage.getItem('deeptalk_token') || localStorage.getItem('gmail_token');
      let tokenTimestamp = localStorage.getItem('deeptalk_token_timestamp') || localStorage.getItem('gmail_token_timestamp');
      
      if (storedToken && tokenTimestamp) {
        const tokenAge = Date.now() - parseInt(tokenTimestamp);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (tokenAge < sevenDays) {
          console.log('🔄 Found valid stored token, verifying...');
          setToken(storedToken);
          
          // Migrate to consistent key if needed
          if (localStorage.getItem('gmail_token')) {
            localStorage.setItem('deeptalk_token', storedToken);
            localStorage.setItem('deeptalk_token_timestamp', tokenTimestamp);
            localStorage.removeItem('gmail_token');
            localStorage.removeItem('gmail_token_timestamp');
          }
          
          const isValid = await verifyToken(storedToken);
          if (isValid) {
            return;
          }
        }
        
        // Token is expired, clean up everything
        console.log('🧹 Token expired, cleaning up...');
        cleanupAllTokens();
        setToken(null);
      }
      
      // Check session authentication
      console.log('🔍 Checking session authentication...');
      await checkSessionAuth();
      
    } catch (error) {
      console.error('❌ Error during auth check:', error);
      setError('Authentication check failed. Please try signing in again.');
    }
    
    setLoading(false);
  };

  const cleanupAllTokens = (): void => {
    // Remove all possible token keys
    localStorage.removeItem('deeptalk_token');
    localStorage.removeItem('deeptalk_token_timestamp');
    localStorage.removeItem('gmail_token');
    localStorage.removeItem('gmail_token_timestamp');
    
    console.log('🧹 All tokens cleaned up');
  };

  const checkSessionAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${DJANGO_BASE_URL}/auth/verify-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session authentication successful');
        
        const userData: User = {
          id: data.user_id,
          email: data.email,
          name: data.email.split('@')[0],
          firstName: data.first_name || data.email.split('@')[0],
          lastName: data.last_name || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.email.split('@')[0])}&background=6366f1&color=fff&size=100`,
          loginMethod: data.login_method,
          sessionActive: true
        };
        
        console.log('👤 Setting user data:', userData);
        setUser(userData);
        setShowDashboard(true);
        onAuthSuccess?.(userData);
        return true;
      }
    } catch (error) {
      console.log('ℹ️ No existing session found:', error);
    }
    
    return false;
  };

  const verifyToken = async (jwtToken: string): Promise<boolean> => {
    try {
      console.log('🔐 Verifying token with backend...');
      const response = await fetch(`${DJANGO_BASE_URL}/auth/verify-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: jwtToken }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token verification successful, backend response:', data);
        
        const userData: User = {
          id: data.user_id,
          email: data.email,
          name: data.email.split('@')[0],
          firstName: data.first_name || data.email.split('@')[0],
          lastName: data.last_name || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.email.split('@')[0])}&background=6366f1&color=fff&size=100`,
          loginMethod: data.login_method,
          tokenValid: true
        };
        
        console.log('👤 Setting user data from token:', userData);
        
        // Set all state in the correct order
        setUser(userData);
        setShowDashboard(true);
        setLoading(false);
        setError(null);
        
        // Call onAuthSuccess callback
        onAuthSuccess?.(userData);
        
        console.log('🎉 Authentication complete, dashboard should show');
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Token verification failed:', errorData);
        setError(errorData.error || 'Token verification failed');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Token verification error:', error);
      setError('Network error during token verification');
      setLoading(false);
      return false;
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    console.log('🚀 Starting Google sign-in...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${DJANGO_BASE_URL}/auth/google/`, {
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.auth_url) {
        console.log('🔗 Redirecting to Google OAuth...', data.auth_url);
        window.location.href = data.auth_url;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      console.error('❌ Failed to get auth URL:', error);
      setError('Failed to initiate Google sign-in. Please try again.');
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    console.log('👋 Signing out...');
    setLoading(true);
    
    try {
      await fetch(`${DJANGO_BASE_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('❌ Backend logout error:', error);
    }
    
    cleanupAllTokens();
    // Clear local state
    setUser(null);
    setToken(null);
    setError(null);
    setShowDashboard(false);
    setLoading(false);
    onSignOut?.();
  };

  // Debug logging for render decisions
  console.log('🎨 Render state:', { 
    showDashboard, 
    user: !!user, 
    loading, 
    error,
    userEmail: user?.email 
  });

  // Show Dashboard if authenticated
  if (showDashboard && user) {
    console.log('📱 Rendering Dashboard for user:', user.email);
    return <Dashboard user={user} onSignOut={handleSignOut} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-48 h-48 bg-white/10 rounded-full blur-xl animate-pulse top-1/4 left-1/4 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse bottom-1/4 right-1/4 animate-bounce" style={{ animationDelay: '2s' }} />
          <div className="absolute w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse top-1/2 right-1/3 animate-bounce" style={{ animationDelay: '4s' }} />
        </div>
        
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 text-center">
            <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-5" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to DeepTalk</h3>
            <p className="text-gray-600">Checking your authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Login page
  console.log('🔐 Rendering login page');
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-48 h-48 bg-white/10 rounded-full blur-xl animate-pulse top-1/4 left-1/4 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="absolute w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse bottom-1/4 right-1/4 animate-bounce" style={{ animationDelay: '2s' }} />
        <div className="absolute w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse top-1/2 right-1/3 animate-bounce" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-2xl">🎯</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                DeepTalk
              </h1>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Your AI-Powered Productivity Companion
            </p>
            <p className="text-sm text-gray-500">
              Welcome to a smarter way to manage your life
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <span className="flex-1 text-red-700 font-medium">{error}</span>
                <button 
                  onClick={() => setError(null)} 
                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Terms */}
            <div className="text-center text-sm text-gray-600">
              By signing in, you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
            </div>

            {/* Features Preview */}
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-center text-gray-700 font-medium mb-5">
                What you'll get with DeepTalk:
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-base">🤖</span>
                  <span>AI-Powered Task Management</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-base">📅</span>
                  <span>Smart Scheduling</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-base">📈</span>
                  <span>Productivity Analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-base">🎯</span>
                  <span>Goal Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Named export
export { GoogleAuth };

// Default export
export default GoogleAuth;