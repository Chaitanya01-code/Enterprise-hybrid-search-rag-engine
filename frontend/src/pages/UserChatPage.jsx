import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, User, Cpu, LogOut, Sun, Moon,
} from 'lucide-react';
import { useUser, useTheme } from '../App';

// ── Chat Panel ─────────────────────────────────────────────────────
function ChatPanel({ username }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello${username ? `, ${username}` : ''}! I'm the Enterprise RAG AI assistant. Ask me anything about company documents, policies, or data.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;
    setMessages(m => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setThinking(true);
    // Placeholder — wire to POST /query when RAG backend is ready
    setTimeout(() => {
      setThinking(false);
      setMessages(m => [...m, {
        role: 'assistant',
        text: "I've received your query. The RAG pipeline endpoint is not yet connected — wire `POST /query` here when your backend search engine is ready.",
      }]);
    }, 1200);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: m.role === 'user'
                  ? 'linear-gradient(135deg,var(--btn-grad-from),var(--accent-primary))'
                  : 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
              }}>
              {m.role === 'user'
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              }
            </div>

            {/* Bubble */}
            <div className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed"
              style={{
                background: m.role === 'user' ? 'rgba(2,132,199,0.12)' : 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-body)',
                borderRadius: m.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
              }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {thinking && (
          <div className="flex gap-2.5 items-end">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="px-4 py-3 flex gap-1.5 items-center"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px 18px 18px 18px',
              }}>
              {[0, 150, 300].map(delay => (
                <span key={delay} className="w-1.5 h-1.5 rounded-full block"
                  style={{ background: 'var(--accent-primary)', animation: `pulseGreen 1.2s ${delay}ms infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3"
        style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <textarea
            rows={2}
            className="field-input flex-1 resize-none pl-4 text-sm"
            style={{ borderRadius: '14px' }}
            placeholder="Ask anything about your documents…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={send}
            disabled={!input.trim() || thinking}
            className="btn-glass-primary px-4 py-3 flex items-center justify-center"
            style={{
              borderRadius: '14px',
              minWidth: '46px',
              opacity: (!input.trim() || thinking) ? 0.5 : 1,
            }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-dim)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ── User Chat Page ─────────────────────────────────────────────────
export default function UserChatPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { dark, toggle } = useTheme();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen relative z-10 overflow-hidden"
      style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: '0 1px 0 rgba(0,180,255,0.08)',
        }}>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl p-0.5 shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--btn-grad-from), var(--accent-primary))' }}>
            <div className="w-full h-full rounded-[10px] flex items-center justify-center"
              style={{ background: 'var(--bg-card)' }}>
              <Cpu className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-extrabold text-base tracking-tight"
              style={{ color: 'var(--text-main)' }}>
              ENTERPRISE&nbsp;<span className="gradient-text">RAG</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono font-medium"
              style={{ color: 'var(--text-dim)' }}>
              AI Assistant
            </span>
          </div>

          {/* Online status */}
          <div className="status-pill hidden sm:flex ml-2">
            <span className="status-dot online" />
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Ready</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Username chip */}
          {user?.username && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(2,132,199,0.08)',
                border: '1px solid rgba(2,132,199,0.20)',
                color: 'var(--accent-primary)',
              }}>
              <User className="w-3 h-3" />
              {user.username}
            </span>
          )}

          {/* Theme toggle */}
          <button onClick={toggle} className="theme-toggle"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme">
            {dark
              ? <Sun  className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              : <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            }
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="btn-glass-sm flex items-center gap-2"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.30)',
              color: '#dc2626',
              borderRadius: '10px',
              cursor: 'pointer',
              padding: '7px 14px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* ── Chat body ──────────────────────────────────────────── */}
      <ChatPanel username={user?.username} />
    </div>
  );
}
