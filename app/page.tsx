'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Terminal, Copy, Check, Info, Loader2, Settings, X, FileText, Play, Save } from 'lucide-react';

interface LogEntry {
  id: string;
  text: string;
  lineCount: number;
}

const LANGUAGES = [
  "Turkish", "English", "Spanish", "French", "German",
  "Italian", "Portuguese", "Russian", "Chinese", "Japanese",
  "Korean", "Arabic", "Hindi", "Dutch", "Polish",
  "Swedish", "Danish", "Finnish", "Norwegian", "Greek"
];

export default function Home() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [instructions, setInstructions] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [language, setLanguage] = useState('Turkish');
  
  const [result, setResult] = useState<{ detailed_analysis: string, quick_summary: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [copiedDetailed, setCopiedDetailed] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTokens, setCurrentTokens] = useState<number>(0);
  const [totalTokens, setTotalTokens] = useState<number>(0);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.instructions) setInstructions(data.instructions);
      if (data.apiKey) setApiKey(data.apiKey);
      if (data.modelName) setModelName(data.modelName);
    }).catch(err => console.error("Error loading config:", err));
    
    const savedTokens = localStorage.getItem('totalTokens');
    if (savedTokens) setTotalTokens(parseInt(savedTokens, 10));
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions, apiKey, modelName })
      });
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (text.trim()) {
      const lines = text.split('\n').length;
      setLogEntries(prev => [...prev, { id: Date.now().toString(), text, lineCount: lines }]);
      // Clear the input visually
      (e.target as HTMLInputElement).value = '';
    }
  };

  const handleRemoveLog = (id: string) => {
    setLogEntries(prev => prev.filter(log => log.id !== id));
  };

  const clearNewAnalysis = () => {
    setLogEntries([]);
    setResult(null);
    setError(null);
    setCurrentTokens(0);
  };

  const handleAnalyze = async () => {
    if (logEntries.length === 0) {
      setError('Please provide logs or error output.');
      return;
    }

    const combinedLogs = logEntries.map((l, i) => `--- Log Block ${i+1} ---\n${l.text}`).join('\n\n');

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setCurrentTokens(0);
    const start = Date.now();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: combinedLogs, instructions, apiKey, modelName, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze logs.');
      }

      setResult(data.result);
      if (data.usage && data.usage.total_tokens) {
         const newTotal = totalTokens + data.usage.total_tokens;
         setCurrentTokens(data.usage.total_tokens);
         setTotalTokens(newTotal);
         localStorage.setItem('totalTokens', newTotal.toString());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLatency(Date.now() - start);
      setIsAnalyzing(false);
    }
  };

  const copyDetailed = () => {
    if (!result?.detailed_analysis) return;
    navigator.clipboard.writeText(result.detailed_analysis);
    setCopiedDetailed(true);
    setTimeout(() => setCopiedDetailed(false), 2000);
  };

  const copySummary = () => {
    if (!result?.quick_summary) return;
    navigator.clipboard.writeText(result.quick_summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="bg-[#09090b] h-screen w-full flex flex-col font-sans text-white overflow-hidden selection:bg-blue-500/30">
      
      {/* Header */}
      <header className='h-16 shrink-0 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-zinc-950/50 backdrop-blur-md z-20'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/40'>
            <Terminal className="w-5 h-5" />
          </div>
          <h1 className='text-lg md:text-xl font-extrabold tracking-tight uppercase italic'>
            LogSense <span className='text-blue-500'>AI</span>
          </h1>
        </div>
        <div className='flex items-center gap-4'>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className='p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800'
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={clearNewAnalysis} 
            className='px-4 py-2 bg-zinc-100 text-zinc-950 text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg'
          >
            New Analysis
          </button>
        </div>
      </header>

      {/* Horizontal Log Input Bar */}
      <div className="flex items-center p-3 border-b border-zinc-800 bg-[#0c0c0e] shrink-0 gap-3 z-10 overflow-x-auto custom-scrollbar">
        {logEntries.map(entry => (
          <div key={entry.id} className="bg-blue-600/10 border border-blue-500/30 text-blue-200 text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-2 group shadow-sm shrink-0 transition-all hover:bg-blue-600/20">
             <FileText className="w-3 h-3 text-blue-400" />
             <span className="font-semibold">[{entry.lineCount} Lines Pasted]</span>
             <button 
               onClick={() => handleRemoveLog(entry.id)}
               className="ml-1 text-blue-400/50 hover:text-blue-200 rounded-full hover:bg-blue-500/30 p-0.5 transition-colors"
             >
               <X className="w-3 h-3" />
             </button>
          </div>
        ))}
        
        <div className="flex-1 min-w-[250px] flex items-center px-4 bg-zinc-900/50 rounded-full border border-zinc-800/80 hover:border-zinc-700/80 transition-colors relative mx-2">
           <input 
              type="text" 
              className="w-full bg-transparent border-none text-sm text-zinc-300 focus:outline-none focus:ring-0 py-2.5 placeholder:text-zinc-600" 
              placeholder={logEntries.length === 0 ? "Click and Paste (Ctrl+V) your logs here..." : "Paste more logs here..."} 
              onPaste={handlePaste} 
              onChange={(e) => { e.target.value = ''; }} // prevent typing
           />
           <div className="absolute right-3 text-[10px] uppercase font-bold text-zinc-600 tracking-wider pointer-events-none">
             Ctrl+V
           </div>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || logEntries.length === 0}
            className='bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow shadow-blue-900/20 flex items-center gap-2 transition-all text-sm'
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            {isAnalyzing ? "Analyzing" : "Analyze"}
          </button>
        </div>
      </div>
      
      {/* Error Output bar */}
      {error && (
        <div className="shrink-0 p-2 bg-red-950 border-b border-red-900/50 text-center">
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className='flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden bg-[#09090b]'>
        
        {/* Detailed Analysis Area (2/3 width) */}
        <section className='col-span-1 md:col-span-2 flex flex-col border-r border-zinc-800 h-full overflow-hidden'>
          <div className='p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center shrink-0'>
            <h3 className='text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2'>
              <Terminal className="w-4 h-4" />
              AI Insight & Solution
            </h3>
            
            {result?.detailed_analysis && (
               <button 
                  onClick={copyDetailed}
                  className='p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-bold transition-colors text-zinc-300'
                  title="Copy Detailed Analysis"
                >
                  {copiedDetailed ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            )}
          </div>
          
          <div className='flex-1 p-6 md:p-8 relative overflow-y-auto custom-scrollbar bg-[#0c0c0e]'>
            {isAnalyzing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
                <p className="text-xs font-bold uppercase tracking-widest animate-pulse text-zinc-400">Processing detailed logs</p>
              </div>
            ) : result?.detailed_analysis ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.detailed_analysis}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Awaiting analysis...</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Summary Area (1/3 width) */}
        <section className='col-span-1 flex flex-col h-full overflow-hidden bg-zinc-950/40'>
          <div className='p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center shrink-0'>
            <h3 className='text-xs font-bold uppercase tracking-widest text-blue-400'>Quick Summary</h3>
            {result?.quick_summary && (
              <button 
                onClick={copySummary}
                className='text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5'
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSummary ? 'Copied' : 'Copy MD'}
              </button>
            )}
          </div>
          
          <div className='flex-1 p-6 relative overflow-y-auto custom-scrollbar font-mono text-sm'>
            {isAnalyzing ? (
              <div className="flex flex-col space-y-3 pt-4">
                 {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-zinc-800/50 rounded-full animate-pulse w-full"></div>
                 ))}
                 <div className="h-4 bg-zinc-800/50 rounded-full animate-pulse w-2/3"></div>
              </div>
            ) : result?.quick_summary ? (
              <div className="text-zinc-300 leading-relaxed markdown-summary whitespace-pre-wrap">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.quick_summary}
                  </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                <p className="text-xs text-center border border-dashed border-zinc-700 p-4 rounded-xl">Rapid actionable summary will appear here</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className='h-8 shrink-0 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 md:px-6 justify-between z-20'>
        <div className='flex items-center gap-4'>
          <span className='text-[10px] text-zinc-500 font-bold uppercase hidden sm:inline'>Session: SAAS_PR_042</span>
          <span className='text-[10px] text-zinc-700 hidden sm:inline'>|</span>
          <span className='text-[10px] text-zinc-500 font-bold uppercase flex gap-1.5 items-center'>
            <span className={`w-1.5 h-1.5 rounded-full ${latency > 0 ? 'bg-green-500' : 'bg-zinc-600'}`}></span>
            Latency: {latency > 0 ? `${latency}ms` : '---'}
          </span>
        </div>
        <div className='text-[10px] text-zinc-600 font-medium'>
          © {new Date().getFullYear()} LogSense. Debugging Suite.
        </div>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80 bg-zinc-900/20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-full p-1.5"
                disabled={isSaving}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              
              <div>
                 <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">API Configuration</h3>
                 <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 mb-2 block">OpenRouter API Key</label>
                      <input 
                        type="password"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-300 outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                        placeholder="sk-or-v1-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        spellCheck="false"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 mb-2 block">OpenRouter Model Name</label>
                      <input 
                        type="text"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-300 outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                        placeholder="minimax/minimax-m2.5:free"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        spellCheck="false"
                      />
                    </div>
                 </div>
              </div>

              <div>
                 <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">AI Context</h3>
                 <label className="text-xs font-semibold text-zinc-400 mb-2 block">Instruction Context</label>
                 <textarea 
                   className="w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300 resize-none outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                   placeholder="// Custom context rules..."
                   value={instructions}
                   onChange={(e) => setInstructions(e.target.value)}
                   spellCheck="false"
                 />
              </div>
              
              <div>
                 <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Token Usage</h3>
                 <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-zinc-400">Current Analysis</span>
                      <span className="text-xs font-mono text-blue-400 font-bold">{currentTokens.toLocaleString()}</span>
                   </div>
                   <div className="h-px bg-zinc-800/50 w-full" />
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-zinc-400">Total Tokens Used</span>
                      <span className="text-xs font-mono text-blue-400 font-bold">{totalTokens.toLocaleString()}</span>
                   </div>
                 </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className='p-4 border-t border-zinc-800/80 bg-zinc-900/20 flex justify-end'>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className='bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all text-sm'
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
