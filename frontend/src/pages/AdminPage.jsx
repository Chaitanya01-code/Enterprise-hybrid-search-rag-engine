import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Trash2, Pencil, Download, FileText, File, Image, FileVideo,
  FileAudio, FileCode, FilePlus, RefreshCw, X, AlertTriangle,
  CheckCircle2, AlertCircle, ChevronDown, Bot, Send, Shield, User,
  Database, Menu, Search, Tag, AlignLeft, Cpu, LogOut, Sun, Moon,
  BarChart2, PieChart, TrendingUp, HardDrive, Clock,
  Maximize2, Minimize2,
} from 'lucide-react';
import {
  listDocuments, uploadDocument, editDocument,
  deleteDocument, downloadDocumentUrl, sendQuery,
} from '../services/api';
import { useUser, useTheme } from '../App';

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
      const sizes   = { 1: '1rem',   2: '0.93rem', 3: '0.87rem' };
      const margins  = { 1: '10px 0 4px', 2: '8px 0 3px', 3: '6px 0 2px' };
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
      if (elements.length > 0) {
        elements.push(<div key={key++} style={{ height: '4px' }} />);
      }
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
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
  });
}

function fileIcon(contentType = '') {
  if (contentType.startsWith('image/'))       return <Image  className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />;
  if (contentType.startsWith('video/'))       return <FileVideo className="w-4 h-4" style={{ color: 'var(--accent-pink)' }} />;
  if (contentType.startsWith('audio/'))       return <FileAudio className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />;
  if (contentType.includes('pdf'))            return <FileText  className="w-4 h-4" style={{ color: '#e74c3c' }} />;
  if (contentType.includes('json') || contentType.includes('javascript') || contentType.includes('html') || contentType.includes('css'))
    return <FileCode className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />;
  return <File className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />;
}

function ConfirmModal({ action, doc, onConfirm, onCancel, loading }) {
  const isDelete = action === 'delete';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <div className="glass-panel-3d w-full max-w-md p-7 relative" style={{ border: '1.5px solid rgba(220,38,38,0.35)' }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(254,226,226,0.85)', border: '1.5px solid rgba(220,38,38,0.35)' }}>
            <AlertTriangle className="w-7 h-7" style={{ color: '#dc2626' }} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl mb-1" style={{ color: 'var(--text-main)' }}>
              {isDelete ? 'Confirm Delete' : 'Confirm Edit'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This action will directly modify the database and {isDelete ? 'permanently remove' : 'update'} the document record.
            </p>
          </div>

          <div className="w-full rounded-xl p-3 text-left text-sm"
            style={{ background: 'rgba(254,226,226,0.50)', border: '1px solid rgba(220,38,38,0.20)' }}>
            <div className="flex items-center gap-2 font-semibold" style={{ color: '#991b1b' }}>
              <Database className="w-3.5 h-3.5" />
              <span>Database Change Warning</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#7f1d1d' }}>
              {isDelete
                ? `Document "${doc?.original_filename}" and its file will be permanently deleted. This cannot be undone.`
                : `Metadata for "${doc?.original_filename}" will be updated in the database.`}
            </p>
          </div>

          <div className="flex gap-3 w-full mt-1">
            <button onClick={onCancel}
              className="btn-glass-secondary flex-1 py-2.5 text-sm" disabled={loading}>
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 text-sm font-heading font-bold rounded-xl flex items-center justify-center gap-2"
              style={{
                background: isDelete ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,var(--btn-grad-from),var(--btn-grad-to))',
                color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isDelete ? <><Trash2 className="w-4 h-4" /> Delete</> : <><Pencil className="w-4 h-4" /> Save</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ doc, onSave, onClose }) {
  const [form, setForm] = useState({
    filename: doc.original_filename,
    description: doc.description || '',
    tags: doc.tags || '',
  });
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(doc.id, { filename: form.filename, description: form.description, tags: form.tags });
    setSaving(false);
    setConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(5px)' }}>
        <div className="glass-panel-3d w-full max-w-lg p-7 relative">
          <button onClick={onClose} className="absolute top-4 right-4 theme-toggle w-8 h-8">
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <h3 className="font-heading font-bold text-xl mb-5 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <Pencil className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            Edit Document
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Filename
              </label>
              <div className="relative">
                <input className="field-input pl-10" value={form.filename}
                  onChange={e => setForm(f => ({ ...f, filename: e.target.value }))} />
                <FileText className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Description
              </label>
              <div className="relative">
                <textarea className="field-input pl-10 resize-none" rows={3} value={form.description}
                  style={{ paddingTop: '10px' }}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <AlignLeft className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Tags <span className="normal-case font-normal" style={{ color: 'var(--text-dim)' }}>(comma separated)</span>
              </label>
              <div className="relative">
                <input className="field-input pl-10" value={form.tags}
                  placeholder="e.g. report, finance, 2024"
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                <Tag className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-glass-secondary flex-1 py-2.5 text-sm">Cancel</button>
            <button onClick={() => setConfirm(true)}
              className="btn-glass-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
      {confirm && (
        <ConfirmModal action="edit" doc={doc} loading={saving}
          onConfirm={handleSave} onCancel={() => setConfirm(false)} />
      )}
    </>
  );
}

function UploadPanel({ onUploaded, onClose }) {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setUploading(true); setError(null);
    const res = await uploadDocument(file, desc, tags);
    setUploading(false);
    if (res.success) { onUploaded(res.data); }
    else { setError(res.error); }
  };

  return (
    <div className="glass-panel-3d p-5 mb-4" style={{ border: '1px dashed var(--glass-border-bright)' }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-heading font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <FilePlus className="w-4.5 h-4.5" style={{ color: 'var(--accent-primary)' }} /> Upload Document
        </h4>
        <button onClick={onClose} className="theme-toggle w-7 h-7">
          <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current.click()}
        className="rounded-xl p-5 text-center cursor-pointer transition-all duration-200"
        style={{
          border: `2px dashed ${file ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
          background: file ? 'rgba(2,132,199,0.06)' : 'var(--bg-input)',
        }}>
        <input ref={inputRef} type="file" className="hidden"
          onChange={e => setFile(e.target.files[0] || null)} />
        {file
          ? <p className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
              {fileIcon(file.type)} {file.name} — {formatBytes(file.size)}
            </p>
          : <>
              <Upload className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--text-dim)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Drop any file here or <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>browse</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>PDF, DOCX, images, videos, code — all types accepted</p>
            </>
        }
      </div>

      <div className="flex flex-col gap-3 mt-3">
        <input className="field-input pl-4" placeholder="Description (optional)"
          value={desc} onChange={e => setDesc(e.target.value)} />
        <input className="field-input pl-4" placeholder="Tags: report, finance (optional)"
          value={tags} onChange={e => setTags(e.target.value)} />
      </div>

      {error && (
        <div className="alert-error mt-3 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={uploading}
        className="btn-glass-primary w-full mt-4 py-2.5 text-sm flex items-center justify-center gap-2">
        {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload</>}
      </button>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm the Enterprise RAG AI assistant. Ask me anything about your uploaded documents, or request document analysis and insights.",
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
        text: 'Hello! 👋 What would you like to know?',
      }]);
      return;
    }

    setThinking(true);
    const res = await sendQuery(trimmed, 'admin');
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
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4" style={{ minHeight: 0 }}>
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
            <div className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed"
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
            <div className="rounded-2xl px-4 py-3 flex gap-1.5 items-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '4px 18px 18px 18px' }}>
              {[0, 150, 300].map(delay => (
                <span key={delay} className="w-1.5 h-1.5 rounded-full block"
                  style={{
                    background: 'var(--accent-primary)',
                    animation: `pulseGreen 1.2s ${delay}ms infinite`,
                  }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-4 pt-3 flex-shrink-0" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            rows={2}
            className="field-input flex-1 resize-none pl-4 text-sm"
            style={{ borderRadius: '14px' }}
            placeholder="Ask about your documents…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button onClick={send} disabled={!input.trim() || thinking}
            className="btn-glass-primary px-4 py-3 flex items-center justify-center"
            style={{ borderRadius: '14px', minWidth: '46px', opacity: (!input.trim() || thinking) ? 0.5 : 1 }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-dim)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function AnalysisPanel({ docs }) {
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
    const tags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const recent = [...docs]
      .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
      .slice(0, 5);

    const largest = [...docs]
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

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

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center px-6">
        <BarChart2 className="w-12 h-12" style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No data to analyse yet.</p>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Upload documents to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ minHeight: 0 }}>
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,var(--btn-grad-from),var(--accent-primary))' }}>
          <BarChart2 className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm" style={{ color: 'var(--text-main)' }}>Document Analysis</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>Storage · Types · Tags · Recency</p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-5">

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Files',    value: stats.total,                    icon: <FileText  className="w-4 h-4" />, color: 'var(--accent-primary)' },
            { label: 'Total Storage',  value: formatBytes(stats.totalSize),   icon: <HardDrive className="w-4 h-4" />, color: 'var(--accent-purple)' },
            { label: 'File Types',     value: stats.types.length,             icon: <PieChart  className="w-4 h-4" />, color: 'var(--accent-cyan)' },
            { label: 'Unique Tags',    value: stats.tags.length,              icon: <Tag       className="w-4 h-4" />, color: 'var(--accent-emerald)' },
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

        {stats.tags.length > 0 && (
          <div className="glass-panel-3d rounded-xl p-4" style={{ border: '1px solid var(--glass-border)' }}>
            <p className="font-heading font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Tag className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} /> Tag Cloud
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.tags.map(([tag, count]) => (
                <span key={tag}
                  className="px-2.5 py-1 rounded-full text-xs font-mono"
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

      </div>
    </div>
  );
}

function DocRow({ doc, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px -8px rgba(2,132,199,0.12), 0 0 0 1px rgba(0,180,255,0.08) inset, inset 0 1px 1px var(--glass-highlight)',
      }}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--glass-border)' }}>
          {fileIcon(doc.content_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>
            {doc.original_filename}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
            {doc.content_type} · {formatBytes(doc.size)}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{ color: 'var(--text-dim)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-3"
          style={{ borderTop: '1px solid var(--glass-border)' }}>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div><span className="font-semibold" style={{ color: 'var(--text-dim)' }}>Uploaded:</span><br />{formatDate(doc.uploaded_at)}</div>
            <div><span className="font-semibold" style={{ color: 'var(--text-dim)' }}>Updated:</span><br />{formatDate(doc.updated_at)}</div>
            {doc.description && (
              <div className="col-span-2">
                <span className="font-semibold" style={{ color: 'var(--text-dim)' }}>Description:</span><br />
                {doc.description}
              </div>
            )}
            {doc.tags && (
              <div className="col-span-2 flex flex-wrap gap-1 mt-1">
                {doc.tags.split(',').map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs font-mono"
                    style={{ background: 'rgba(2,132,199,0.10)', border: '1px solid rgba(2,132,199,0.25)', color: 'var(--accent-primary)' }}>
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1" style={{ minHeight: '36px' }}>
            <a
              href={downloadDocumentUrl(doc.id)}
              target="_blank"
              rel="noreferrer"
              className="btn-glass-secondary btn-glass-sm flex items-center gap-1.5 text-xs flex-1 justify-center"
              style={{ minWidth: 0 }}>
              <Download className="w-3.5 h-3.5" /><span>Download</span>
            </a>
            <button
              onClick={e => { e.stopPropagation(); onEdit(doc); }}
              className="btn-glass-secondary btn-glass-sm flex items-center gap-1.5 text-xs flex-1 justify-center"
              style={{ minWidth: 0 }}>
              <Pencil className="w-3.5 h-3.5" /><span>Edit</span>
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(doc); }}
              className="btn-glass-sm flex items-center gap-1.5 text-xs flex-1 justify-center rounded-xl"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#dc2626', cursor: 'pointer', minWidth: 0 }}>
              <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [rightTab, setRightTab] = useState('chat');

  const [layout, setLayout] = useState('split');
  const [leftWidth, setLeftWidth] = useState(400);
  const MIN_W = 260;
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

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true); setFetchError(null);
    const res = await listDocuments();
    setLoading(false);
    if (res.success) setDocs(res.data);
    else setFetchError(res.error);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUploaded = (doc) => {
    setDocs(d => [doc, ...d]);
    setShowUpload(false);
    showToast('success', `"${doc.original_filename}" uploaded successfully.`);
  };

  const handleEdit = async (id, payload) => {
    const res = await editDocument(id, payload);
    if (res.success) {
      setDocs(d => d.map(doc => doc.id === id ? res.data : doc));
      setEditTarget(null);
      showToast('success', 'Document updated successfully.');
    } else {
      showToast('error', res.error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteDocument(deleteTarget.id);
    setDeleting(false);
    if (res.success) {
      setDocs(d => d.filter(doc => doc.id !== deleteTarget.id));
      showToast('success', `"${deleteTarget.original_filename}" deleted.`);
    } else {
      showToast('error', res.error);
    }
    setDeleteTarget(null);
  };

  const filtered = docs.filter(d =>
    d.original_filename.toLowerCase().includes(search.toLowerCase()) ||
    (d.tags || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { dark, toggle } = useTheme();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen relative z-10 overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>

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
              <Cpu className="w-4.5 h-4.5" style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-extrabold text-base tracking-tight"
              style={{ color: 'var(--text-main)' }}>
              ENTERPRISE&nbsp;<span className="gradient-text">RAG</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono font-medium"
              style={{ color: 'var(--text-dim)' }}>
              Admin Panel
            </span>
          </div>

          <span className="ml-2 text-[10px] font-mono px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1.5"
            style={{
              background: 'rgba(109,40,217,0.10)',
              border: '1px solid rgba(109,40,217,0.25)',
              color: 'var(--accent-purple)',
            }}>
            <Shield className="w-3 h-3" />
            {user?.username}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggle} className="theme-toggle"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme">
            {dark
              ? <Sun  className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              : <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            }
          </button>

          <button onClick={handleLogout}
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
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}>
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <div ref={bodyRef} className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>

      <div className="flex flex-col flex-shrink-0 h-full transition-all duration-200"
        style={{
          width: layout === 'left-full'  ? '100%'
               : layout === 'right-full' ? '0px'
               : `${leftWidth}px`,
          minWidth: layout === 'right-full' ? 0 : MIN_W,
          overflow: layout === 'right-full' ? 'hidden' : undefined,
          borderRight: '1px solid var(--glass-border)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
        }}>

        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="relative">
            <button onClick={() => setMenuOpen(m => !m)}
              className="theme-toggle w-9 h-9 flex items-center justify-center"
              title="Document actions">
              <Menu className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </button>
            {menuOpen && (
              <div className="absolute top-11 left-0 glass-panel-3d rounded-xl overflow-hidden z-30 min-w-[180px]"
                style={{ border: '1px solid var(--glass-border)' }}>
                {[
                   { label: 'Upload Document', icon: <Upload    className="w-3.5 h-3.5" />, action: () => { setShowUpload(true); setMenuOpen(false); } },
                   { label: 'Refresh List',    icon: <RefreshCw className="w-3.5 h-3.5" />, action: () => { fetchDocs(); setMenuOpen(false); } },
                   { label: 'Analysis',        icon: <BarChart2 className="w-3.5 h-3.5" />, action: () => { setRightTab('analysis'); setMenuOpen(false); } },
                 ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[rgba(2,132,199,0.08)]"
                    style={{ color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-base" style={{ color: 'var(--text-main)' }}>
              Documents
            </h2>
            <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
              {docs.length} file{docs.length !== 1 ? 's' : ''} in database
            </p>
          </div>

          <button onClick={() => setShowUpload(s => !s)}
            className="btn-glass-primary btn-glass-sm flex items-center gap-1.5 text-xs">
            <FilePlus className="w-3.5 h-3.5" /> Upload
          </button>

          <button
            onClick={() => setLayout(l => l === 'left-full' ? 'split' : 'left-full')}
            className="theme-toggle w-8 h-8 flex items-center justify-center flex-shrink-0"
            title={layout === 'left-full' ? 'Restore split view' : 'Maximize documents panel'}>
            {layout === 'left-full'
              ? <Minimize2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              : <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
            }
          </button>
        </div>

        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="relative">
            <input className="field-input pl-9 text-sm" placeholder="Search by name, tag, description…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
          </div>
        </div>

        {showUpload && (
          <div className="px-4 pt-4 flex-shrink-0">
            <UploadPanel onUploaded={handleUploaded} onClose={() => setShowUpload(false)} />
          </div>
        )}

        <div className="mx-4 mt-3 mb-1 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#b45309' }} />
          <p className="text-xs" style={{ color: '#92400e' }}>
            Edit &amp; delete operations modify the live database. A confirmation prompt will appear before any change.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 flex flex-col gap-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading documents…</p>
            </div>
          )}
          {!loading && fetchError && (
            <div className="alert-error mt-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{fetchError}
            </div>
          )}
          {!loading && !fetchError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
              <FileText className="w-10 h-10" style={{ color: 'var(--text-dim)', opacity: 0.5 }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                {search ? 'No documents match your search.' : 'No documents yet.'}
              </p>
              {!search && (
                <button onClick={() => setShowUpload(true)} className="btn-glass-primary btn-glass-sm text-xs flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload your first document
                </button>
              )}
            </div>
          )}
          {!loading && filtered.map(doc => (
            <DocRow key={doc.id} doc={doc}
              onEdit={d => setEditTarget(d)}
              onDelete={d => setDeleteTarget(d)} />
          ))}
        </div>
      </div>

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

      <div className="flex flex-1 flex-col h-full transition-all duration-200"
        style={{
          background: 'var(--bg-page)',
          minWidth: layout === 'left-full' ? 0 : MIN_W,
          width: layout === 'left-full' ? '0px' : undefined,
          overflow: layout === 'left-full' ? 'hidden' : undefined,
          display: layout === 'left-full' ? 'none' : 'flex',
          height: layout === 'left-full' ? 'none' : 'flex',
        }}>

        <div className="flex items-center flex-shrink-0 px-4 pt-2 gap-2"
          style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
          <div className="flex gap-2 flex-1">
            {[
              { id: 'chat',     label: 'AI Chat',  icon: <Bot       className="w-3.5 h-3.5" /> },
              { id: 'analysis', label: 'Analysis', icon: <BarChart2 className="w-3.5 h-3.5" /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setRightTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-heading font-semibold rounded-t-lg transition-all duration-150"
                style={{
                  color:        rightTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  background:   rightTab === tab.id ? 'var(--bg-page)'        : 'transparent',
                  border:       'none',
                  borderBottom: rightTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  cursor:       'pointer',
                }}>
                <span style={{ color: rightTab === tab.id ? 'var(--accent-primary)' : 'var(--text-dim)' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setLayout(l => l === 'right-full' ? 'split' : 'right-full')}
            className="theme-toggle w-8 h-8 flex items-center justify-center flex-shrink-0 mb-1"
            title={layout === 'right-full' ? 'Restore split view' : 'Maximize this panel'}>
            {layout === 'right-full'
              ? <Minimize2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              : <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
            }
          </button>
        </div>

        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {rightTab === 'chat'     && <ChatPanel />}
          {rightTab === 'analysis' && <AnalysisPanel docs={docs} />}
        </div>

      </div>

      </div>

      {editTarget && (
        <EditModal doc={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />
      )}
      {deleteTarget && (
        <ConfirmModal action="delete" doc={deleteTarget} loading={deleting}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl flex items-center gap-3 text-sm shadow-xl transition-all duration-300 ${
            toast.type === 'success' ? 'alert-success' : 'alert-error'
          }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          {toast.text}
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
