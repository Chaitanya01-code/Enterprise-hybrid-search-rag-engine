import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Sparkles, 
  Zap, 
  Users, 
  Briefcase, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Bot, 
  Server,
  FileText,
  RefreshCw
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export default function Welcome() {
  const [testQuery, setTestQuery] = useState('What are the Q3 enterprise compliance protocols?');
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
            { id: "S3-STORAGE: policy_v3.pdf", score: "0.941 Confidence" }
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

      {/* HERO SECTION */}
      <section className="flex flex-col items-center text-center gap-8 relative">
        
        {/* Floating 3D Badge */}
        <div className="status-pill border-cyan-500/30 bg-cyan-950/40 text-cyan-300 shadow-lg shadow-cyan-500/10 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">
            Next-Gen Enterprise AI Engine
          </span>
        </div>

        {/* 3D Glass Typography Title */}
        <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl tracking-tight max-w-5xl leading-[1.1] text-white">
          Bridge Your <span className="gradient-text">Company Database</span> With Intelligent AI
        </h1>

        {/* Brief Information about Enterprise RAG */}
        <p className="text-slate-300 text-base sm:text-xl max-w-3xl leading-relaxed font-normal">
          <strong className="text-cyan-300 font-semibold">Enterprise RAG</strong> is an AI-integrated system designed to seamlessly connect <strong>clients</strong> and <strong>workers</strong> directly with company databases, enabling real-time search, instant document synthesis, and secure access control.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Link to="/signup" className="btn-glass-primary text-base py-3.5 px-8">
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link to="/login" className="btn-glass-secondary text-base py-3.5 px-8">
            <span>Access Workspace</span>
          </Link>

          <button 
            onClick={handleTestBackend}
            className="btn-glass-secondary text-base py-3.5 px-6 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 flex items-center gap-2"
          >
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Backend Ping Response Toast */}
        {apiPing && (
          <div className={`mt-2 px-5 py-3 rounded-xl border text-sm font-mono flex items-center gap-3 shadow-xl backdrop-blur-md ${
            apiPing.error ? 'bg-red-950/80 border-red-500/40 text-red-300' : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
          }`}>
            <RefreshCw className={`w-4 h-4 ${apiPing.loading ? 'animate-spin' : ''}`} />
            <span>{apiPing.loading ? 'Connecting to backend...' : (apiPing.data || apiPing.error)}</span>
          </div>
        )}

      </section>

      {/* 3D GLASS DEMO SIMULATOR */}
      <section className="glass-panel-3d glass-card-interactive p-6 md:p-10 border border-slate-700/50 relative overflow-hidden">
        
        {/* Decorative Top Glass Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" /> Enterprise Database
            </span>
          </div>
          <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-md border border-cyan-500/20">
            Live Interactive Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Query Form Input */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <h3 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-cyan-400" />
              Live AI Console
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Test how clients and workers query enterprise databases in real time. Retrieve precise contextual answers directly from company data.
            </p>

            <form onSubmit={handleSimulateSearch} className="flex flex-col gap-3 mt-2">
              <div className="relative">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  placeholder="Ask any database question..."
                />
                <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              <button
                type="submit"
                disabled={queryState.loading}
                className="btn-glass-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
              >
                {queryState.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>Run Query</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Output Window */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-white/10 rounded-xl p-5 min-h-[220px] flex flex-col justify-between shadow-inner">
            {queryState.loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-cyan-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-mono tracking-wider">Searching Enterprise Knowledge Base...</span>
              </div>
            ) : queryState.result ? (
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synthesized Response ({queryState.result.latency})
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Enterprise Engine</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans border-l-2 border-cyan-400 pl-3">
                  {queryState.result.answer}
                </p>
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Database Source Citations:</span>
                  <div className="flex flex-wrap gap-2">
                    {queryState.result.sources.map((src, i) => (
                      <span key={i} className="text-xs font-mono bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded text-cyan-300 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" /> {src.id} <span className="text-slate-500">({src.score})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 gap-2 font-mono text-sm">
                <Bot className="w-10 h-10 text-slate-600 mb-1" />
                <span>Enter a query above or click "Run Query" to test AI response</span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* SOLUTIONS FOR CLIENTS & WORKERS */}
      <section id="solutions" className="flex flex-col gap-10">
        
        <div className="text-center flex flex-col gap-3">
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white">
            Designed for <span className="gradient-text-purple">Enterprise Clients & Workers</span>
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Empower external clients with round-the-clock instant database answers and streamline internal worker workflows with contextual document retrieval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: For Clients */}
          <div className="glass-panel-3d glass-card-interactive p-8 flex flex-col justify-between gap-6 border-indigo-500/20">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-white">For Clients</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Provide your enterprise clients with an intuitive, AI-powered conversational portal directly linked to your knowledge base, FAQs, and product documentations.
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-300 mt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>24/7 Instant natural language database querying</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Exact source citations with verified accuracy</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Role-filtered public client access controls</span>
                </li>
              </ul>
            </div>
            
            <Link to="/signup" className="btn-glass-secondary text-xs self-start mt-2 border-indigo-500/30 text-indigo-300">
              <span>Client Portal Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: For Workers & Teams */}
          <div className="glass-panel-3d glass-card-interactive p-8 flex flex-col justify-between gap-6 border-cyan-500/20">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-white">For Workers & Teams</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Supercharge internal employee productivity. Workers can upload documents, query internal relational databases, and synthesize complex policy reports in seconds.
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-300 mt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Unified search across PDF, DOCX, SQL & document repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated document chunking & AI embedding storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Seamless enterprise database connection</span>
                </li>
              </ul>
            </div>

            <Link to="/login" className="btn-glass-secondary text-xs self-start mt-2 border-cyan-500/30 text-cyan-300">
              <span>Worker Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="glass-panel-3d p-8 md:p-12 text-center flex flex-col items-center gap-6 border-cyan-500/30">
        <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Ready to Connect Your Enterprise Data?
        </h3>
        <p className="text-slate-300 text-sm max-w-xl">
          Join clients and workers using Enterprise RAG to transform internal search and client interactions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/signup" className="btn-glass-primary py-3 px-8 text-sm">
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-glass-secondary py-3 px-8 text-sm">
            <span>Worker Login</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}
