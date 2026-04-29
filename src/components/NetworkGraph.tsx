import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NetworkData } from '../services/networkAnalysis';
import { Info } from 'lucide-react';

interface NetworkGraphProps {
  data: NetworkData;
  centrality?: Record<string, number>;
  onNodeClick?: (id: string) => void;
  onAddEdge?: (sourceId: string, targetId: string) => void;
}

const SHAPE_MAP: Record<string, (size: number) => string> = {
  server: (s) => `M${-s},${-s} L${s},${-s} L${s},${s} L${-s},${s} Z`, // Square
  router: (s) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push(`${s * Math.cos(angle)},${s * Math.sin(angle)}`);
    }
    return `M${points.join(' L')} Z`; // Hexagon
  },
  switch: (s) => `M0,${-s*1.2} L${s*1.2},0 L0,${s*1.2} L${-s*1.2},0 Z`, // Diamond
  client: (s) => `M0,0 m${-s},0 a${s},${s} 0 1,0 ${s * 2},0 a${s},${s} 0 1,0 ${-s * 2},0`, // Circle
  database: (s) => {
    const w = s * 0.8;
    const h = s;
    return `M${-w},${-h} L${w},${-h} L${w},${h} L${-w},${h} Z M${-w},${-h} a${w},${h*0.3} 0 1,0 ${w*2},0 a${w},${h*0.3} 0 1,0 ${-w*2},0`;
  }
};

const NODE_COLOR = {
  server: '#00d4ff',
  router: '#00ff88',
  switch: '#ffaa00',
  client: '#aa88ff',
  database: '#ff6688'
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, centrality, onNodeClick, onAddEdge }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [connSource, setConnSource] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    
    // Add zoom support
    svg.call(d3.zoom<SVGSVGElement, any>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      }));

    // Clone data for D3
    const nodes = data.nodes.map(d => ({ ...d }));
    const edges = data.edges.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(50));

    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', 'rgba(0, 212, 255, 0.2)')
      .attr('stroke-width', 2);

    // Pulse rings for critical nodes
    const pulseRings = g.append('g')
      .selectAll('circle')
      .data(nodes.filter((n: any) => (centrality?.[n.id] || 0) > 0.8))
      .join('circle')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke', (d: any) => NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff')
      .style('animation', 'ring-pulse 2s ease-out infinite');

    const node = g.append('g')
      .selectAll('g.node-group')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        if (connSource) {
          if (connSource !== d.id && onAddEdge) {
            onAddEdge(connSource, d.id);
          }
          setConnSource(null);
        } else {
          if (onNodeClick) onNodeClick(d.id);
          // Set as potential connection source
          setConnSource(d.id);
        }
      })
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Custom Path Shapes
    node.append('path')
      .attr('d', (d: any) => {
        const size = 12 + (centrality?.[d.id] || 0.3) * 12;
        const type = (d.type as string) || 'client';
        return (SHAPE_MAP[type] || SHAPE_MAP.client)(size);
      })
      .attr('fill', (d: any) => (NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff') + '33')
      .attr('stroke', (d: any) => d.id === connSource ? 'var(--accent2)' : (NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff'))
      .attr('stroke-width', (d: any) => d.id === connSource ? 4 : 2)
      .style('filter', (d: any) => `drop-shadow(0 0 8px ${NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff'})`)
      .style('transition', 'stroke-width 0.2s, stroke 0.2s');

    node.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-family', 'Share Tech Mono')
      .attr('font-size', '10px')
      .style('pointer-events', 'none')
      .text((d: any) => d.id);

    node.append('text')
      .attr('dy', '2.5em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(200, 230, 255, 0.8)')
      .attr('font-family', 'Rajdhani')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text((d: any) => d.label?.split('-')[0] || d.id);

    // Global click to cancel connection mode
    svg.on('click', () => setConnSource(null));

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      
      pulseRings
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      // Fixed position (Sticky)
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    return () => simulation.stop();
  }, [data, centrality, onNodeClick, onAddEdge, connSource]);

  return (
    <div className="w-full h-full overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      <style>{`
        @keyframes ring-pulse {
          0%   { r: 14; opacity: 0.8; }
          100% { r: 35; opacity: 0; }
        }
      `}</style>

      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded border border-[var(--border)] shadow-sm">
          <div className={`w-2 h-2 rounded-full ${connSource ? 'bg-[var(--accent2)] shadow-[0_0_6px_var(--accent2)] animate-pulse' : 'bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]'}`}></div>
          <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest font-mono">
            {connSource ? 'Click Target Node to Link' : 'Network Active (Sticky Drag)'}
          </span>
        </div>
        
        <div className="glass p-3 rounded border border-[var(--border)] shadow-sm space-y-2">
          <div className="flex justify-between items-center mb-1">
            <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest font-mono">Node Legend</div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(NODE_COLOR).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
                <span className="text-[9px] text-[var(--muted)] uppercase font-mono">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
