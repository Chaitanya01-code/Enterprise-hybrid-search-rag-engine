import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { signupUser } from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [statusState, setStatusState] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
    const res = await signupUser({ username: formData.username, email: formData.email, password: formData.password });
    if (res.success) {
      setStatusState({ loading: false, error: null, success: 'Account created! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setStatusState({ loading: false, error: res.error || 'Failed to register account on backend.', success: null });
    }
  };

  return (
    <div className="relative z-10 min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel-3d glass-card-interactive w-full max-w-md p-8 md:p-10 relative">

        {/* Top Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl p-0.5 shadow-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' }}>
            <div className="w-full h-full rounded-[14px] flex items-center justify-center"
              style={{ background: 'var(--bg-card)' }}>
              <UserPlus className="w-6 h-6" style={{ color: 'var(--accent-purple)' }} />
            </div>
          </div>
          <h2 className="font-heading font-extrabold text-3xl tracking-tight" style={{ color: 'var(--text-main)' }}>
            Create <span className="gradient-text-purple">Account</span>
          </h2>
          <p className="text-xs font-mono flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
            <Server className="w-3.5 h-3.5" style={{ color: 'var(--accent-purple)' }} />
            Connect Client &amp; Worker DB Access
          </p>
        </div>

        {/* Feedback */}
        {statusState.error && (
          <div className="alert-error mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusState.error}</span>
          </div>
        )}
        {statusState.success && (
          <div className="alert-success mb-5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusState.success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {[
            { label: 'Username', name: 'username', type: 'text', placeholder: 'choose username...', Icon: User },
            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'user@enterprise.com', Icon: Mail },
            { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••••••', Icon: Lock },
            { label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: '••••••••••••', Icon: Lock },
          ].map(({ label, name, type, placeholder, Icon }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <label className="text-xs font-heading font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                {label}
              </label>
              <div className="relative">
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="field-input"
                />
                <Icon className="absolute left-3.5 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={statusState.loading}
            className="btn-glass-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 text-sm"
          >
            {statusState.loading
              ? <RefreshCw className="w-5 h-5 animate-spin text-white" />
              : <><span>Register &amp; Connect</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center pt-5 text-xs" style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-dim)' }}>
          Already registered?{' '}
          <Link to="/login" className="font-semibold underline underline-offset-4 ml-1 hover:opacity-80"
            style={{ color: 'var(--accent-purple)' }}>
            Login to Account
          </Link>
        </div>
      </div>
    </div>
  );
}
