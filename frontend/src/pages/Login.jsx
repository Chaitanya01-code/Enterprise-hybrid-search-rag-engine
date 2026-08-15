import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { loginUser } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [statusState, setStatusState] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setStatusState({ loading: false, error: 'Please fill in both username and password fields.', success: null });
      return;
    }

    setStatusState({ loading: true, error: null, success: null });
    const res = await loginUser({ username: formData.username, password: formData.password });

    if (res.success) {
      setStatusState({ loading: false, error: null, success: 'Authentication successful! Welcome.' });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setStatusState({ loading: false, error: res.error || 'Failed to authenticate with backend server.', success: null });
    }
  };

  return (
    <div className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel-3d glass-card-interactive w-full max-w-md p-8 md:p-10 border border-slate-700/60 shadow-2xl relative">
        
        {/* Top Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
              <LogIn className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
            Welcome <span className="gradient-text">Back</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" /> Enterprise RAG Authentication
          </p>
        </div>

        {/* Feedback Messages */}
        {statusState.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{statusState.error}</span>
          </div>
        )}

        {statusState.success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusState.success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-heading font-semibold text-slate-300 uppercase tracking-wider">
              Username or Worker ID
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="enter your username..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-heading font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={statusState.loading}
            className="btn-glass-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 text-sm"
          >
            {statusState.loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Footer Link to Signup */}
        <div className="mt-8 text-center pt-6 border-t border-white/10 text-xs text-slate-400">
          Don't have an enterprise account?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 ml-1">
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
}
