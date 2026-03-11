import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { NetworkData } from '../services/networkAnalysis';

interface NetworkGraphProps {
  data: NetworkData;
  centrality?: Record<string, number>;
  onNodeClick?: (id: string) => void;
}

const NODE_COLOR = {
  server: '#00d4ff',
  router: '#00ff88',
  switch: '#ffaa00',
  client: '#aa88ff',
  database: '#ff6688'
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, centrality, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

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

    const nodes = data.nodes.map(d => ({ ...d }));
    const edges = data.edges.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40));

    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', 'rgba(0, 212, 255, 0.15)')
      .attr('stroke-width', 1.5);

    // Pulse rings for critical nodes
    const pulseRings = g.append('g')
      .selectAll('circle')
      .data(nodes.filter((n: any) => (centrality?.[n.id] || 0) > 0.8))
      .join('circle')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('stroke', (d: any) => NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff')
      .style('animation', 'ring-pulse 2s ease-out infinite');

    const node = g.append('g')
      .selectAll('g.node-group')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        if (onNodeClick) onNodeClick(d.id);
      })
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', (d: any) => 10 + (centrality?.[d.id] || 0.3) * 10)
      .attr('fill', (d: any) => (NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff') + '22')
      .attr('stroke', (d: any) => NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff')
      .attr('stroke-width', 2)
      .style('filter', (d: any) => `drop-shadow(0 0 6px ${NODE_COLOR[d.type as keyof typeof NODE_COLOR] || '#00d4ff'})`);

    node.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-family', 'Share Tech Mono')
      .attr('font-size', '9px')
      .style('pointer-events', 'none')
      .text((d: any) => d.id);

    node.append('text')
      .attr('dy', '2.2em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(200, 230, 255, 0.7)')
      .attr('font-family', 'Rajdhani')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text((d: any) => d.label?.split('-')[0] || d.id);

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
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data, centrality, onNodeClick]);

  return (
    <div className="w-full h-full overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      <style>{`
        @keyframes ring-pulse {
          0%   { r: 14; opacity: 0.8; }
          100% { r: 30; opacity: 0; }
        }
      `}</style>

      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded border border-[var(--border)] shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]"></div>
          <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest font-mono">Network Active</span>
        </div>
        
        <div className="glass p-3 rounded border border-[var(--border)] shadow-sm space-y-2">
          <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest font-mono mb-1">Node Legend</div>
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
