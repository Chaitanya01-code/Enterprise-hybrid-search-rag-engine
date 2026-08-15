import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { signupUser } from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [statusState, setStatusState] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      setStatusState({ loading: false, error: 'Please fill in all required fields.', success: null });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatusState({ loading: false, error: 'Passwords do not match.', success: null });
      return;
    }

    setStatusState({ loading: true, error: null, success: null });
    const res = await signupUser({ 
      username: formData.username, 
      email: formData.email, 
      password: formData.password 
    });

    if (res.success) {
      setStatusState({ loading: false, error: null, success: 'Account created successfully! Redirecting to login...' });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setStatusState({ loading: false, error: res.error || 'Failed to register account on backend.', success: null });
    }
  };

  return (
    <div className="relative z-10 min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel-3d glass-card-interactive w-full max-w-md p-8 md:p-10 border border-slate-700/60 shadow-2xl relative">
        
        {/* Top Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-600 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
            Create <span className="gradient-text-purple">Account</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-purple-400" /> Connect Client & Worker DB Access
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-heading font-semibold text-slate-300 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="choose username..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
              />
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-heading font-semibold text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@enterprise.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
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
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-heading font-semibold text-slate-300 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={statusState.loading}
            className="btn-glass-primary w-full py-3.5 mt-3 flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            {statusState.loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <span>Register & Connect</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Footer Link to Login */}
        <div className="mt-6 text-center pt-5 border-t border-white/10 text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 ml-1">
            Login to Account
          </Link>
        </div>

      </div>
    </div>
  );
}
