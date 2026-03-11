import { create, all } from 'mathjs';

const math = create(all);

export interface Node {
  id: string;
  label?: string;
  vulnerability?: number;
  centrality?: number;
}

export interface Edge {
  source: string;
  target: string;
}

export interface NetworkData {
  nodes: Node[];
  edges: Edge[];
}

export interface AnalysisResult {
  spectralRadius: number;
  centrality: Record<string, number>;
  criticalNodes: string[];
  collapseProbability: number;
  logicInferences: string[];
  matrix: number[][];
  nodeMap: string[];
}

/**
 * Calculates the spectral radius (largest eigenvalue) using Power Iteration.
 * This is efficient for the largest eigenvalue of a symmetric adjacency matrix.
 */
export function calculateSpectralRadius(matrix: number[][], iterations: number = 50): { radius: number; eigenvector: number[] } {
  const n = matrix.length;
  if (n === 0) return { radius: 0, eigenvector: [] };

  let b_k = new Array(n).fill(0).map(() => Math.random());
  
  for (let i = 0; i < iterations; i++) {
    // b_k+1 = A * b_k
    const b_k1 = new Array(n).fill(0);
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        b_k1[row] += matrix[row][col] * b_k[col];
      }
    }

    // Normalize
    const norm = Math.sqrt(b_k1.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) break;
    b_k = b_k1.map(val => val / norm);
  }

  // Rayleigh quotient for eigenvalue: (b_k.T * A * b_k) / (b_k.T * b_k)
  // Since b_k is normalized, it's just b_k.T * A * b_k
  let radius = 0;
  const Ab_k = new Array(n).fill(0);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      Ab_k[row] += matrix[row][col] * b_k[col];
    }
    radius += b_k[row] * Ab_k[row];
  }

  return { radius, eigenvector: b_k };
}

export function buildAdjacencyMatrix(data: NetworkData): { matrix: number[][]; nodeMap: string[] } {
  const nodeIds = data.nodes.map(n => n.id);
  const n = nodeIds.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

  data.edges.forEach(edge => {
    const u = nodeIds.indexOf(typeof edge.source === 'object' ? (edge.source as any).id : edge.source);
    const v = nodeIds.indexOf(typeof edge.target === 'object' ? (edge.target as any).id : edge.target);
    if (u !== -1 && v !== -1) {
      matrix[u][v] = 1;
      matrix[v][u] = 1; // Undirected
    }
  });

  return { matrix, nodeMap: nodeIds };
}

export function performFullAnalysis(data: NetworkData): AnalysisResult {
  const { matrix, nodeMap } = buildAdjacencyMatrix(data);
  const { radius, eigenvector } = calculateSpectralRadius(matrix);

  const centrality: Record<string, number> = {};
  eigenvector.forEach((val, idx) => {
    centrality[nodeMap[idx]] = val;
  });

  const sortedNodes = [...nodeMap].sort((a, b) => centrality[b] - centrality[a]);
  const criticalNodes = sortedNodes.slice(0, Math.min(3, nodeMap.length));

  // Bayesian-like collapse probability (simplified)
  // P(Collapse) = 1 - e^(-radius/threshold) or similar heuristic
  const collapseProbability = Math.min(0.95, (radius > 0 ? 1 / radius : 1) * (criticalNodes.length > 0 ? centrality[criticalNodes[0]] * 2 : 0.5));

  // Logic Inference
  const inferences: string[] = [];
  if (radius > 3) inferences.push("Network is highly connected (Spectral Radius > 3).");
  if (centrality[criticalNodes[0]] > 0.5) inferences.push(`Node ${criticalNodes[0]} is a single point of failure (Centrality > 0.5).`);
  inferences.push(`Rule: Critical(${criticalNodes[0]}) AND Attacked(${criticalNodes[0]}) → NetworkUnstable`);

  return {
    spectralRadius: radius,
    centrality,
    criticalNodes,
    collapseProbability,
    logicInferences: inferences,
    matrix,
    nodeMap
  };
}

export function simulateAttack(data: NetworkData, type: 'random' | 'targeted', count: number = 1): NetworkData {
  if (data.nodes.length <= count) return { nodes: [], edges: [] };

  let nodesToRemove: string[] = [];
  if (type === 'random') {
    const shuffled = [...data.nodes].sort(() => 0.5 - Math.random());
    nodesToRemove = shuffled.slice(0, count).map(n => n.id);
  } else {
    const { centrality } = performFullAnalysis(data);
    const sorted = Object.entries(centrality).sort((a, b) => b[1] - a[1]);
    nodesToRemove = sorted.slice(0, count).map(n => n[0]);
  }

  const newNodes = data.nodes.filter(n => !nodesToRemove.includes(n.id));
  const newEdges = data.edges.filter(e => !nodesToRemove.includes(e.source) && !nodesToRemove.includes(e.target));

  return { nodes: newNodes, edges: newEdges };
}
