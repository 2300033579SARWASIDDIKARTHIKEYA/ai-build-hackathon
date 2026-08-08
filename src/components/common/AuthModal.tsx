import React, { useState } from 'react';
import { X, Mail, Lock, User, Chrome } from 'lucide-react';
import { registerUser, loginUser, setAuthToken, setStoredUser, requestPasswordReset } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'auth' | 'forgot'>('auth');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (isSignUp && !name) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      let data;
      if (isSignUp) {
        data = await registerUser(name, email, password);
      } else {
        data = await loginUser(email, password);
      }
      setAuthToken(data.access_token);
      setStoredUser(data.user);
      onLogin(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setError('');
      alert('If an account exists, a password reset email has been sent.');
      setMode('auth');
    } catch (err: any) {
      setError(err.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const user = { name: 'Google User', email: 'user@gmail.com' };
    setStoredUser(user);
    onLogin(user);
    onClose();
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setMode('auth');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              {mode === 'forgot' ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {mode === 'auth' && (
            <>
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Chrome className="w-4 h-4" />
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {isSignUp && (
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
                </button>
              </form>

              <p className="text-xs text-center text-gray-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={switchMode} className="text-red-600 hover:text-red-700 font-semibold">
                  {isSignUp ? 'Log In' : 'Sign Up'}
                </button>
              </p>

              {!isSignUp && (
                <p className="text-xs text-center">
                  <button onClick={() => setMode('forgot')} className="text-red-600 hover:text-red-700 font-semibold">
                    Forgot password?
                  </button>
                </p>
              )}
            </>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-xs text-center">
                <button onClick={() => setMode('auth')} className="text-red-600 hover:text-red-700 font-semibold">
                  Back to login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};