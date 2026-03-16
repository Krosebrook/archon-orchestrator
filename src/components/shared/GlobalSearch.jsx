import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Bot, GitFork, PlaySquare, FileText, Loader2, X, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';

const TYPE_CONFIG = {
  agent:    { icon: Bot,       color: 'text-blue-400',   label: 'Agent',    path: 'Agents' },
  workflow: { icon: GitFork,   color: 'text-green-400',  label: 'Workflow', path: 'Workflows' },
  run:      { icon: PlaySquare,color: 'text-purple-400', label: 'Run',      path: 'RunDetail' },
  template: { icon: FileText,  color: 'text-yellow-400', label: 'Template', path: 'Templates' },
};

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

async function searchAll(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const [agents, workflows, runs, templates] = await Promise.all([
    base44.entities.Agent.list().catch(() => []),
    base44.entities.Workflow.list().catch(() => []),
    base44.entities.Run.filter({}, '-started_at', 100).catch(() => []),
    base44.entities.WorkflowTemplate.list().catch(() => []),
  ]);

  const score = (text) => {
    if (!text) return 0;
    const t = text.toLowerCase();
    if (t.startsWith(q)) return 3;
    if (t.includes(q)) return 2;
    // fuzzy: all chars of q appear in order
    let qi = 0;
    for (const c of t) { if (c === q[qi]) qi++; }
    return qi === q.length ? 1 : 0;
  };

  const results = [
    ...agents.map(a => ({ type: 'agent', id: a.id, title: a.name, subtitle: `v${a.version} · ${a.status}`, score: score(a.name) })),
    ...workflows.map(w => ({ type: 'workflow', id: w.id, title: w.name, subtitle: w.description || w.status, score: score(w.name) + score(w.description) })),
    ...runs.map(r => ({ type: 'run', id: r.id, title: r.name || `Run ${r.id?.slice(0, 8)}`, subtitle: `${r.state} · ${r.agent_id ? 'agent run' : 'workflow run'}`, score: score(r.name) + score(r.id) })),
    ...templates.map(t => ({ type: 'template', id: t.id, title: t.name, subtitle: t.description || t.category, score: score(t.name) + score(t.description) + score(t.tags?.join(' ')) })),
  ].filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);

  return results;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('archon_search_recent') || '[]'); } catch { return []; }
  });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const doSearch = useCallback(debounce(async (q) => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await searchAll(q);
      setResults(res);
      setActiveIdx(0);
    } finally {
      setLoading(false);
    }
  }, 280), []);

  useEffect(() => { doSearch(query); }, [query]);

  const handleSelect = (result) => {
    // Save to recent
    const newRecent = [result, ...recent.filter(r => r.id !== result.id)].slice(0, 5);
    setRecent(newRecent);
    localStorage.setItem('archon_search_recent', JSON.stringify(newRecent));
    // Navigate
    if (result.type === 'run') {
      navigate(`${createPageUrl('RunDetail')}?id=${result.id}`);
    } else {
      navigate(createPageUrl(TYPE_CONFIG[result.type]?.path || 'Dashboard'));
    }
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    const list = results.length > 0 ? results : (query ? [] : recent);
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && list[activeIdx]) { handleSelect(list[activeIdx]); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  const displayList = results.length > 0 ? results : (!query && recent.length > 0 ? recent : []);
  const showEmpty = query.trim() && !loading && results.length === 0;

  return (
    <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
      <Input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Search agents, runs, templates… (⌘K)"
        className="bg-slate-800 border-slate-700 pl-9 pr-8 w-64 text-sm focus:w-80 transition-all"
        aria-label="Global search"
        aria-expanded={open}
        aria-haspopup="listbox"
        role="combobox"
      />
      {query && (
        <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          <X className="h-3 w-3" />
        </button>
      )}
      {loading && !query && null}
      {loading && query && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
        </div>
      )}

      <AnimatePresence>
        {open && (displayList.length > 0 || showEmpty) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 left-0 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            role="listbox"
          >
            {!query && recent.length > 0 && (
              <div className="px-3 pt-2 pb-1 text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent
              </div>
            )}
            {query && results.length > 0 && (
              <div className="px-3 pt-2 pb-1 text-xs text-slate-500">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
            )}
            {showEmpty && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No results for "<span className="text-slate-300">{query}</span>"
              </div>
            )}
            <ul className="py-1 max-h-72 overflow-y-auto">
              {displayList.map((result, idx) => {
                const cfg = TYPE_CONFIG[result.type] || TYPE_CONFIG.agent;
                const Icon = cfg.icon;
                return (
                  <li key={result.id}
                    role="option"
                    aria-selected={idx === activeIdx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={() => handleSelect(result)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${idx === activeIdx ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
                  >
                    <div className={`w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{result.title}</div>
                      {result.subtitle && <div className="text-slate-500 text-xs truncate">{result.subtitle}</div>}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded bg-slate-800 ${cfg.color} shrink-0`}>
                      {cfg.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}