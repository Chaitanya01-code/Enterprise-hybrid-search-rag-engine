import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, LogIn, UserPlus, Server, Sun, Moon, ShieldCheck, LogOut } from 'lucide-react';
import { checkBackendHealth } from '../services/api';
import { useTheme, useUser } from '../App';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { user, setUser } = useUser();
  const [backendStatus, setBackendStatus] = useState({ status: 'checking', message: 'Checking System Status...' });

  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const health = await checkBackendHealth();
      if (isMounted) setBackendStatus(health);
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-2 md:px-8">
      <div className="glass-panel-3d nav-tab max-w-7xl mx-auto px-5 py-3.5">

        <div className="flex items-center justify-between gap-4">

          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-11 h-11 rounded-xl p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300"
              style={{ background: 'linear-gradient(135deg, var(--btn-grad-from), var(--accent-primary))' }}>
              <div className="w-full h-full rounded-[10px] flex items-center justify-center"
                style={{ background: 'var(--bg-card)' }}>
                <Cpu className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300"
                  style={{ color: 'var(--accent-primary)' }} />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading font-extrabold text-lg tracking-tight flex items-center gap-1.5"
                style={{ color: 'var(--text-main)' }}>
                ENTERPRISE&nbsp;<span className="gradient-text">RAG</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest font-mono font-medium"
                style={{ color: 'var(--text-dim)' }}>
                AI Database Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">

            <div className="status-pill hidden sm:flex" title={backendStatus.message}>
              <span className={`status-dot ${backendStatus.status === 'online' ? 'online' : 'offline'}`} />
              <Server className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {backendStatus.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`btn-glass-secondary btn-glass-sm nav-tab flex items-center gap-2 ${
                      location.pathname === '/admin' ? 'ring-1 ring-[rgba(2,132,199,0.50)]' : ''
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ color: 'var(--text-main)' }}>Admin Panel</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="btn-glass-sm nav-tab flex items-center gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.30)',
                    color: '#dc2626',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`btn-glass-secondary btn-glass-sm nav-tab flex items-center gap-2 ${
                    location.pathname === '/login' ? 'ring-1 ring-amber-600/40' : ''
                  }`}
                >
                  <LogIn className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ color: 'var(--text-main)' }}>Login</span>
                </Link>

                <Link to="/signup" className="btn-glass-primary btn-glass-sm nav-tab flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-white" />
                  <span className="text-white">Sign Up</span>
                </Link>
              </>
            )}

            <button
              onClick={toggle}
              className="theme-toggle"
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {dark
                ? <Sun  className="w-4.5 h-4.5" style={{ color: 'var(--accent-primary)' }} />
                : <Moon className="w-4.5 h-4.5" style={{ color: 'var(--accent-primary)' }} />
              }
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
