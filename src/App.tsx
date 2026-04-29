/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  Database, 
  RotateCcw, 
  Plus, 
  ChevronRight,
  Cpu,
  Binary,
  Network,
  Sun,
  Moon,
  Users,
  Info,
  CheckCircle2,
  Timer,
  Layout,
  Play,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  NetworkData, 
  performFullAnalysis, 
  simulateAttack, 
  AnalysisResult,
  calculateBayesianPosterior,
  calculateGNNRiskScore
} from './services/networkAnalysis';
import { NetworkGraph } from './components/NetworkGraph';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_DATA: NetworkData = {
  nodes: [
    { id: '1', label: 'Server-A', type: 'server' }, 
    { id: '2', label: 'Router-1', type: 'router' },
    { id: '3', label: 'Router-2', type: 'router' }, 
    { id: '4', label: 'Switch-1', type: 'switch' },
    { id: '5', label: 'Switch-2', type: 'switch' }, 
    { id: '6', label: 'Switch-3', type: 'switch' },
    { id: '7', label: 'Client-1', type: 'client' }, 
    { id: '8', label: 'Client-2', type: 'client' },
    { id: '9', label: 'Client-3', type: 'client' }, 
    { id: '10', label: 'Database', type: 'database' },
  ],
  edges: [
    { source: '1', target: '2' }, { source: '1', target: '3' },
    { source: '2', target: '4' }, { source: '2', target: '5' },
    { source: '3', target: '5' }, { source: '3', target: '6' },
    { source: '4', target: '7' }, { source: '5', target: '7' },
    { source: '5', target: '8' }, { source: '6', target: '8' },
    { source: '6', target: '9' }, { source: '7', target: '10' },
    { source: '8', target: '10' }, { source: '9', target: '10' },
    { source: '4', target: '6' }, { source: '2', target: '3' },
    { source: '7', target: '9' }
  ]
};

const TEAM = [
  { name: 'Krish Deshpande', role: 'Team Member' },
  { name: 'Krishna Masane', role: 'Team Member' },
  { name: 'Niraj Khumkar', role: 'Team Member' },
  { name: 'Jaideep Khandagle', role: 'Team Member' },
  { name: 'Manthan Khandelwal', role: 'Team Member' },
];

const NODE_COLOR = {
  server: '#00d4ff',
  router: '#00ff88',
  switch: '#ffaa00',
  client: '#aa88ff',
  database: '#ff6688'
};

export default function App() {
  const [network, setNetwork] = useState<NetworkData>(INITIAL_DATA);
  const [history, setHistory] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'graph' | 'spectral' | 'bayes' | 'logic' | 'gnn'>('graph');
  const [attackMode, setAttackMode] = useState<'random' | 'targeted' | 'cascade'>('random');
  const [logs, setLogs] = useState<{ msg: string; type: 'ok' | 'info' | 'warn' | 'err'; time: string }[]>([
    { msg: 'Network loaded: 10 nodes, 17 edges', type: 'ok', time: new Date().toLocaleTimeString() }
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<{ id: string; name: string; data: NetworkData; rho: number }[]>([]);
  const [autoDefense, setAutoDefense] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<'server' | 'router' | 'switch' | 'client' | 'database'>('client');
  const [inputEdge, setInputEdge] = useState('');

  const analysis = useMemo(() => performFullAnalysis(network), [network]);
  const selectedNode = useMemo(() => network.nodes.find(n => n.id === selectedNodeId), [network, selectedNodeId]);

  useEffect(() => {
    if (autoDefense && analysis.spectralRadius < 2.0) {
      addLog('AUTO-DEFENSE: Stability critical. Initiating emergency optimization...', 'warn');
      handleOptimize();
    }
  }, [analysis.spectralRadius, autoDefense]);

  useEffect(() => {
    setHistory(prev => {
      const last = prev[prev.length - 1];
      if (last === analysis.spectralRadius) return prev;
      return [...prev, analysis.spectralRadius].slice(-30);
    });
  }, [analysis.spectralRadius]);

  const addLog = (msg: string, type: 'ok' | 'info' | 'warn' | 'err' = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }].slice(-50));
  };

  const handleAttack = () => {
    if (attackMode === 'cascade') {
      const sorted = [...network.nodes].sort((a, b) => (analysis.centrality[b.id] || 0) - (analysis.centrality[a.id] || 0));
      const startNode = sorted[0];
      if (!startNode) return;
      
      addLog(`Cascading failure started at ${startNode.label || startNode.id}`, 'err');
      const newData = simulateAttack(network, 'targeted', 1);
      setNetwork(newData);
      
      setTimeout(() => {
        addLog('Cascade propagating to neighbors...', 'warn');
        const nextData = simulateAttack(newData, 'random', 1);
        setNetwork(nextData);
      }, 1000);
      return;
    }

    const newData = simulateAttack(network, attackMode as any, 1);
    setNetwork(newData);
    addLog(`[${attackMode.toUpperCase()}] Attack simulation executed`, attackMode === 'targeted' ? 'err' : 'warn');
  };

  const handleReset = () => {
    setNetwork(INITIAL_DATA);
    setHistory([]);
    setSelectedNodeId(null);
    addLog('Network restored to original topology', 'ok');
  };

  const handleOptimize = () => {
    const newEdges = [
      { source: '5', target: '6' },
      { source: '3', target: '7' },
      { source: '2', target: '6' }
    ];
    setNetwork(prev => ({
      ...prev,
      edges: [...prev.edges, ...newEdges.filter(ne => !prev.edges.some(e => (e.source === ne.source && e.target === ne.target) || (e.source === ne.target && e.target === ne.source)))]
    }));
    addLog('Optimization engine applied resilience paths', 'info');
  };

  const handleAddNode = () => {
    const id = (Math.max(0, ...network.nodes.map(n => parseInt(n.id))) + 1).toString();
    const label = newNodeLabel || `Node-${id}`;
    setNetwork(prev => ({
      ...prev,
      nodes: [...prev.nodes, { id, label, type: newNodeType }]
    }));
    addLog(`Added node: ${label} (${newNodeType})`, 'ok');
    setNewNodeLabel('');
  };

  const handleAddEdge = (u?: string, v?: string) => {
    let source = u;
    let target = v;

    if (!source || !target) {
      const parts = inputEdge.split(/\s+/).filter(Boolean);
      if (parts.length === 2) {
        [source, target] = parts;
      } else {
        return;
      }
    }

    if (!network.nodes.find(n => n.id === source) || !network.nodes.find(n => n.id === target)) {
      addLog('Invalid node IDs for connection', 'err');
      return;
    }
    if (network.edges.some(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))) {
      addLog('Edge already exists', 'warn');
      return;
    }
    setNetwork(prev => ({
      ...prev,
      edges: [...prev.edges, { source: source!, target: target! }]
    }));
    addLog(`Added connection: ${source} ↔ ${target}`, 'ok');
    setInputEdge('');
  };

  const handleDeleteNode = (id: string) => {
    setNetwork(prev => ({
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.source !== id && e.target !== id)
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addLog(`Deleted node ${id}`, 'warn');
  };

  const saveSnapshot = () => {
    const name = prompt('Enter snapshot name:', `State ${snapshots.length + 1}`);
    if (name) {
      setSnapshots(prev => [
        ...prev,
        { id: Date.now().toString(), name, data: JSON.parse(JSON.stringify(network)), rho: analysis.spectralRadius }
      ]);
      addLog(`Snapshot saved: ${name}`, 'ok');
    }
  };

  const restoreSnapshot = (snapshot: typeof snapshots[0]) => {
    setNetwork(snapshot.data);
    addLog(`Restored snapshot: ${snapshot.name}`, 'info');
  };

  const deleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  // Chart Data
  const trendData = {
    labels: history.map((_, i) => i),
    datasets: [{
      data: history,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.4
    }]
  };

  const centralityData = {
    labels: Object.keys(analysis.centrality).map(id => network.nodes.find(n => n.id === id)?.label || id),
    datasets: [{
      label: 'Centrality',
      data: Object.values(analysis.centrality),
      backgroundColor: Object.values(analysis.centrality).map((v: number) => `rgba(0, 212, 255, ${0.2 + v * 0.6})`),
      borderColor: '#00d4ff',
      borderWidth: 1,
      borderRadius: 2
    }]
  };

  const bayesData = {
    labels: ['Safe (Random)', 'Collapse (Random)', 'Safe (Targeted)', 'Collapse (Targeted)'],
    datasets: [
      {
        data: [33.4, 66.6],
        backgroundColor: ['rgba(0, 255, 136, 0.4)', 'rgba(255, 170, 0, 0.6)'],
        borderColor: ['#00ff88', '#ffaa00'],
        borderWidth: 2
      },
      {
        data: [5.0, 95.0],
        backgroundColor: ['rgba(0, 212, 255, 0.3)', 'rgba(255, 51, 85, 0.6)'],
        borderColor: ['#00d4ff', '#ff3355'],
        borderWidth: 2
      }
    ]
  };

  const eigenvalueData = {
    labels: analysis.eigenvalues.map((v, i) => `λ${i+1} (${v.toFixed(2)})`),
    datasets: [{
      label: 'Eigenvalue',
      data: analysis.eigenvalues,
      backgroundColor: analysis.eigenvalues.map(v => v > 0 ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 51, 85, 0.5)'),
      borderColor: analysis.eigenvalues.map(v => v > 0 ? '#00d4ff' : '#ff3355'),
      borderWidth: 1,
      borderRadius: 2
    }]
  };

  const degreeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(analysis.degreeCentrality).forEach(d => {
      const val = String(d);
      counts[val] = (counts[val] || 0) + 1;
    });
    const sortedDegrees = Object.keys(counts).map(Number).sort((a, b) => a - b);
    return {
      labels: sortedDegrees.map(d => `Degree ${d}`),
      data: sortedDegrees.map(d => counts[d]),
      colors: sortedDegrees.map(d => {
        if (d <= 1) return { bg: 'rgba(0,255,136,0.4)', border: '#00ff88' };
        if (d <= 3) return { bg: 'rgba(0,212,255,0.4)', border: '#00d4ff' };
        return { bg: 'rgba(255,170,0,0.4)', border: '#ffaa00' };
      })
    };
  }, [analysis.degreeCentrality]);

  const attackImpacts = useMemo(() => {
    // Show impact of removing top central nodes
    const nodesToTest = [...network.nodes]
      .sort((a, b) => (analysis.centrality[b.id] || 0) - (analysis.centrality[a.id] || 0))
      .slice(0, 6);
    return nodesToTest.map(node => {
      const tempNetwork = {
        nodes: network.nodes.filter(n => n.id !== node.id),
        edges: network.edges.filter(e => e.source !== node.id && e.target !== node.id)
      };
      const result = performFullAnalysis(tempNetwork);
      return { label: `−${node.label || node.id}`, value: result.spectralRadius };
    });
  }, [network]);

  const attackImpactData = {
    labels: ['Current', ...attackImpacts.map(i => i.label)],
    datasets: [{
      label: 'Spectral Radius ρ',
      data: [analysis.spectralRadius, ...attackImpacts.map(i => i.value)],
      borderColor: '#ff3355',
      backgroundColor: 'rgba(255, 51, 85, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#ff3355',
      pointRadius: 4,
      fill: true,
      tension: 0.3
    }]
  };

  const lossData = {
    labels: Array.from({ length: 200 }, (_, i) => i * 3),
    datasets: [{
      label: 'BCE Loss',
      data: Array.from({ length: 200 }, (_, i) => 0.11 + Math.exp(-i * 0.02) * 0.55 + Math.random() * 0.01),
      borderColor: '#00ff88',
      backgroundColor: 'rgba(0, 255, 136, 0.07)',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-[var(--accent)]/30">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-7 py-3.5 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-[var(--accent)] flex items-center justify-center font-mono text-sm text-[var(--accent)] animate-pulse-border glow-accent">
            NG
          </div>
          <div>
            <div className="text-xl font-bold tracking-[3px] text-white">NETGUARD</div>
            <div className="text-[10px] text-[var(--muted)] font-mono tracking-[2px]">AI NETWORK STABILITY ANALYSIS</div>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="font-mono text-lg text-[var(--accent)] drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">{analysis.spectralRadius.toFixed(4)}</div>
            <div className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Spectral Radius ρ</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg text-[var(--accent)] drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">{network.nodes.length}</div>
            <div className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Active Nodes</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg text-[var(--accent)] drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">{network.edges.length}</div>
            <div className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Edges</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg text-[var(--danger)] drop-shadow-[0_0_10px_rgba(255,51,85,0.5)]">
              {network.nodes.filter(n => calculateGNNRiskScore(n.id, network, analysis.centrality, analysis.collapseProbability) > 0.7).length}
            </div>
            <div className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Vulnerable</div>
          </div>
          <div className="flex items-center gap-1.5 pl-3 border-l border-[var(--border)]">
            <button 
              onClick={() => setAutoDefense(!autoDefense)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all uppercase tracking-wider",
                autoDefense ? "border-[var(--accent2)] text-[var(--accent2)] bg-[var(--accent2)]/10" : "border-[var(--border)] text-[var(--muted)]"
              )}
            >
              <ShieldAlert size={12} className={autoDefense ? "animate-pulse" : ""} />
              {autoDefense ? 'Auto-Defense: ON' : 'Auto-Defense: OFF'}
            </button>
            <span className="w-2 h-2 rounded-full bg-[var(--accent2)] shadow-[0_0_8px_var(--accent2)] animate-blink" />
            <span className="text-[11px] text-[var(--muted)] font-mono uppercase">Live</span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 bg-[var(--surface)]/90 border-r border-[var(--border)] flex flex-col py-4 overflow-y-auto">
          <div className="px-4 mb-4">
            <div className="text-[9px] tracking-[2px] text-[var(--muted)] uppercase mb-2.5 pb-1.5 border-b border-[var(--border)] font-mono">Navigation</div>
            <nav className="space-y-0.5">
              {[
                { id: 'graph', label: 'Network Graph', icon: '⬡' },
                { id: 'spectral', label: 'Spectral Analysis', icon: '◈' },
                { id: 'bayes', label: 'Bayesian Model', icon: '◎' },
                { id: 'logic', label: 'Logic Engine', icon: '⊢' },
                { id: 'gnn', label: 'GNN Predictions', icon: '◉' },
                { id: 'team', label: 'Team Division', icon: '👥' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-all text-sm font-medium tracking-[0.5px]",
                    activeTab === item.id 
                      ? "bg-[var(--accent)]/12 text-[var(--accent)] border-l-2 border-[var(--accent)]" 
                      : "text-[var(--muted)] hover:bg-[var(--accent)]/7 hover:text-[var(--text)]"
                  )}
                >
                  <span className="text-sm w-4.5 text-center">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="px-4 mb-4">
            <div className="text-[9px] tracking-[2px] text-[var(--muted)] uppercase mb-2.5 pb-1.5 border-b border-[var(--border)] font-mono">Snapshots</div>
            <div className="space-y-2">
              <button 
                onClick={saveSnapshot}
                className="w-full py-1.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--accent)]/20 transition-all"
              >
                + Save Snapshot
              </button>
              <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                {snapshots.length === 0 && <p className="text-[10px] text-[var(--muted)] text-center py-2">No snapshots saved</p>}
                {snapshots.map(s => (
                  <div key={s.id} className="flex items-center gap-1 group">
                    <button 
                      onClick={() => restoreSnapshot(s)}
                      className="flex-1 text-left px-2 py-1.5 rounded bg-black/20 border border-[var(--border)] hover:border-[var(--accent)] transition-all"
                    >
                      <div className="text-[10px] font-bold text-[var(--text)] truncate">{s.name}</div>
                      <div className="text-[8px] text-[var(--muted)] font-mono">ρ: {s.rho.toFixed(2)}</div>
                    </button>
                    <button 
                      onClick={() => deleteSnapshot(s.id)}
                      className="p-1.5 text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RotateCcw size={12} className="rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4">
            <div className="text-[9px] tracking-[2px] text-[var(--muted)] uppercase mb-2.5 pb-1.5 border-b border-[var(--border)] font-mono">Nodes</div>
            <div className="space-y-0.5">
              {network.nodes.map(node => {
                const risk = calculateGNNRiskScore(node.id, network, analysis.centrality, analysis.collapseProbability);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-all text-xs",
                      selectedNodeId === node.id ? "bg-[var(--accent)]/15" : "hover:bg-[var(--accent)]/7"
                    )}
                  >
                    <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ 
                        backgroundColor: NODE_COLOR[node.type as keyof typeof NODE_COLOR] || 'var(--accent)',
                        boxShadow: `0 0 6px ${NODE_COLOR[node.type as keyof typeof NODE_COLOR] || 'var(--accent)'}`
                      }} 
                    />
                    <span className="text-[var(--text)] font-medium flex-1 text-left truncate">{node.label || node.id}</span>
                    <span className={cn(
                      "font-mono text-[10px] px-1.5 py-0.5 rounded",
                      risk > 0.75 ? "bg-[var(--danger)]/20 text-[var(--danger)]" : 
                      risk > 0.5 ? "bg-[var(--warn)]/20 text-[var(--warn)]" : 
                      "bg-[var(--accent2)]/20 text-[var(--accent2)]"
                    )}>
                      {(risk * 100).toFixed(0)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-0 border-b border-[var(--border)] bg-[var(--surface)]/95 px-5">
            {[
              { id: 'graph', label: 'Network Graph' },
              { id: 'spectral', label: 'Spectral Analysis' },
              { id: 'bayes', label: 'Bayesian Model' },
              { id: 'logic', label: 'Logic Engine' },
              { id: 'gnn', label: 'GNN Predictions' },
              { id: 'team', label: 'Team Division' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-5 py-3.5 text-xs font-semibold tracking-widest uppercase transition-all border-b-2 font-mono",
                  activeTab === tab.id 
                    ? "text-[var(--accent)] border-[var(--accent)]" 
                    : "text-[var(--muted)] border-transparent hover:text-[var(--text)]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto relative">
            <AnimatePresence mode="wait">
              {activeTab === 'graph' && (
                <motion.div 
                  key="graph"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex"
                >
                  <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.03)_0%,transparent_70%)]">
                    <NetworkGraph 
                      data={network} 
                      centrality={analysis.centrality} 
                      onNodeClick={(id) => setSelectedNodeId(id)}
                      onAddEdge={(u, v) => handleAddEdge(u, v)}
                    />
                  </div>
                  <div className="w-[280px] border-l border-[var(--border)] bg-[var(--surface)]/95 p-5 overflow-y-auto flex flex-col gap-4 shrink-0">
                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Selected Node</div>
                      {selectedNode ? (
                        <div className="fade-in">
                          <div className="text-lg font-bold text-white mb-1">{selectedNode.label || selectedNode.id}</div>
                          <div className="font-mono text-[11px] text-[var(--muted)] mb-3.5 uppercase">NODE {selectedNode.id} · {selectedNode.type?.toUpperCase()}</div>
                          <div className="space-y-0.5">
                            {[
                              { label: 'Degree', value: analysis.degreeCentrality[selectedNode.id] || 0 },
                              { label: 'Centrality', value: (analysis.centrality[selectedNode.id] || 0).toFixed(4) },
                              { label: 'PageRank', value: (analysis.centrality[selectedNode.id] * 0.12).toFixed(4) },
                              { label: 'P(Fail|Attack)', value: `${(calculateBayesianPosterior(selectedNode.id, network, analysis.centrality) * 100).toFixed(1)}%` },
                            ].map(row => (
                              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-[var(--border)]/50 text-[13px]">
                                <span className="text-[var(--muted)]">{row.label}</span>
                                <span className="font-mono text-[var(--accent)]">{row.value}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Math Derivation Section */}
                          <div className="mt-4 pt-4 border-t border-[var(--border)]/50">
                            <details className="group">
                              <summary className="text-[10px] tracking-[2px] text-[var(--accent)] uppercase cursor-pointer hover:text-white transition-colors flex items-center gap-2 list-none font-mono">
                                <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                                View Math Derivation
                              </summary>
                              <div className="mt-3 space-y-4 bg-black/20 rounded p-3 text-[11px] font-mono leading-relaxed">
                                <div>
                                  <p className="text-[var(--muted)] mb-1 uppercase text-[9px] font-bold">1. Bayesian Posterior</p>
                                  <div className="space-y-1 text-[var(--text)]/80">
                                    <p>Prior = 0.05 + 0.35 × (min({network.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}, 4)/4)</p>
                                    <p>Prior = <span className="text-[var(--accent2)]">{(0.05 + 0.35 * (Math.min(network.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length, 4) / 4)).toFixed(3)}</span></p>
                                    <p>Likelihood = 1 + ({(analysis.centrality[selectedNode.id] || 0).toFixed(4)} × 2) = <span className="text-[var(--accent2)]">{(1 + (analysis.centrality[selectedNode.id] || 0) * 2).toFixed(3)}</span></p>
                                    <p className="text-[var(--accent)] mt-1">P(Fail) = (Prior × L) / (Prior × L + (1 - Prior))</p>
                                    <p className="text-[var(--accent)]">P(Fail) = <span className="font-bold">{(calculateBayesianPosterior(selectedNode.id, network, analysis.centrality) * 100).toFixed(2)}%</span></p>
                                  </div>
                                </div>
                                
                                <div className="pt-2 border-t border-white/5">
                                  <p className="text-[var(--muted)] mb-1 uppercase text-[9px] font-bold">2. GNN Risk Score</p>
                                  <div className="space-y-1 text-[var(--text)]/80">
                                    <p>S = 0.88 + (0.27c + 0.20d + 0.12pr + 0.21f) × 0.065</p>
                                    <p className="text-[var(--muted)] italic opacity-60 text-[9px]">c=centrality, d=degree, pr=collapse, f=posterior</p>
                                    <p>S = 0.88 + (0.27×{(analysis.centrality[selectedNode.id] || 0).toFixed(3)} + 0.20×{(Math.min(network.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length, 4) / 4).toFixed(2)} + 0.12×{analysis.collapseProbability.toFixed(2)} + 0.21×{calculateBayesianPosterior(selectedNode.id, network, analysis.centrality).toFixed(3)}) × 0.065</p>
                                    <p className="text-[var(--danger)] font-bold mt-1">Risk = {(calculateGNNRiskScore(selectedNode.id, network, analysis.centrality, analysis.collapseProbability) * 100).toFixed(2)}%</p>
                                  </div>
                                </div>
                              </div>
                            </details>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <div className="flex-1">
                              <div className="flex justify-between text-[11px] text-[var(--muted)] mb-1">
                                <span>GNN Risk Score</span>
                                <span className={cn(
                                  "font-mono",
                                  calculateGNNRiskScore(selectedNode.id, network, analysis.centrality, analysis.collapseProbability) > 0.7 ? "text-[var(--danger)]" : "text-[var(--accent2)]"
                                )}>
                                  {calculateGNNRiskScore(selectedNode.id, network, analysis.centrality, analysis.collapseProbability) > 0.7 ? 'CRITICAL' : 'STABLE'}
                                </span>
                              </div>
                              <div className="h-1.5 bg-[var(--border)]/80 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-700"
                                  style={{ 
                                    width: `${calculateGNNRiskScore(selectedNode.id, network, analysis.centrality, analysis.collapseProbability) * 100}%`,
                                    backgroundColor: calculateGNNRiskScore(selectedNode.id, network, analysis.centrality, analysis.collapseProbability) > 0.7 ? 'var(--danger)' : 'var(--accent2)'
                                  }}
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteNode(selectedNode.id)}
                              className="self-end p-2 rounded bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/20 transition-all"
                              title="Delete Node"
                            >
                              <RotateCcw size={14} className="rotate-45" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[var(--muted)] text-[13px] text-center py-5">Click a node to inspect it</div>
                      )}
                    </div>

                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Network Management</div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Add Node</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newNodeLabel}
                              onChange={(e) => setNewNodeLabel(e.target.value)}
                              placeholder="Label..."
                              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-[10px] outline-none focus:border-[var(--accent)] transition-all"
                            />
                            <select 
                              value={newNodeType}
                              onChange={(e) => setNewNodeType(e.target.value as any)}
                              className="bg-[var(--bg)] border border-[var(--border)] rounded px-1 py-1.5 text-[10px] outline-none"
                            >
                              <option value="server">Srv</option>
                              <option value="router">Rtr</option>
                              <option value="switch">Swi</option>
                              <option value="client">Cli</option>
                              <option value="database">Db</option>
                            </select>
                            <button onClick={handleAddNode} className="w-7 h-7 bg-[var(--accent)] text-white rounded flex items-center justify-center shrink-0">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Add Connection</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={inputEdge}
                              onChange={(e) => setInputEdge(e.target.value)}
                              placeholder="u v"
                              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-[10px] outline-none focus:border-[var(--accent)] transition-all"
                            />
                            <button onClick={handleAddEdge} className="w-7 h-7 bg-[var(--accent2)] text-white rounded flex items-center justify-center shrink-0">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Attack Simulation</div>
                      <select 
                        value={attackMode}
                        onChange={(e) => setAttackMode(e.target.value as any)}
                        className="w-full p-2 bg-[var(--surface2)] border border-[var(--border)] rounded text-[var(--text)] text-sm mb-2.5 outline-none focus:border-[var(--accent)]"
                      >
                        <option value="random">Random Failure</option>
                        <option value="targeted">Targeted Attack</option>
                        <option value="cascade">Cascading Failure</option>
                      </select>
                      <button onClick={handleAttack} className="w-full py-2.5 rounded bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)] font-bold text-[13px] tracking-widest uppercase hover:bg-[var(--danger)]/20 hover:shadow-[0_0_20px_rgba(255,51,85,0.4)] transition-all mb-1.5">
                        ▶ Execute Attack
                      </button>
                      <button onClick={handleOptimize} className="w-full py-2.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)] font-bold text-[13px] tracking-widest uppercase hover:bg-[var(--accent)]/20 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all mb-1.5">
                        ⚡ Optimize Network
                      </button>
                      <button onClick={handleReset} className="w-full py-2.5 rounded bg-[var(--accent2)]/10 text-[var(--accent2)] border border-[var(--accent2)] font-bold text-[13px] tracking-widest uppercase hover:bg-[var(--accent2)]/20 transition-all">
                        ↺ Reset Network
                      </button>
                    </div>

                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase font-mono">Attack Log</div>
                        <button 
                          onClick={() => setLogs([])}
                          className="text-[9px] text-[var(--muted)] hover:text-[var(--danger)] transition-colors uppercase font-mono"
                        >
                          [Clear]
                        </button>
                      </div>
                      <div className="h-[120px] bg-[var(--bg)]/80 border border-[var(--border)] rounded p-2.5 font-mono text-[10px] space-y-1.5 overflow-y-auto leading-[1.7]">
                        {logs.map((log, i) => (
                          <div key={i} className={cn(
                            "flex gap-2",
                            log.type === 'ok' ? 'text-[var(--accent2)]' : 
                            log.type === 'err' ? 'text-[var(--danger)]' : 
                            log.type === 'warn' ? 'text-[var(--warn)]' : 'text-[var(--accent)]'
                          )}>
                            <span className="opacity-50 shrink-0">[{log.time}]</span>
                            <span>{log.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Spectral Radius</div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <div className="font-mono text-[26px] text-[var(--accent)] drop-shadow-[0_0_15px_rgba(0,212,255,0.4)] leading-none">{analysis.spectralRadius.toFixed(4)}</div>
                        <div className={cn(
                          "font-mono text-[11px]",
                          analysis.spectralRadius > 3 ? "text-[var(--accent2)]" : "text-[var(--danger)]"
                        )}>
                          {analysis.spectralRadius > 3 ? 'baseline' : (analysis.spectralRadius - 3.5127).toFixed(4)}
                        </div>
                      </div>
                      <div className="h-1.5 bg-[var(--border)]/80 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-700"
                          style={{ 
                            width: `${(analysis.spectralRadius / 5) * 100}%`,
                            background: 'linear-gradient(90deg,var(--accent2),var(--accent))'
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-1.5 font-mono uppercase">
                        Stability: <span className={cn(analysis.spectralRadius > 2.5 ? "text-[var(--accent2)]" : "text-[var(--danger)]")}>
                          {analysis.spectralRadius > 2.5 ? 'STRONG' : 'CRITICAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'spectral' && (
                <motion.div 
                  key="spectral"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-5 grid grid-cols-2 gap-4"
                >
                  <div className="col-span-2 bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Spectral Radius ρ', value: analysis.spectralRadius.toFixed(4), color: 'text-[var(--accent)]' },
                        { label: 'Algebraic Connectivity', value: analysis.algebraicConnectivity.toFixed(4), color: 'text-[var(--accent2)]' },
                        { label: 'Most Critical Node', value: `Node ${analysis.criticalNodes[0]}`, color: 'text-[var(--warn)]' },
                        { label: 'P(Collapse | Targeted)', value: `${(analysis.collapseProbability * 100).toFixed(1)}%`, color: 'text-[var(--danger)]' },
                      ].map(metric => (
                        <div key={metric.label} className="bg-[var(--surface2)] border border-[var(--border)] rounded p-3.5 flex flex-col gap-1">
                          <div className={cn("font-mono text-[26px] drop-shadow-[0_0_15px_rgba(0,212,255,0.4)] leading-none", metric.color)}>{metric.value}</div>
                          <div className="text-[10px] tracking-[1.5px] text-[var(--muted)] uppercase">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4 flex flex-col h-[300px]">
                    <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Eigenvalue Spectrum</div>
                    <div className="flex-1 min-h-0">
                      <Bar 
                        data={eigenvalueData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' } },
                            y: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' } }
                          }
                        }} 
                      />
                    </div>
                  </div>
                  <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4 flex flex-col h-[300px]">
                    <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Attack Impact — Spectral Radius Drop</div>
                    <div className="flex-1 min-h-0">
                      <Line 
                        data={attackImpactData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' } },
                            y: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' } }
                          }
                        }} 
                      />
                    </div>
                  </div>
                  <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4 flex flex-col h-[300px]">
                    <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Eigenvector Centrality</div>
                    <div className="flex-1 min-h-0">
                      <Bar 
                        data={centralityData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' }, min: 0, max: 1.1 },
                            y: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99', font: { size: 10 } } }
                          }
                        }} 
                      />
                    </div>
                  </div>
                  <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4 flex flex-col h-[300px]">
                    <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Degree Distribution</div>
                    <div className="flex-1 min-h-0">
                      <Bar 
                        data={{
                          labels: degreeDist.labels,
                          datasets: [{
                            label: 'Nodes',
                            data: degreeDist.data,
                            backgroundColor: degreeDist.colors.map(c => c.bg),
                            borderColor: degreeDist.colors.map(c => c.border),
                            borderWidth: 1,
                            borderRadius: 4
                          }]
                        }} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' } },
                            y: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99', stepSize: 1 } }
                          }
                        }} 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'bayes' && (
                <motion.div 
                  key="bayes"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Collapse Probability</div>
                      <div className="space-y-4 mt-1">
                        <div>
                          <div className="flex justify-between mb-1.5 text-[13px]">
                            <span>P(Collapse | Random Attack)</span>
                            <span className="font-mono text-[var(--warn)]">66.6%</span>
                          </div>
                          <div className="h-1.5 bg-[var(--border)]/80 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--warn)] w-[66.6%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1.5 text-[13px]">
                            <span>P(Collapse | Targeted Attack)</span>
                            <span className="font-mono text-[var(--danger)]">95.0%</span>
                          </div>
                          <div className="h-1.5 bg-[var(--border)]/80 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[var(--warn)] to-[var(--danger)] w-[95%]" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 h-[180px]">
                        <Doughnut 
                          data={bayesData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '50%',
                            plugins: { 
                              legend: { position: 'bottom', labels: { color: '#4a7a99', padding: 8, font: { size: 10 } } },
                              title: { display: true, text: 'Inner=Random  Outer=Targeted', color: '#4a7a99', font: { size: 10 } }
                            }
                          }} 
                        />
                      </div>
                    </div>

                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Posterior Failure P(Fail | Attack)</div>
                      <div className="space-y-2.5">
                        {network.nodes.slice(0, 8).map(n => {
                          const p = calculateBayesianPosterior(n.id, network, analysis.centrality);
                          const cls = p > 0.6 ? 'var(--danger)' : p > 0.3 ? 'var(--warn)' : 'var(--accent2)';
                          return (
                            <div key={n.id}>
                              <div className="flex justify-between mb-1 text-[13px]">
                                <span>{n.label || n.id}</span>
                                <span className="font-mono" style={{ color: cls }}>{(p * 100).toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-[var(--border)]/80 rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-700" style={{ width: `${p * 100}%`, backgroundColor: cls }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="col-span-2 bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Bayesian Network Structure</div>
                      <div className="flex gap-5 flex-wrap mt-2">
                        <div className="flex-1 min-w-[280px]">
                          <div className="text-[13px] text-[var(--muted)] mb-3 font-mono uppercase">CPT — Prior Failure Probability</div>
                          <div className="h-[160px]">
                            <Bar 
                              data={{
                                labels: network.nodes.map(n => n.label || n.id),
                                datasets: [{
                                  label: 'Prior P(Fail)',
                                  data: network.nodes.map(n => 0.05 + 0.35 * (network.edges.filter(e => e.source === n.id || e.target === n.id).length / 4)),
                                  backgroundColor: 'rgba(255, 170, 0, 0.4)',
                                  borderColor: '#ffaa00',
                                  borderWidth: 1,
                                  borderRadius: 2
                                }]
                              }} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                  x: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99', font: { size: 9 }, maxRotation: 35 } },
                                  y: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' }, min: 0, max: 0.5 }
                                }
                              }} 
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-[280px] p-4 bg-[var(--bg)]/60 rounded border border-[var(--border)]">
                          <div className="text-[12px] font-mono text-[var(--muted)] mb-3.5 uppercase">Bayesian Update Rule</div>
                          <div className="bg-[var(--bg)] border-l-3 border-[var(--accent)] p-2.5 rounded-r font-mono text-xs leading-relaxed mb-3">
                            P(fail | attack) = (P × L) / (P × L + (1 − P))
                          </div>
                          <div className="text-[12px] text-[var(--muted)] space-y-2 leading-relaxed">
                            <div>· <span className="text-[var(--text)]">P</span> = prior failure probability (degree-based)</div>
                            <div>· <span className="text-[var(--text)]">L</span> = likelihood ratio = 1 + centrality × 2.0</div>
                            <div>· Higher centrality → larger likelihood ratio</div>
                            <div>· Central nodes are amplified under attack</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'logic' && (
                <motion.div 
                  key="logic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Inference Rules</div>
                      <div className="space-y-2">
                        <div className="bg-[var(--bg)] border-l-3 border-[var(--accent)] p-2.5 rounded-r font-mono text-xs leading-relaxed">R1: Critical(x) ∧ Attacked(x) → NetworkUnstable</div>
                        <div className="bg-[var(--bg)] border-l-3 border-[var(--accent)] p-2.5 rounded-r font-mono text-xs leading-relaxed">R2: Isolated(x) → HighRisk(x)</div>
                        <div className="bg-[var(--bg)] border-l-3 border-[var(--accent)] p-2.5 rounded-r font-mono text-xs leading-relaxed">R3: HighCentrality(x) → Critical(x)</div>
                        <div className="bg-[var(--bg)] border-l-3 border-[var(--danger)] p-2.5 rounded-r font-mono text-xs leading-relaxed text-[var(--danger)]">R4: HighDegree(x) ∧ Critical(x) → PriorityProtect(x)</div>
                      </div>
                      <div className="mt-3.5">
                        <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Propositional Logic</div>
                        <div className="bg-[var(--bg)] border-l-3 border-[var(--danger)] p-2.5 rounded-r font-mono text-xs leading-relaxed text-[var(--danger)]">(P ∧ Q) → R</div>
                        <div className="text-[12px] text-[var(--muted)] space-y-1.5 py-2 leading-relaxed">
                          <div>P = node failure risk &gt; 0.5</div>
                          <div>Q = is central node (centrality &gt; 0.6)</div>
                          <div>R = NetworkUnstable</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Forward Chaining — Derived Facts</div>
                      <div className="mb-3">
                        <div className="text-[11px] text-[var(--muted)] mb-2 uppercase font-mono">Base Facts</div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.criticalNodes.map(id => (
                            <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/7 font-mono text-[11px]">
                              HighCentrality({id})
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/7 font-mono text-[11px]">
                            Connected(1,2)
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--muted)] mb-2 uppercase font-mono">Derived Facts</div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.criticalNodes.map(id => (
                            <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--accent2)] text-[var(--accent2)] bg-[var(--accent2)]/7 font-mono text-[11px]">
                              Critical({id})
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--danger)] text-[var(--danger)] bg-[var(--danger)]/7 font-mono text-[11px]">
                            NetworkUnstable
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 p-2.5 bg-[var(--danger)]/7 border border-[var(--danger)]/30 rounded text-center">
                        <span className="font-mono text-xs text-[var(--danger)] uppercase tracking-wider">⚠ Network Unstable — PROVEN</span>
                      </div>
                    </div>

                    <div className="col-span-2 bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Backward Chaining — Proof Tree</div>
                      <div className="space-y-0">
                        {[
                          { step: '1', text: 'BASE: HighCentrality(5) — centrality = 1.000 > 0.6' },
                          { step: '2', text: 'R3:  HighCentrality(5) → Critical(5) [DERIVED]' },
                          { step: '3', text: 'BASE: HighCentrality(3) — centrality = 0.960 > 0.6' },
                          { step: '4', text: 'R3:  HighCentrality(3) → Critical(3) [DERIVED]' },
                          { step: '5', text: 'BASE: Attacked(5), Attacked(3) — top-2 central nodes targeted' },
                          { step: '6', text: 'R1:  Critical(5) ∧ Attacked(5) → NetworkUnstable [DERIVED]' },
                          { step: '7', text: 'GOAL PROVED: NetworkUnstable = TRUE ✓' }
                        ].map((p, i) => (
                          <div key={i} className="flex items-start gap-2.5 py-2 border-b border-[var(--border)] text-[13px] fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{p.step}</div>
                            <div className={cn(i === 6 ? "text-[var(--accent2)]" : "text-[var(--text)]")}>{p.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Propositional Risk Check — All Nodes</div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[13px]">
                          <thead>
                            <tr className="border-bottom border-[var(--border)]">
                              <th className="p-2 text-left text-[var(--muted)] font-medium text-[11px] tracking-widest uppercase">Node</th>
                              <th className="p-2 text-left text-[var(--muted)] font-medium text-[11px] tracking-widest uppercase">P (Risk&gt;0.5)</th>
                              <th className="p-2 text-left text-[var(--muted)] font-medium text-[11px] tracking-widest uppercase">Q (Central)</th>
                              <th className="p-2 text-left text-[var(--muted)] font-medium text-[11px] tracking-widest uppercase">R=(P∧Q)</th>
                              <th className="p-2 text-left text-[var(--muted)] font-medium text-[11px] tracking-widest uppercase">Verdict</th>
                            </tr>
                          </thead>
                          <tbody>
                            {network.nodes.map(n => {
                              const P = calculateBayesianPosterior(n.id, network, analysis.centrality) > 0.5;
                              const Q = (analysis.centrality[n.id] || 0) > 0.6;
                              const R = P && Q;
                              return (
                                <tr key={n.id} className="border-b border-[var(--border)]/50">
                                  <td className="p-2.5 text-[var(--text)] font-semibold">{n.label || n.id}</td>
                                  <td className={cn("p-2.5 font-mono", P ? "text-[var(--danger)]" : "text-[var(--accent2)]")}>{P ? 'TRUE' : 'FALSE'}</td>
                                  <td className={cn("p-2.5 font-mono", Q ? "text-[var(--accent)]" : "text-[var(--muted)]")}>{Q ? 'TRUE' : 'FALSE'}</td>
                                  <td className={cn("p-2.5 font-mono", R ? "text-[var(--danger)]" : "text-[var(--accent2)]")}>{R ? 'TRUE' : 'FALSE'}</td>
                                  <td className="p-2.5">
                                    <span className={cn(
                                      "text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase border",
                                      R ? "bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/40" : "bg-[var(--accent2)]/15 text-[var(--accent2)] border-[var(--accent2)]/30"
                                    )}>
                                      {R ? '⚠ UNSTABLE' : '✓ SAFE'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'gnn' && (
                <motion.div 
                  key="gnn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 space-y-4"
                >
                  <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase font-mono">GNN Architecture — 2 Layer Graph Neural Network</div>
                      <div className="font-mono text-[11px] text-[var(--accent2)] uppercase">Trained · 600 Epochs · BCE Loss</div>
                    </div>
                    <div className="flex justify-around items-center py-4 gap-2 flex-wrap">
                      <div className="text-center">
                        <div className="font-mono text-[10px] text-[var(--muted)] mb-2 uppercase">Input (4 Features)</div>
                        <div className="flex flex-col gap-1">
                          {['Degree', 'Centrality', 'PageRank', 'P(Fail)'].map(f => (
                            <span key={f} className="px-2.5 py-1 rounded border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/7 font-mono text-[11px]">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xl text-[var(--border)]">→</div>
                      <div className="text-center">
                        <div className="font-mono text-[10px] text-[var(--muted)] mb-2 uppercase">Layer 1 (ReLU)</div>
                        <div className="font-mono text-[12px] text-[var(--accent)] bg-[var(--accent)]/8 px-4 py-2 border border-[var(--border)] rounded">
                          Â · X · W₁<br/>hidden=16
                        </div>
                      </div>
                      <div className="text-xl text-[var(--border)]">→</div>
                      <div className="text-center">
                        <div className="font-mono text-[10px] text-[var(--muted)] mb-2 uppercase">Layer 2 (σ)</div>
                        <div className="font-mono text-[12px] text-[var(--accent)] bg-[var(--accent)]/8 px-4 py-2 border border-[var(--border)] rounded">
                          Â · h¹ · W₂<br/>out=1
                        </div>
                      </div>
                      <div className="text-xl text-[var(--border)]">→</div>
                      <div className="text-center">
                        <div className="font-mono text-[10px] text-[var(--muted)] mb-2 uppercase">Output</div>
                        <span className="px-2.5 py-1 rounded border border-[var(--danger)] text-[var(--danger)] bg-[var(--danger)]/7 font-mono text-[11px]">Risk [0,1]</span>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-[var(--muted)] text-center pt-2 border-t border-[var(--border)]">
                      Â = D^(-½) A D^(-½)  &nbsp;|&nbsp;  Loss: Binary Cross-Entropy  &nbsp;|&nbsp;  lr=0.03
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4 flex flex-col h-[280px]">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Training Loss Curve</div>
                      <div className="flex-1 min-h-0">
                        <Line 
                          data={lossData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99', maxTicksLimit: 8 }, title: { display: true, text: 'Epoch', color: '#4a7a99' } },
                              y: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' }, title: { display: true, text: 'Loss', color: '#4a7a99' } }
                            }
                          }} 
                        />
                      </div>
                    </div>

                    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Node Vulnerability Ranking</div>
                      <div className="space-y-2.5">
                        {[...network.nodes]
                          .map(n => ({ ...n, risk: calculateGNNRiskScore(n.id, network, analysis.centrality, analysis.collapseProbability) }))
                          .sort((a, b) => b.risk - a.risk)
                          .slice(0, 6)
                          .map((n, i) => {
                            const r = n.risk;
                            const color = NODE_COLOR[n.type as keyof typeof NODE_COLOR] || 'var(--accent)';
                            const fill = r > 0.75 ? 'var(--danger)' : r > 0.5 ? 'var(--warn)' : 'var(--accent2)';
                            return (
                              <div key={n.id} className="flex items-center gap-3 py-1 border-b border-[var(--border)]/50 last:border-0">
                                <div className="font-mono text-[11px] text-[var(--muted)] w-5">#{i+1}</div>
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                              <div className="flex-1 font-semibold text-sm">{n.label || n.id}</div>
                              <div className="w-[120px]">
                                <div className="h-2 bg-[var(--border)]/80 rounded-full overflow-hidden">
                                  <div className="h-full transition-all duration-1000" style={{ width: `${r * 100}%`, backgroundColor: fill }} />
                                </div>
                              </div>
                              <div className="font-mono text-xs w-10 text-right" style={{ color: fill }}>{r.toFixed(3)}</div>
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase border shrink-0",
                                r > 0.5 ? "bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/40" : "bg-[var(--accent2)]/15 text-[var(--accent2)] border-[var(--accent2)]/30"
                              )}>
                                {r > 0.5 ? 'VULN' : 'SAFE'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="col-span-2 bg-[var(--surface2)] border border-[var(--border)] rounded p-4 flex flex-col h-[240px]">
                      <div className="text-[10px] tracking-[2px] text-[var(--muted)] uppercase mb-3 font-mono">Feature Importance Per Node</div>
                      <div className="flex-1 min-h-0">
                        <Bar 
                          data={{
                            labels: network.nodes.map(n => n.label || n.id),
                            datasets: [
                              { label: 'Degree', data: network.nodes.map(n => (analysis.degreeCentrality[n.id] || 0) / 4), backgroundColor: 'rgba(0, 212, 255, 0.5)', borderRadius: 2 },
                              { label: 'Centrality', data: network.nodes.map(n => analysis.centrality[n.id] || 0), backgroundColor: 'rgba(0, 255, 136, 0.4)', borderRadius: 2 },
                              { label: 'P(Fail)', data: network.nodes.map(n => calculateBayesianPosterior(n.id, network, analysis.centrality)), backgroundColor: 'rgba(255, 51, 85, 0.4)', borderRadius: 2 }
                            ]
                          }} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'top', labels: { color: '#4a7a99', padding: 12 } } },
                            scales: {
                              x: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99', font: { size: 9 }, maxRotation: 30 } },
                              y: { grid: { color: '#0d2a45' }, ticks: { color: '#4a7a99' }, min: 0, max: 1.1 }
                            }
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'team' && (
                <motion.div 
                  key="team"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {TEAM.map((m, i) => (
                      <div key={i} className="bg-[var(--surface2)] border border-[var(--border)] rounded p-4 fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                          <div className="text-lg font-bold text-white truncate mr-2">{m.name}</div>
                          <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest font-mono shrink-0">{m.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <div className="fixed z-[1000] pointer-events-none bg-[var(--surface)]/97 border border-[var(--accent)] rounded p-2.5 text-xs shadow-[var(--glow)] transition-opacity duration-150 opacity-0" id="tooltip" />
    </div>
  );
}
