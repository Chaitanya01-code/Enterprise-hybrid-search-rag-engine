import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { loginUser } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [statusState, setStatusState] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
      setTimeout(() => navigate('/'), 1500);
    } else {
      setStatusState({ loading: false, error: res.error || 'Failed to authenticate with backend server.', success: null });
    }
  };

  return (
    <div className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel-3d glass-card-interactive w-full max-w-md p-8 md:p-10 relative">

        {/* Top Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl p-0.5 shadow-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--btn-grad-from), var(--accent-primary))' }}>
            <div className="w-full h-full rounded-[14px] flex items-center justify-center"
              style={{ background: 'var(--bg-card)' }}>
              <LogIn className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <h2 className="font-heading font-extrabold text-3xl tracking-tight" style={{ color: 'var(--text-main)' }}>
            Welcome <span className="gradient-text">Back</span>
          </h2>
          <p className="text-xs font-mono flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
            <Server className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            Enterprise RAG Authentication
          </p>
        </div>

        {/* Feedback Messages */}
        {statusState.error && (
          <div className="alert-error mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusState.error}</span>
          </div>
        )}
        {statusState.success && (
          <div className="alert-success mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusState.success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-2">
            <label className="text-xs font-heading font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              Username or Worker ID
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="enter your username..."
                className="field-input"
              />
              <User className="absolute left-3.5 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-heading font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="field-input"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={statusState.loading}
            className="btn-glass-primary w-full py-3.5 mt-1 flex items-center justify-center gap-2 text-sm"
          >
            {statusState.loading
              ? <RefreshCw className="w-5 h-5 animate-spin text-white" />
              : <><span>Login</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center pt-6 text-xs" style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-dim)' }}>
          Don't have an enterprise account?{' '}
          <Link to="/signup" className="font-semibold underline underline-offset-4 ml-1 hover:opacity-80"
            style={{ color: 'var(--accent-primary)' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
