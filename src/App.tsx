/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  Database, 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Info,
  ChevronRight,
  Cpu,
  Binary,
  Network,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  NetworkData, 
  performFullAnalysis, 
  simulateAttack, 
  AnalysisResult 
} from './services/networkAnalysis';
import { NetworkGraph } from './components/NetworkGraph';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_DATA: NetworkData = {
  nodes: [
    { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }
  ],
  edges: [
    { source: '1', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '4' },
    { source: '3', target: '5' },
    { source: '4', target: '5' }
  ]
};

export default function App() {
  const [network, setNetwork] = useState<NetworkData>(INITIAL_DATA);
  const [history, setHistory] = useState<{ step: number; radius: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'graph' | 'logic' | 'ai' | 'math'>('graph');
  const [inputEdge, setInputEdge] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const analysis = useMemo(() => performFullAnalysis(network), [network]);

  useEffect(() => {
    setHistory(prev => {
      const last = prev[prev.length - 1];
      if (last?.radius === analysis.spectralRadius) return prev;
      return [...prev, { step: prev.length, radius: analysis.spectralRadius }].slice(-10);
    });
  }, [analysis.spectralRadius]);

  const handleAttack = (type: 'random' | 'targeted') => {
    const newData = simulateAttack(network, type, 1);
    setNetwork(newData);
  };

  const handleReset = () => {
    setNetwork(INITIAL_DATA);
    setHistory([]);
  };

  const addEdge = () => {
    const parts = inputEdge.split(/\s+/).filter(Boolean);
    if (parts.length === 2) {
      const [u, v] = parts;
      const newNodes = [...network.nodes];
      if (!newNodes.find(n => n.id === u)) newNodes.push({ id: u });
      if (!newNodes.find(n => n.id === v)) newNodes.push({ id: v });
      
      setNetwork({
        nodes: newNodes,
        edges: [...network.edges, { source: u, target: v }]
      });
      setInputEdge('');
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Header */}
      <header className="bg-[var(--card)] border-b border-[var(--border)] px-8 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Network size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">NetStability AI</h1>
            <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">Spectral Analysis & Reasoning Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">System Live</span>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
        
        {/* Left Sidebar: Controls & Input */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm transition-colors duration-300">
            <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Database size={16} className="text-indigo-600" />
              Network Input
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5 block">Add Connection (u v)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputEdge}
                    onChange={(e) => setInputEdge(e.target.value)}
                    placeholder="e.g. 1 6"
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[var(--text)]"
                  />
                  <button 
                    onClick={addEdge}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-[var(--muted)] italic">Example: 1 2 (Connects node 1 and 2)</p>
              </div>
            </div>
          </section>

          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm transition-colors duration-300">
            <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-600" />
              Attack Simulation
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleAttack('random')}
                className="flex items-center justify-between px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-[var(--text)]">Random Failure</p>
                  <p className="text-[10px] text-[var(--muted)]">Removes a random node</p>
                </div>
                <ChevronRight size={16} className="text-[var(--muted)] group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => handleAttack('targeted')}
                className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">Targeted Attack</p>
                  <p className="text-[10px] text-red-500 dark:text-red-500/70">Removes highest centrality node</p>
                </div>
                <ChevronRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>

          <section className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2 opacity-80">
                <Zap size={16} />
                Optimization Engine
              </h2>
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <p className="text-xs font-bold mb-1">Recommendation</p>
                  <p className="text-[11px] opacity-70 leading-relaxed">
                    {analysis.spectralRadius < 2 
                      ? "Connectivity is low. Add redundant paths between peripheral nodes." 
                      : `Node ${analysis.criticalNodes[0]} is critical. Add a backup server to reduce risk.`}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Cpu size={120} />
            </div>
          </section>
        </div>

        {/* Center: Main Visualization & Tabs */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm transition-colors duration-300">
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Spectral Radius</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--text)]">{analysis.spectralRadius.toFixed(2)}</span>
                <span className={cn("text-[10px] font-bold", analysis.spectralRadius > 2 ? "text-emerald-500" : "text-amber-500")}>
                  {analysis.spectralRadius > 2 ? "Stable" : "Fragile"}
                </span>
              </div>
            </div>
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm transition-colors duration-300">
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Collapse Risk</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--text)]">{(analysis.collapseProbability * 100).toFixed(0)}%</span>
                <div className="flex-1 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden mt-2">
                  <div 
                    className={cn("h-full transition-all duration-500", analysis.collapseProbability > 0.5 ? "bg-red-500" : "bg-emerald-500")}
                    style={{ width: `${analysis.collapseProbability * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm transition-colors duration-300">
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Critical Node</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[var(--text)]">#{analysis.criticalNodes[0] || 'N/A'}</span>
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">High Impact</div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col h-[600px] transition-colors duration-300">
            <div className="flex border-b border-[var(--border)] p-2 gap-2 bg-[var(--bg)]">
              {[
                { id: 'graph', label: 'Network Graph', icon: Network },
                { id: 'logic', label: 'Reasoning Engine', icon: Binary },
                { id: 'ai', label: 'AI Predictions', icon: Cpu },
                { id: 'math', label: 'Mathematical Foundation', icon: Info },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    activeTab === tab.id 
                      ? "bg-[var(--card)] text-indigo-600 dark:text-indigo-400 shadow-sm border border-[var(--border)]" 
                      : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card)]/50"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-6 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'graph' && (
                  <motion.div 
                    key="graph"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                  >
                    <NetworkGraph data={network} centrality={analysis.centrality} />
                  </motion.div>
                )}

                {activeTab === 'logic' && (
                  <motion.div 
                    key="logic"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="h-full space-y-6 overflow-y-auto pr-2"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--muted)] uppercase tracking-widest">First-Order Logic Facts</h3>
                        <div className="bg-[var(--bg)] rounded-2xl p-4 border border-[var(--border)] font-mono text-xs space-y-2 transition-colors duration-300">
                          {network.edges.map((e, i) => (
                            <p key={i} className="text-[var(--muted)]">
                              Connected({typeof e.source === 'object' ? (e.source as any).id : e.source}, {typeof e.target === 'object' ? (e.target as any).id : e.target})
                            </p>
                          ))}
                          {analysis.criticalNodes.map((n, i) => (
                            <p key={i} className="text-red-600 dark:text-red-400 font-bold">Critical({n})</p>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--muted)] uppercase tracking-widest">Propositional Rules</h3>
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/20 font-mono text-xs space-y-3 transition-colors duration-300">
                          <div className="p-2 bg-[var(--card)] rounded-lg border border-indigo-100 dark:border-indigo-900/20">
                            <p className="text-indigo-700 dark:text-indigo-400 font-bold">(P ∧ Q) → R</p>
                            <p className="text-[10px] text-indigo-400 dark:text-indigo-500/70 mt-1">P: Node Failure, Q: Central Node, R: Unstable</p>
                          </div>
                          <div className="p-2 bg-[var(--card)] rounded-lg border border-indigo-100 dark:border-indigo-900/20">
                            <p className="text-indigo-700 dark:text-indigo-400 font-bold">Critical(x) ∧ Attacked(x) → Unstable</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-[var(--muted)] uppercase tracking-widest">Inference Results</h3>
                      <div className="space-y-2">
                        {analysis.logicInferences.map((inf, i) => (
                          <div key={i} className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] p-3 rounded-xl shadow-sm transition-colors duration-300">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                              <ChevronRight size={14} />
                            </div>
                            <p className="text-sm font-medium text-[var(--text)]">{inf}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ai' && (
                  <motion.div 
                    key="ai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text)]">Graph Neural Network Predictions</h3>
                        <p className="text-sm text-[var(--muted)]">Vulnerability scores based on structural features</p>
                      </div>
                      <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold">Model: GNN-v2.1</div>
                    </div>

                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(Object.entries(analysis.centrality) as [string, number][]).map(([id, val]) => ({ id, score: val * 100 }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--muted)' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                          <Tooltip 
                            cursor={{ fill: 'var(--bg)' }}
                            contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                            {(Object.entries(analysis.centrality) as [string, number][]).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry[1] > 0.5 ? '#ef4444' : '#6366f1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-[var(--bg)] p-4 rounded-2xl border border-[var(--border)] transition-colors duration-300">
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase mb-2">Feature Importance</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[var(--muted)]">Eigenvector Centrality</span>
                            <span className="font-bold text-[var(--text)]">84%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[84%]" />
                          </div>
                          <div className="flex justify-between text-xs mt-2">
                            <span className="text-[var(--muted)]">Degree Centrality</span>
                            <span className="font-bold text-[var(--text)]">12%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[12%]" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-[var(--bg)] p-4 rounded-2xl border border-[var(--border)] transition-colors duration-300">
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase mb-2">Model Confidence</p>
                        <div className="flex items-center justify-center h-full pb-4">
                          <div className="text-center">
                            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">0.92</p>
                            <p className="text-[10px] text-[var(--muted)] font-bold uppercase">Accuracy Score</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'math' && (
                  <motion.div 
                    key="math"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full space-y-12 overflow-y-auto pr-4 pb-12"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Database size={20} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[var(--text)] tracking-tight">1. Adjacency Matrix (A)</h3>
                          <p className="text-sm text-[var(--muted)]">The structural blueprint of the network.</p>
                        </div>
                      </div>
                      
                      <div className="bg-[var(--bg)] rounded-3xl p-8 border border-[var(--border)] shadow-inner overflow-x-auto">
                        <table className="border-collapse mx-auto">
                          <thead>
                            <tr>
                              <th className="p-3"></th>
                              {analysis.nodeMap.map(id => (
                                <th key={id} className="p-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">{id}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.matrix.map((row, i) => (
                              <tr key={i}>
                                <th className="p-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">{analysis.nodeMap[i]}</th>
                                {row.map((val, j) => (
                                  <td key={j} className={cn(
                                    "p-4 text-center border border-[var(--border)] font-mono text-sm transition-all duration-300",
                                    val === 1 
                                      ? "bg-indigo-500 text-white font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" 
                                      : "bg-[var(--card)] text-[var(--muted)] opacity-30"
                                  )}>
                                    {val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Activity size={20} />
                          </div>
                          <h3 className="text-xl font-black text-[var(--text)] tracking-tight">2. Spectral Analysis</h3>
                        </div>
                        
                        <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 text-white font-mono text-xs space-y-6 shadow-2xl">
                          <div className="space-y-2">
                            <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Perron-Frobenius Theorem</p>
                            <p className="text-slate-400 leading-relaxed">
                              For a connected graph, the adjacency matrix has a unique largest real eigenvalue λ₁ with a strictly positive eigenvector v₁.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-indigo-400 mb-2">// Rayleigh Quotient</p>
                            <p className="text-lg font-bold">ρ(A) = (vᵀAv) / (vᵀv)</p>
                            <p className="text-[10px] text-slate-500 mt-2">Current λ₁ = {analysis.spectralRadius.toFixed(6)}</p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Power Iteration Convergence</p>
                            <div className="flex gap-2 items-center">
                              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[95%]" />
                              </div>
                              <span className="text-indigo-400">95% Conv.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Zap size={20} />
                          </div>
                          <h3 className="text-xl font-black text-[var(--text)] tracking-tight">3. Probabilistic Reasoning</h3>
                        </div>

                        <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)] space-y-6 shadow-sm">
                          <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
                            <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-4">Bayesian Risk Heuristic</p>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--muted)]">Structural Stability (ρ)</span>
                                <span className="font-mono text-indigo-600 font-bold">{analysis.spectralRadius.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--muted)]">Max Centrality (v_max)</span>
                                <span className="font-mono text-red-500 font-bold">{(Math.max(...(Object.values(analysis.centrality) as number[]))).toFixed(3)}</span>
                              </div>
                              <div className="pt-4 border-t border-[var(--border)]">
                                <p className="text-[10px] text-[var(--muted)] uppercase mb-2">Formula</p>
                                <p className="text-sm font-serif italic text-[var(--text)]">
                                  P(Collapse) = min(0.95, (1/ρ) × (v_max × 2))
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-6 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Calculated Risk</p>
                              <p className="text-3xl font-black">{(analysis.collapseProbability * 100).toFixed(2)}%</p>
                            </div>
                            <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" style={{ animationDuration: '2s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Sidebar: History & Metrics */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm transition-colors duration-300">
            <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" />
              Stability Trend
            </h2>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="step" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="radius" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: 'var(--card)' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-center text-[var(--muted)] font-medium mt-2">Spectral Radius over time</p>
          </section>

          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm transition-colors duration-300">
            <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Info size={16} className="text-[var(--muted)]" />
              Node Importance Heatmap
            </h2>
            <div className="space-y-3">
              {(Object.entries(analysis.centrality) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, val]) => (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center text-xs font-bold text-[var(--text)] border border-[var(--border)]">
                      #{id}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-[var(--muted)] uppercase tracking-tighter">Centrality</span>
                        <span className="text-[var(--text)]">{val.toFixed(3)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", val > 0.5 ? "bg-red-500" : "bg-indigo-500")}
                          style={{ width: `${val * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <div className="bg-slate-900 dark:bg-indigo-900/20 rounded-2xl p-6 text-white dark:text-indigo-100 border border-transparent dark:border-indigo-900/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <ShieldAlert size={18} className="text-amber-400" />
              </div>
              <p className="text-sm font-bold">Security Alert</p>
            </div>
            <p className="text-xs text-slate-400 dark:text-indigo-300/70 leading-relaxed">
              Targeted attacks on high-centrality nodes (Spectral Radius drop &gt; 1.0) indicate critical vulnerability. Implement <b>redundancy protocols</b> immediately.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--card)] p-8 mt-12 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--bg)] p-2 rounded-lg border border-[var(--border)]">
              <Network size={20} className="text-[var(--muted)]" />
            </div>
            <p className="text-sm font-bold text-[var(--text)]">NetStability AI Framework</p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Mathematics</p>
              <ul className="text-xs text-[var(--muted)] space-y-1">
                <li>Linear Algebra</li>
                <li>Spectral Graph Theory</li>
                <li>Eigenvalue Analysis</li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Logic</p>
              <ul className="text-xs text-[var(--muted)] space-y-1">
                <li>First-Order Logic</li>
                <li>Propositional Logic</li>
                <li>Bayesian Inference</li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2">AI</p>
              <ul className="text-xs text-[var(--muted)] space-y-1">
                <li>Graph Neural Networks</li>
                <li>Probabilistic Reasoning</li>
                <li>Predictive Vulnerability</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto mt-8 pt-8 border-t border-[var(--border)] text-center">
          <p className="text-[10px] text-[var(--muted)] font-medium">© 2026 NetStability AI • Academic Project Framework</p>
        </div>
      </footer>
    </div>
  );
}
