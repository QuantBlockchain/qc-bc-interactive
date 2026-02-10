'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, User, KeyRound, LogOut, BarChart3 } from 'lucide-react';
import { ToastProvider } from '@/components/ui/Toast';
import { ParticleBackground } from '@/components/visualizations/ParticleBackground';
import { DashboardContent } from '@/components/pages/DashboardContent';

interface AdminInfo {
  username: string;
  displayName: string;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify');
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
        setAdmin(data.admin);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setAdmin(data.admin);
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <ToastProvider>
        <ParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#14b8a6] animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <ParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
                <Lock className="w-10 h-10 text-[#14b8a6]" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Please login to access the dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0f1a]/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors"
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0f1a]/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors"
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-red-400 text-sm text-center">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !username.trim() || !password.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            {/* <p className="text-center text-gray-500 text-xs mt-6">
              Default credentials: admin / admin123
            </p> */}
          </div>
        </div>
      </ToastProvider>
    );
  }

  // Authenticated dashboard
  return (
    <ToastProvider>
      <ParticleBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 glass-effect border-b border-gray-800">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-[#14b8a6]" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-gray-400">Quantum Futures</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Welcome, <span className="text-[#14b8a6]">{admin?.displayName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-all flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 container mx-auto px-6 py-8 pt-28 max-w-6xl">
          <DashboardContent />
        </main>

        {/* Footer */}
        <footer className="glass-effect border-t border-gray-800 py-4">
          <div className="container mx-auto px-6 text-center text-sm text-gray-500">
            Quantum Futures Admin Dashboard
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
