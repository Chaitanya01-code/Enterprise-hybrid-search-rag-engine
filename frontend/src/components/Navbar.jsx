import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cpu, LogIn, UserPlus, Server } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState({ status: 'checking', message: 'Checking System Status...' });

  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const health = await checkBackendHealth();
      if (isMounted) {
        setBackendStatus(health);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 py-3 md:px-8">
      <div className="glass-panel-3d max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 text-decoration-none group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              ENTERPRISE <span className="gradient-text">RAG</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-medium -mt-1">
              AI Database Platform
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors">
            Capabilities
          </a>
          <a href="#solutions" className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors">
            Clients & Workers
          </a>
        </nav>

        {/* Right Action Group: Health Status & Auth Buttons */}
        <div className="flex items-center gap-4">
          
          {/* Backend Status Pill */}
          <div className="status-pill hidden sm:flex" title={backendStatus.message}>
            <span className={`status-dot ${backendStatus.status === 'online' ? 'online' : 'offline'}`} />
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-300 font-mono">
              {backendStatus.status === 'online' ? 'System Online' : 'System Offline'}
            </span>
          </div>

          {/* Login Button -> /login route */}
          <Link
            to="/login"
            className={`btn-glass-secondary btn-glass-sm flex items-center gap-2 ${
              location.pathname === '/login' ? 'border-cyan-400 text-cyan-300' : ''
            }`}
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>Login</span>
          </Link>

          {/* Sign Up Button -> /signup route */}
          <Link
            to="/signup"
            className="btn-glass-primary btn-glass-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Sign Up</span>
          </Link>

        </div>
      </div>
    </header>
  );
}
