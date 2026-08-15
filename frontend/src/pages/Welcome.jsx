import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, Sparkles, Zap, Search,
  ArrowRight, Bot, Server, FileText, RefreshCw
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export default function Welcome() {
  const [testQuery, setTestQuery] = useState('');
  const [queryState, setQueryState] = useState({ loading: false, result: null });
  const [apiPing, setApiPing] = useState(null);

  const handleSimulateSearch = (e) => {
    e.preventDefault();
    setQueryState({ loading: true, result: null });
    setTimeout(() => {
      setQueryState({
        loading: false,
        result: {
          answer: "According to the Enterprise Database (Doc ID: COMP-2026-Q3), all workers and clients must adhere to encrypted zero-trust access controls. Vector search matched with 98.4% confidence score across enterprise SQL tables & document repositories.",
          sources: [
            { id: "DB-TABLE: compliance_logs", score: "0.984 Confidence" },
            { id: "S3-STORAGE: policy_v3.pdf",  score: "0.941 Confidence" }
          ],
          latency: "42ms"
        }
      });
    }, 900);
  };

  const handleTestBackend = async () => {
    setApiPing({ loading: true, data: null, error: null });
    const health = await checkBackendHealth();
    if (health.status === 'online') {
      setApiPing({ loading: false, data: health.message, error: null });
    } else {
      setApiPing({ loading: false, data: null, error: 'Could not connect to backend server' });
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-16 flex flex-col gap-20">

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center gap-8 relative">

        {/* Badge */}
        <div className="status-pill px-4 py-1.5 rounded-full flex items-center gap-2 animate-bounce shadow-sm">
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '8s', color: 'var(--accent-primary)' }} />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono"
            style={{ color: 'var(--text-muted)' }}>
            Next-Gen Enterprise AI Engine
          </span>
        </div>

        {/* Title */}
        <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl tracking-tight max-w-5xl leading-[1.1]"
          style={{ color: 'var(--text-main)' }}>
          Bridge Your <span className="gradient-text">Company Database</span> With Intelligent AI
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl max-w-3xl leading-relaxed" style={{ color: 'var(--text-body)' }}>
          <strong className="font-semibold" style={{ color: 'var(--accent-primary)' }}>Enterprise RAG</strong> is an
          AI-integrated system designed to seamlessly connect <strong style={{ color: 'var(--text-main)' }}>clients</strong> and{' '}
          <strong style={{ color: 'var(--text-main)' }}>workers</strong> directly with company databases, enabling
          real-time search, instant document synthesis, and secure access control.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Link to="/signup" className="btn-glass-primary text-base py-3.5 px-8">
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-glass-secondary text-base py-3.5 px-8">
            <span style={{ color: 'var(--text-main)' }}>Access Workspace</span>
          </Link>
          <button
            onClick={handleTestBackend}
            className="btn-glass-secondary text-base py-3.5 px-6 flex items-center gap-2"
          >
            <Server className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-main)' }}>Test Connection</span>
          </button>
        </div>

        {/* Backend ping toast */}
        {apiPing && (
          <div className={apiPing.error ? 'alert-error mt-2' : 'alert-success mt-2'}>
            <RefreshCw className={`w-4 h-4 shrink-0 ${apiPing.loading ? 'animate-spin' : ''}`} />
            <span>{apiPing.loading ? 'Connecting to backend...' : (apiPing.data || apiPing.error)}</span>
          </div>
        )}
      </section>

      {/* ── DEMO SIMULATOR ────────────────────────────────────────── */}
      <section className="glass-panel-3d glass-card-interactive p-6 md:p-10 relative overflow-hidden">

        {/* Header bar */}
        <div className="flex items-center justify-between pb-6 mb-6" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
            </div>
            <span className="text-xs font-mono flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
              <Database className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} /> Enterprise Database
            </span>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-md"
            style={{ background: 'rgba(0,180,255,0.08)', color: 'var(--accent-primary)', border: '1px solid var(--glass-border)' }}>
            Live Interactive Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Query form */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <h3 className="font-heading text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Bot className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              Live AI Console
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
              Test how clients and workers query enterprise databases in real time. Retrieve precise contextual answers directly from company data.
            </p>
            <form onSubmit={handleSimulateSearch} className="flex flex-col gap-3 mt-2">
              <div className="relative">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Ask any database question..."
                  className="field-input pr-10 pl-4"
                  style={{ paddingLeft: '16px' }}
                />
                <Search className="absolute right-3.5 top-3 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
              </div>
              <button
                type="submit"
                disabled={queryState.loading}
                className="btn-glass-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
              >
                {queryState.loading
                  ? <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  : <><Zap className="w-4 h-4 text-white" /><span>Run Query</span></>
                }
              </button>
            </form>
          </div>

          {/* Results window */}
          <div className="lg:col-span-7 rounded-xl p-5 min-h-[220px] flex flex-col justify-between"
            style={{ background: 'var(--bg-page-2)', border: '1px solid var(--glass-border)' }}>
            {queryState.loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3"
                style={{ color: 'var(--accent-primary)' }}>
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-mono tracking-wider">Searching Enterprise Knowledge Base...</span>
              </div>
            ) : queryState.result ? (
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                    style={{ background: 'rgba(5,150,105,0.10)', color: 'var(--accent-emerald)', border: '1px solid rgba(5,150,105,0.25)' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synthesized Response ({queryState.result.latency})
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>Enterprise Engine</span>
                </div>
                <p className="text-sm leading-relaxed font-sans pl-3"
                  style={{ color: 'var(--text-body)', borderLeft: '3px solid var(--accent-primary)' }}>
                  {queryState.result.answer}
                </p>
                <div className="flex flex-col gap-1.5 pt-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                    Database Source Citations:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {queryState.result.sources.map((src, i) => (
                      <span key={i} className="text-xs font-mono px-2.5 py-1 rounded flex items-center gap-1"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--accent-primary)' }}>
                        <FileText className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />
                        {src.id} <span style={{ color: 'var(--text-dim)' }}>({src.score})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center gap-2 font-mono text-sm"
                style={{ color: 'var(--text-dim)' }}>
                <Bot className="w-10 h-10 mb-1" style={{ color: 'var(--glass-border-bright)' }} />
                <span>Enter a query above or click "Run Query" to test AI response</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ────────────────────────────────────────────── */}
      <footer className="glass-panel-3d p-8 md:p-12 text-center flex flex-col items-center gap-6">
        <h3 className="font-heading font-extrabold text-3xl sm:text-4xl" style={{ color: 'var(--text-main)' }}>
          Ready to Connect Your Enterprise Data?
        </h3>
        <p className="text-sm max-w-xl" style={{ color: 'var(--text-body)' }}>
          Join clients and workers using Enterprise RAG to transform internal search and client interactions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/signup" className="btn-glass-primary py-3 px-8 text-sm">
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-glass-secondary py-3 px-8 text-sm">
            <span style={{ color: 'var(--text-main)' }}>Worker Login</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
