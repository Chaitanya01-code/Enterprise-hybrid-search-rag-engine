import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Trash2, Pencil, Download, FileText, File, Image, FileVideo,
  FileAudio, FileCode, FilePlus, RefreshCw, X, AlertTriangle,
  CheckCircle2, AlertCircle, ChevronDown, Bot, Send, Shield,
  Database, Menu, Search, Tag, AlignLeft, Cpu, LogOut, Sun, Moon,
} from 'lucide-react';
import {
  listDocuments, uploadDocument, editDocument,
  deleteDocument, downloadDocumentUrl,
} from '../services/api';
import { useUser, useTheme } from '../App';

// ── helpers ────────────────────────────────────────────────────────

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

// ── Safety Confirm Modal ───────────────────────────────────────────
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

// ── Edit Modal ─────────────────────────────────────────────────────
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

// ── Upload Panel ───────────────────────────────────────────────────
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

      {/* Drop zone */}
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

// ── AI Chat Panel ──────────────────────────────────────────────────
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

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;
    setMessages(m => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setThinking(true);
    // Placeholder — wire to your RAG endpoint when ready
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
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--glass-border)' }}>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
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
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
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

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--glass-border)' }}>
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

// ── Document Row ───────────────────────────────────────────────────
function DocRow({ doc, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-panel-3d rounded-xl overflow-hidden transition-all duration-200"
      style={{ border: '1px solid var(--glass-border)' }}>
      {/* Main row */}
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

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-3"
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

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <a href={downloadDocumentUrl(doc.id)} target="_blank" rel="noreferrer"
              className="btn-glass-secondary btn-glass-sm flex items-center gap-1.5 text-xs flex-1 justify-center">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button onClick={() => onEdit(doc)}
              className="btn-glass-secondary btn-glass-sm flex items-center gap-1.5 text-xs flex-1 justify-center">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onDelete(doc)}
              className="btn-glass-sm flex items-center gap-1.5 text-xs flex-1 justify-center rounded-xl"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#dc2626', cursor: 'pointer' }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────
export default function AdminPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);   // { type: 'success'|'error', text }
  const [showUpload, setShowUpload] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* ── Admin Header Bar ─────────────────────────────────────── */}
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

          {/* Admin badge */}
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

        {/* Actions */}
        <div className="flex items-center gap-2">
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

      {/* ── Two-panel body ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

      {/* ── Left Panel: Documents ────────────────────────────────── */}
      <div className="flex flex-col w-full md:w-[380px] lg:w-[420px] flex-shrink-0 h-full"
        style={{ borderRight: '1px solid var(--glass-border)', background: 'var(--bg-card)', backdropFilter: 'blur(20px)' }}>

        {/* Left Header */}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--glass-border)' }}>
          {/* Menu Button */}
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
                  { label: 'Upload Document', icon: <Upload className="w-3.5 h-3.5" />, action: () => { setShowUpload(true); setMenuOpen(false); } },
                  { label: 'Refresh List',    icon: <RefreshCw className="w-3.5 h-3.5" />, action: () => { fetchDocs(); setMenuOpen(false); } },
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

          <div className="flex-1">
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
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="relative">
            <input className="field-input pl-9 text-sm" placeholder="Search by name, tag, description…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
          </div>
        </div>

        {/* Upload panel (inline) */}
        {showUpload && (
          <div className="px-4 pt-4 flex-shrink-0">
            <UploadPanel onUploaded={handleUploaded} onClose={() => setShowUpload(false)} />
          </div>
        )}

        {/* DB Safety Banner */}
        <div className="mx-4 mt-3 mb-1 rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#b45309' }} />
          <p className="text-xs" style={{ color: '#92400e' }}>
            Edit &amp; delete operations modify the live database. A confirmation prompt will appear before any change.
          </p>
        </div>

        {/* Document list */}
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

      {/* ── Right Panel: AI Chat ─────────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col h-full" style={{ background: 'var(--bg-page)', minWidth: 0 }}>
        <ChatPanel />
      </div>

      </div>{/* end two-panel body */}

      {/* ── Modals ───────────────────────────────────────────────── */}
      {editTarget && (
        <EditModal doc={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />
      )}
      {deleteTarget && (
        <ConfirmModal action="delete" doc={deleteTarget} loading={deleting}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* ── Toast ────────────────────────────────────────────────── */}
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

      {/* Backdrop to close dropdown menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
