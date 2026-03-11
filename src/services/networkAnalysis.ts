import { create, all } from 'mathjs';

const math = create(all);

export interface Node {
  id: string;
  label?: string;
  type?: string;
  vulnerability?: number;
  centrality?: number;
}

export interface Edge {
  source: string;
  target: string;
  latency?: number; // in ms
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
  laplacian: number[][];
  algebraicConnectivity: number;
  nodeMap: string[];
}

/**
 * Calculates the spectral radius (largest eigenvalue) using Power Iteration.
 */
export function calculateSpectralRadius(matrix: number[][], iterations: number = 50): { radius: number; eigenvector: number[] } {
  const n = matrix.length;
  if (n === 0) return { radius: 0, eigenvector: [] };

  let b_k = new Array(n).fill(0).map(() => Math.random());
  
  for (let i = 0; i < iterations; i++) {
    const b_k1 = new Array(n).fill(0);
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        b_k1[row] += matrix[row][col] * b_k[col];
      }
    }
    const norm = Math.sqrt(b_k1.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) break;
    b_k = b_k1.map(val => val / norm);
  }

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

/**
 * Simplified calculation of Algebraic Connectivity (λ₂ of Laplacian)
 * using a power-iteration-like approach on the deflated Laplacian.
 */
export function calculateAlgebraicConnectivity(laplacian: number[][], iterations: number = 100): number {
  const n = laplacian.length;
  if (n <= 1) return 0;

  // The smallest eigenvalue of L is always 0 with eigenvector [1,1,...1]
  // We need the second smallest. We can use the inverse power method or 
  // shift the matrix. For simplicity in this offline demo, we'll use a 
  // heuristic based on the trace and spectral radius or a simplified iteration.
  // Real implementation would use a proper eigensolver.
  
  // Let's implement a basic version of the Inverse Power Method with shifting
  // to find the smallest non-zero eigenvalue.
  try {
    const matrix = math.matrix(laplacian);
    const { values } = (math as any).eigs(matrix);
    const sortedValues = [...values.toArray()].sort((a, b) => a - b);
    // λ₁ is 0, λ₂ is algebraic connectivity
    return sortedValues[1] || 0;
  } catch (e) {
    return 0;
  }
}

export function buildMatrices(data: NetworkData): { matrix: number[][]; laplacian: number[][]; nodeMap: string[] } {
  const nodeIds = data.nodes.map(n => n.id);
  const n = nodeIds.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  const degree = new Array(n).fill(0);

  data.edges.forEach(edge => {
    const u = nodeIds.indexOf(typeof edge.source === 'object' ? (edge.source as any).id : edge.source);
    const v = nodeIds.indexOf(typeof edge.target === 'object' ? (edge.target as any).id : edge.target);
    if (u !== -1 && v !== -1) {
      matrix[u][v] = 1;
      matrix[v][u] = 1;
      degree[u]++;
      degree[v]++;
    }
  });

  const laplacian = Array.from({ length: n }, (_, i) => 
    Array.from({ length: n }, (_, j) => (i === j ? degree[i] : -matrix[i][j]))
  );

  return { matrix, laplacian, nodeMap: nodeIds };
}

export function performFullAnalysis(data: NetworkData): AnalysisResult {
  const { matrix, laplacian, nodeMap } = buildMatrices(data);
  const { radius, eigenvector } = calculateSpectralRadius(matrix);
  const algebraicConnectivity = calculateAlgebraicConnectivity(laplacian);

  const centrality: Record<string, number> = {};
  eigenvector.forEach((val, idx) => {
    centrality[nodeMap[idx]] = val;
  });

  const sortedNodes = [...nodeMap].sort((a, b) => centrality[b] - centrality[a]);
  const criticalNodes = sortedNodes.slice(0, Math.min(3, nodeMap.length));

  const collapseProbability = Math.min(0.95, (radius > 0 ? 1 / radius : 1) * (criticalNodes.length > 0 ? centrality[criticalNodes[0]] * 2 : 0.5));

  const inferences: string[] = [];
  if (radius > 3) inferences.push("Network is highly connected (Spectral Radius > 3).");
  if (algebraicConnectivity < 0.1) inferences.push("Network is near-partitioned (Low Algebraic Connectivity).");
  if (centrality[criticalNodes[0]] > 0.5) inferences.push(`Node ${criticalNodes[0]} is a single point of failure.`);
  
  return {
    spectralRadius: radius,
    centrality,
    criticalNodes,
    collapseProbability,
    logicInferences: inferences,
    matrix,
    laplacian,
    algebraicConnectivity,
    nodeMap
  };
}

export function simulateAttack(data: NetworkData, type: 'random' | 'targeted' | 'latency_spike', count: number = 1): NetworkData {
  if (type === 'latency_spike') {
    // Increase latency on random edges
    const newEdges = data.edges.map(edge => {
      if (Math.random() < 0.3) { // 30% chance to spike latency
        return { ...edge, latency: (edge.latency || 0) + 500 };
      }
      return edge;
    });
    return { ...data, edges: newEdges };
  }

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

/**
 * Bayesian posterior calculation for node failure
 */
export function calculateBayesianPosterior(nodeId: string, data: NetworkData, centrality: Record<string, number>): number {
  const node = data.nodes.find(n => n.id === nodeId);
  if (!node) return 0;
  
  const degree = data.edges.filter(e => e.source === nodeId || e.target === nodeId).length;
  const prior = 0.05 + 0.35 * (Math.min(degree, 4) / 4);
  const c = centrality[nodeId] || 0.3;
  const likelihood = 1 + c * 2;
  
  const posterior = (prior * likelihood) / (prior * likelihood + (1 - prior));
  return Math.min(posterior, 0.99);
}

/**
 * GNN-inspired risk score calculation
 */
export function calculateGNNRiskScore(nodeId: string, data: NetworkData, centrality: Record<string, number>, collapseProbability: number): number {
  const c = centrality[nodeId] || 0.3;
  const degree = data.edges.filter(e => e.source === nodeId || e.target === nodeId).length;
  const d = Math.min(degree, 4) / 4;
  const pr = collapseProbability; // Using overall collapse probability as a proxy for PR in this simplified model
  const f = calculateBayesianPosterior(nodeId, data, centrality);
  
  const score = 0.88 + (0.27 * c + 0.2 * d + 0.12 * pr + 0.21 * f) * 0.065;
  return Math.min(score, 0.999);
}

