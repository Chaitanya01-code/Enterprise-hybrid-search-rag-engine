import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, User, Cpu, LogOut, Sun, Moon,
  FileText, File, Image, FileVideo, FileAudio, FileCode,
} from 'lucide-react';
import { useUser, useTheme } from '../App';
import { sendQuery } from '../services/api';

function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} style={{
          background: 'rgba(0,0,0,0.18)',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          padding: '12px 14px',
          overflowX: 'auto',
          fontSize: '0.78rem',
          lineHeight: 1.6,
          color: 'var(--text-main)',
          margin: '6px 0',
          whiteSpace: 'pre',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          {codeLines.join('\n')}
        </pre>
      );
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      elements.push(
        <hr key={key++} style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />
      );
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes  = { 1: '1rem', 2: '0.93rem', 3: '0.87rem' };
      const margins = { 1: '10px 0 4px', 2: '8px 0 3px', 3: '6px 0 2px' };
      elements.push(
        <div key={key++} style={{
          fontWeight: 700,
          fontSize: sizes[level],
          color: 'var(--text-main)',
          margin: margins[level],
          fontFamily: 'var(--font-heading)',
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
        }}>
          {inlineMarkdown(headingMatch[2])}
        </div>
      );
      i++;
      continue;
    }

    if (/^(\s*)([-*])\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^(\s*)([-*])\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*[-*]\s+/, '');
        listItems.push(<li key={i}>{inlineMarkdown(content)}</li>);
        i++;
      }
      elements.push(
        <ul key={key++} style={{
          margin: '4px 0 4px 4px',
          paddingLeft: '18px',
          listStyleType: 'disc',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          color: 'var(--text-body)',
        }}>
          {listItems}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*\d+\.\s+/, '');
        listItems.push(<li key={i}>{inlineMarkdown(content)}</li>);
        i++;
      }
      elements.push(
        <ol key={key++} style={{
          margin: '4px 0 4px 4px',
          paddingLeft: '20px',
          listStyleType: 'decimal',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          color: 'var(--text-body)',
        }}>
          {listItems}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      if (elements.length > 0) elements.push(<div key={key++} style={{ height: '4px' }} />);
      i++;
      continue;
    }

    elements.push(
      <p key={key++} style={{ margin: '2px 0', lineHeight: 1.65, color: 'var(--text-body)' }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div style={{ fontSize: '0.85rem' }}>{elements}</div>;
}

function inlineMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-main)' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={idx} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={idx} style={{
          background: 'rgba(0,0,0,0.18)',
          borderRadius: '4px',
          padding: '1px 5px',
          fontSize: '0.80rem',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--accent-primary)',
        }}>{part.slice(1, -1)}</code>
      );
    return part;
  });
}

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

  const isGreeting = (text) =>
    /^(hi+|hello+|hey+|howdy|greetings|sup|what'?s up)[!?.]*$/i.test(text.trim());

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;
    setMessages(m => [...m, { role: 'user', text: trimmed }]);
    setInput('');

    if (isGreeting(trimmed)) {
      setMessages(m => [...m, {
        role: 'assistant',
        text: `Hello${username ? `, ${username}` : ''}! 👋 What would you like to know?`,
      }]);
      return;
    }

    setThinking(true);
    const res = await sendQuery(trimmed, 'user');
    setThinking(false);

    if (res.success) {
      const { answer } = res.data;
      setMessages(m => [...m, { role: 'assistant', text: answer }]);
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
              {m.role === 'assistant' ? renderMarkdown(m.text) : m.text}
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

      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: '0 1px 0 rgba(0,180,255,0.08)',
        }}>

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

          <div className="status-pill hidden sm:flex ml-2">
            <span className="status-dot online" />
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <button onClick={toggle} className="theme-toggle"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme">
            {dark
              ? <Sun  className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              : <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            }
          </button>

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

      <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--bg-page)' }}>
        <ChatPanel username={user?.username} />
      </div>
    </div>
  );
}
