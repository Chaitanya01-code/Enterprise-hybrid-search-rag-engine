import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, User, Cpu, LogOut, Sun, Moon,
  BarChart2, PieChart, TrendingUp, HardDrive, Clock,
  Tag, FileText, File, Image, FileVideo, FileAudio, FileCode,
  Maximize2, Minimize2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useUser, useTheme } from '../App';
import { listDocumentsUser, sendQuery } from '../services/api';

// ── helpers (mirrors AdminPage) ────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function fileIcon(contentType = '') {
  if (contentType.startsWith('image/'))  return <Image     className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />;
  if (contentType.startsWith('video/'))  return <FileVideo className="w-4 h-4" style={{ color: 'var(--accent-pink)' }} />;
  if (contentType.startsWith('audio/'))  return <FileAudio className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />;
  if (contentType.includes('pdf'))       return <FileText  className="w-4 h-4" style={{ color: '#e74c3c' }} />;
  if (contentType.includes('json') || contentType.includes('javascript') || contentType.includes('html') || contentType.includes('css'))
    return <FileCode className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />;
  return <File className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />;
}

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

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;
    setMessages(m => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setThinking(true);

    const res = await sendQuery(trimmed, 'user');
    setThinking(false);

    if (res.success) {
      const { answer, sources } = res.data;
      let fullText = answer;
      if (sources && sources.length > 0) {
        const cites = sources
          .map(s => `• ${s.chunk_name} | Page ${s.page_number ?? 'N/A'} | Chunk #${s.chunk_index} (score: ${s.score})`)
          .join('\n');
        fullText = `${answer}\n\n📚 Sources:\n${cites}`;
      }
      setMessages(m => [...m, { role: 'assistant', text: fullText }]);
    } else {
      setMessages(m => [...m, {
        role: 'assistant',
        text: `⚠️ Error: ${res.error || 'Failed to get a response from the RAG backend.'}`,
      }]);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full" style={{ minHeight: 0 }}>

      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,var(--btn-grad-from),var(--accent-primary))' }}>
          <Bot className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm" style={{ color: 'var(--text-main)' }}>RAG Assistant</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>AI · Document Intelligence</p>
        </div>
        <div className="ml-auto status-pill hidden sm:flex">
          <span className="status-dot online" />
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Ready</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
            style={{ borderRadius: '14px', minWidth: '46px', opacity: (!input.trim() || thinking) ? 0.5 : 1 }}>
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

// ── Analysis Panel ─────────────────────────────────────────────────
function AnalysisPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await listDocumentsUser();
    setLoading(false);
    if (res.success) setDocs(res.data);
    else setError(res.error);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const stats = useMemo(() => {
    const total = docs.length;
    const totalSize = docs.reduce((s, d) => s + d.size, 0);

    const typeMap = {};
    docs.forEach(d => {
      const key = d.content_type.split('/')[0] || 'other';
      typeMap[key] = (typeMap[key] || 0) + 1;
    });
    const types = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, pct: total ? Math.round((count / total) * 100) : 0 }));

    const tagMap = {};
    docs.forEach(d => {
      if (!d.tags) return;
      d.tags.split(',').forEach(t => {
        const tag = t.trim().toLowerCase();
        if (tag) tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    const tags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 20);

    const recent  = [...docs].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)).slice(0, 5);
    const largest = [...docs].sort((a, b) => b.size - a.size).slice(0, 5);

    return { total, totalSize, types, tags, recent, largest };
  }, [docs]);

  const TYPE_COLORS = {
    application: 'var(--accent-primary)',
    image:       'var(--accent-purple)',
    video:       'var(--accent-pink)',
    audio:       'var(--accent-emerald)',
    text:        'var(--accent-cyan)',
    other:       'var(--text-dim)',
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* Panel header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,var(--btn-grad-from),var(--accent-primary))' }}>
          <BarChart2 className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-heading font-bold text-sm" style={{ color: 'var(--text-main)' }}>Document Analysis</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>Storage · Types · Tags · Recency</p>
        </div>
        <button onClick={fetchDocs} className="theme-toggle w-8 h-8 flex items-center justify-center" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--accent-primary)' }} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5" style={{ minHeight: 0 }}>

        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert-error mt-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <BarChart2 className="w-12 h-12" style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No documents available yet.</p>
          </div>
        )}

        {!loading && !error && docs.length > 0 && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Files',   value: stats.total,              icon: <FileText  className="w-4 h-4" />, color: 'var(--accent-primary)' },
                { label: 'Total Storage', value: formatBytes(stats.totalSize), icon: <HardDrive className="w-4 h-4" />, color: 'var(--accent-purple)' },
                { label: 'File Types',    value: stats.types.length,       icon: <PieChart  className="w-4 h-4" />, color: 'var(--accent-cyan)' },
                { label: 'Unique Tags',   value: stats.tags.length,        icon: <Tag       className="w-4 h-4" />, color: 'var(--accent-emerald)' },
              ].map(card => (
                <div key={card.label} className="glass-panel-3d rounded-xl p-4 flex flex-col gap-1"
                  style={{ border: '1px solid var(--glass-border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: card.color }}>{card.icon}</span>
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{card.label}</span>
                  </div>
                  <span className="text-2xl font-heading font-extrabold" style={{ color: 'var(--text-main)' }}>{card.value}</span>
                </div>
              ))}
            </div>

            {/* File type breakdown */}
            <div className="glass-panel-3d rounded-xl p-4" style={{ border: '1px solid var(--glass-border)' }}>
              <p className="font-heading font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <PieChart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> File Type Breakdown
              </p>
              <div className="flex flex-col gap-2">
                {stats.types.map(t => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold capitalize" style={{ color: 'var(--text-body)' }}>{t.label}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{t.count} file{t.count !== 1 ? 's' : ''} · {t.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${t.pct}%`, background: TYPE_COLORS[t.label] || TYPE_COLORS.other }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tag cloud */}
            {stats.tags.length > 0 && (
              <div className="glass-panel-3d rounded-xl p-4" style={{ border: '1px solid var(--glass-border)' }}>
                <p className="font-heading font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <Tag className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} /> Tag Cloud
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.tags.map(([tag, count]) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-mono"
                      style={{
                        background: 'rgba(109,40,217,0.10)',
                        border: '1px solid rgba(109,40,217,0.25)',
                        color: 'var(--accent-purple)',
                        fontSize: `${Math.min(0.85 + count * 0.05, 1.1)}rem`,
                      }}>
                      {tag} <span style={{ opacity: 0.6 }}>×{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Largest files */}
            <div className="glass-panel-3d rounded-xl p-4" style={{ border: '1px solid var(--glass-border)' }}>
              <p className="font-heading font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} /> Largest Files
              </p>
              <div className="flex flex-col gap-2">
                {stats.largest.map((doc, i) => (
                  <div key={doc.id} className="flex items-center gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold flex-shrink-0"
                      style={{ background: 'var(--bg-input)', color: 'var(--accent-primary)', fontSize: '0.65rem' }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate font-semibold" style={{ color: 'var(--text-body)' }}>{doc.original_filename}</span>
                    <span className="font-mono flex-shrink-0" style={{ color: 'var(--text-dim)' }}>{formatBytes(doc.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent uploads */}
            <div className="glass-panel-3d rounded-xl p-4" style={{ border: '1px solid var(--glass-border)' }}>
              <p className="font-heading font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} /> Recent Uploads
              </p>
              <div className="flex flex-col gap-2">
                {stats.recent.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 text-xs">
                    <div className="flex-shrink-0">{fileIcon(doc.content_type)}</div>
                    <span className="flex-1 truncate font-semibold" style={{ color: 'var(--text-body)' }}>{doc.original_filename}</span>
                    <span className="font-mono flex-shrink-0" style={{ color: 'var(--text-dim)' }}>{formatDate(doc.uploaded_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── User Chat Page ─────────────────────────────────────────────────
export default function UserChatPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { dark, toggle } = useTheme();

  // ── Resizable panels ──────────────────────────────────────────────
  // layout: 'split' | 'left-full' | 'right-full'
  const [layout, setLayout] = useState('split');
  const [leftWidth, setLeftWidth] = useState(680); // px, chat gets more space by default
  const MIN_W = 280;
  const bodyRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startW: 0 });

  const startDrag = useCallback((clientX) => {
    dragRef.current = { active: true, startX: clientX, startW: leftWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const bodyW = bodyRef.current?.offsetWidth || window.innerWidth;
      const newW = Math.min(
        Math.max(dragRef.current.startW + (clientX - dragRef.current.startX), MIN_W),
        bodyW - MIN_W,
      );
      setLeftWidth(newW);
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

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

      {/* ── Two-panel body ─────────────────────────────────────── */}
      <div ref={bodyRef} className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>

        {/* ── Left Panel: Chat ─────────────────────────────────── */}
        <div className="flex flex-col flex-shrink-0 h-full transition-all duration-200"
          style={{
            width: layout === 'left-full'  ? '100%'
                 : layout === 'right-full' ? '0px'
                 : `${leftWidth}px`,
            minWidth: layout === 'right-full' ? 0 : MIN_W,
            overflow: layout === 'right-full' ? 'hidden' : undefined,
            display: layout === 'right-full' ? 'none' : 'flex',
            borderRight: '1px solid var(--glass-border)',
            background: 'var(--bg-page)',
          }}>

          {/* Chat header strip with maximize button */}
          <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
            <Bot className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-heading font-semibold text-sm flex-1" style={{ color: 'var(--text-main)' }}>AI Chat</span>
            <button
              onClick={() => setLayout(l => l === 'left-full' ? 'split' : 'left-full')}
              className="theme-toggle w-8 h-8 flex items-center justify-center"
              title={layout === 'left-full' ? 'Restore split view' : 'Maximize chat'}>
              {layout === 'left-full'
                ? <Minimize2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                : <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
              }
            </button>
          </div>

          <ChatPanel username={user?.username} />
        </div>

        {/* ── Drag divider ─────────────────────────────────────── */}
        {layout === 'split' && (
          <div
            onMouseDown={e => { e.preventDefault(); startDrag(e.clientX); }}
            onTouchStart={e => startDrag(e.touches[0].clientX)}
            style={{
              width: '5px',
              flexShrink: 0,
              cursor: 'col-resize',
              background: 'var(--glass-border)',
              position: 'relative',
              zIndex: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-border)'; }}
            title="Drag to resize panels"
          />
        )}

        {/* ── Right Panel: Analysis ─────────────────────────────── */}
        <div className="flex flex-1 flex-col h-full transition-all duration-200"
          style={{
            background: 'var(--bg-page)',
            minWidth: layout === 'left-full' ? 0 : MIN_W,
            display: layout === 'left-full' ? 'none' : 'flex',
          }}>

          {/* Analysis header strip with maximize button */}
          <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
            <BarChart2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-heading font-semibold text-sm flex-1" style={{ color: 'var(--text-main)' }}>Analysis</span>
            <button
              onClick={() => setLayout(l => l === 'right-full' ? 'split' : 'right-full')}
              className="theme-toggle w-8 h-8 flex items-center justify-center"
              title={layout === 'right-full' ? 'Restore split view' : 'Maximize analysis'}>
              {layout === 'right-full'
                ? <Minimize2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                : <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
              }
            </button>
          </div>

          <AnalysisPanel />
        </div>

      </div>{/* end two-panel body */}
    </div>
  );
}
