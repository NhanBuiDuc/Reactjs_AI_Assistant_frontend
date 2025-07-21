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

interface GoogleAuthProps {
  onAuthSuccess?: (user: User) => void;
  onSignOut?: () => void;
}

const DJANGO_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'deeptalk_token';
const TOKEN_TIMESTAMP_KEY = 'deeptalk_token_timestamp';
const TOKEN_EXPIRY_DAYS = 7;

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthSuccess, onSignOut }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'token' | 'session' | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async (): Promise<void> => {
    console.log('🔍 Starting authentication initialization...');
    setLoading(true);
    setError(null);
    
    try {
      // Priority 1: Check for token in URL (from OAuth callback)
      const urlToken = getTokenFromURL();
      if (urlToken) {
        console.log('✅ Found token in URL, processing...');
        await processNewToken(urlToken);
        return;
      }

      // Priority 2: Check for valid stored token
      const storedToken = getValidStoredToken();
      if (storedToken) {
        console.log('✅ Found valid stored token, verifying...');
        const success = await verifyTokenAuth(storedToken);
        if (success) return;
      }

      // Priority 3: Check session authentication
      console.log('🔍 Checking session authentication...');
      const sessionValid = await verifySessionAuth();
      if (sessionValid) return;

      // No valid authentication found
      console.log('❌ No valid authentication found');
      
    } catch (error) {
      console.error('❌ Error during auth initialization:', error);
      setError('Authentication failed. Please try signing in again.');
    }
    
    setLoading(false);
  };

  const getTokenFromURL = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  };

  const getValidStoredToken = (): string | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    const timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
    
    if (!token || !timestamp) {
      cleanupStoredTokens();
      return null;
    }

    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (tokenAge >= maxAge) {
      console.log('🧹 Token expired, cleaning up...');
      cleanupStoredTokens();
      return null;
    }

    return token;
  };

  const processNewToken = async (token: string): Promise<void> => {
    try {
      // Store the new token
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Verify the token
      const success = await verifyTokenAuth(token);
      if (!success) {
        cleanupStoredTokens();
        throw new Error('Token verification failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to process new token:', error);
      cleanupStoredTokens();
      setError('Failed to process authentication token. Please try again.');
      setLoading(false);
    }
  };

  const verifyTokenAuth = async (token: string): Promise<boolean> => {
    try {
      console.log('🔐 Verifying token authentication...');
      
      const response = await fetch(`${DJANGO_BASE_URL}/auth/verify-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token authentication successful');
        
        const userData = createUserData(data, 'token');
        setUser(userData);
        setAuthMethod('token');
        setLoading(false);
        onAuthSuccess?.(userData);
        
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Token verification failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return false;
    }
  };

  const verifySessionAuth = async (): Promise<boolean> => {
    try {
      console.log('🔐 Verifying session authentication...');
      
      const response = await fetch(`${DJANGO_BASE_URL}/auth/verify-session/`, {
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
        
        const userData = createUserData(data, 'session');
        setUser(userData);
        setAuthMethod('session');
        setLoading(false);
        onAuthSuccess?.(userData);
        
        return true;
      } else {
        console.log('ℹ️ No valid session found');
        return false;
      }
    } catch (error) {
      console.log('ℹ️ Session verification failed:', error);
      return false;
    }
  };

  const createUserData = (data: any, loginMethod: 'token' | 'session'): User => {
    return {
      id: data.user_id,
      email: data.email,
      name: data.email.split('@')[0],
      firstName: data.first_name || data.email.split('@')[0],
      lastName: data.last_name || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.email.split('@')[0])}&background=6366f1&color=fff&size=100`,
      loginMethod,
      sessionActive: loginMethod === 'session',
      tokenValid: loginMethod === 'token'
    };
  };

  const cleanupStoredTokens = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    // Clean up legacy tokens
    localStorage.removeItem('gmail_token');
    localStorage.removeItem('gmail_token_timestamp');
    console.log('🧹 Stored tokens cleaned up');
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
      // Logout from backend (clears session)
      await fetch(`${DJANGO_BASE_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('❌ Backend logout error:', error);
    }
    
    // Clean up local state
    cleanupStoredTokens();
    setUser(null);
    setAuthMethod(null);
    setError(null);
    setLoading(false);
    onSignOut?.();
  };

  // Debug logging
  console.log('🎨 Render state:', { 
    user: !!user, 
    loading, 
    error,
    authMethod,
    userEmail: user?.email 
  });

  // Show Dashboard if authenticated
  if (user && !loading) {
    console.log(`📱 Rendering Dashboard for user: ${user.email} (${authMethod} auth)`);
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
            {authMethod && (
              <p className="text-sm text-gray-500 mt-2">
                Authenticating via {authMethod}...
              </p>
            )}
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