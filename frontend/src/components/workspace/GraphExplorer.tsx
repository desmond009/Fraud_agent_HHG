import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Info,
  X,
  CreditCard,
  User,
  Receipt,
  Smartphone,
  FolderGit2,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SubgraphData, GraphNode, GraphEdge } from '../../types';

interface GraphExplorerProps {
  subgraph: SubgraphData | null;
  loading?: boolean;
}

export const GraphExplorer: React.FC<GraphExplorerProps> = ({ subgraph, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Zoom & Pan transforms
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize nodes with positions around center
  useEffect(() => {
    if (!subgraph || !subgraph.nodes || subgraph.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const width = 600;
    const height = 450;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialNodes: GraphNode[] = subgraph.nodes.map((node, i) => {
      // Circular layout based on entity hierarchy
      let radius = 140;
      let angle = (i / subgraph.nodes.length) * 2 * Math.PI;

      if (node.type === 'Customer') {
        radius = 20;
      } else if (node.type === 'Card') {
        radius = 80;
      } else if (node.type === 'Transaction') {
        radius = 160;
      } else if (node.type === 'DeviceProfile') {
        radius = 210;
      } else if (node.type === 'ClosedCase' || node.type === 'LiveCase') {
        radius = 190;
      }

      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(initialNodes);
    setEdges(subgraph.edges || []);
    setTransform({ x: 40, y: 20, scale: 0.95 });
  }, [subgraph]);

  // Node Dragging inside graph
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Canvas pan
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
      const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: mouseX, y: mouseY } : n))
      );
      return;
    }

    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.4, Math.min(2.5, prev.scale * zoomFactor)),
    }));
  };

  const resetView = () => {
    setTransform({ x: 40, y: 20, scale: 0.95 });
  };

  const getNodeColor = (node: GraphNode) => {
    switch (node.type) {
      case 'Customer':
        return '#3b82f6'; // Blue
      case 'Card':
        return node.attributes?.is_ring ? '#f59e0b' : '#0ea5e9'; // Amber for ring card, Sky for primary
      case 'Transaction':
        return node.attributes?.is_flagged ? '#ef4444' : '#10b981'; // Red for flagged, Green for legitimate
      case 'DeviceProfile':
        return '#ec4899'; // Pink/Magenta for device profile
      case 'ClosedCase':
        return '#a855f7'; // Purple for historical memory
      case 'LiveCase':
        return '#06b6d4'; // Cyan for live case writeback
      default:
        return '#94a3b8';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Customer':
        return <User size={13} color="#fff" />;
      case 'Card':
        return <CreditCard size={13} color="#fff" />;
      case 'Transaction':
        return <Receipt size={13} color="#fff" />;
      case 'DeviceProfile':
        return <Smartphone size={13} color="#fff" />;
      case 'ClosedCase':
        return <FolderGit2 size={13} color="#fff" />;
      case 'LiveCase':
        return <Shield size={13} color="#fff" />;
      default:
        return <Layers size={13} color="#fff" />;
    }
  };

  // Connected nodes highlighting when a node is selected
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const set = new Set<string>([selectedNode.id]);
    edges.forEach((e) => {
      if (e.source === selectedNode.id) set.add(e.target);
      if (e.target === selectedNode.id) set.add(e.source);
    });
    return set;
  }, [selectedNode, edges]);

  return (
    <div
      ref={containerRef}
      className="graph-viewport"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Controls Overlay */}
      <div className="graph-controls">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.2) }))}
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(0.4, prev.scale * 0.8) }))}
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={resetView} title="Fit to View">
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Top Banner Tag */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(13, 21, 36, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          zIndex: 4,
        }}
      >
        <div className="live-dot" />
        <span>TIGERGRAPH SUBGRAPH</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span className="mono" style={{ color: 'var(--text-primary)' }}>
          {nodes.length} Vertices / {edges.length} Edges
        </span>
      </div>

      {/* SVG Canvas */}
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt || src.x === undefined || tgt.x === undefined || src.y === undefined || tgt.y === undefined) return null;



            const isHighlighted =
              selectedNode &&
              (selectedNode.id === edge.source || selectedNode.id === edge.target);

            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={edge.id}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isHighlighted ? '#38bdf8' : '#1e293b'}
                  strokeWidth={isHighlighted ? 2 : 1.2}
                  strokeDasharray={edge.type === 'SHARED_DEVICE' || edge.type === 'NEXT' ? '3,3' : undefined}
                  markerEnd={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow)'}
                />
                {/* Edge Label */}
                <text
                  x={midX}
                  y={midY - 4}
                  fill={isHighlighted ? '#7dd3fc' : '#475569'}
                  fontSize="9px"
                  fontFamily="var(--font-mono)"
                  fontWeight={500}
                  textAnchor="middle"
                  style={{ userSelect: 'none' }}
                >
                  {edge.type}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            if (node.x === undefined || node.y === undefined) return null;
            const isSelected = selectedNode?.id === node.id;
            const isDimmed = selectedNode && !connectedNodeIds.has(node.id);
            const color = getNodeColor(node);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingNodeId(node.id);
                }}
                style={{
                  cursor: 'pointer',
                  opacity: isDimmed ? 0.25 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Glow ring if selected or flagged */}
                {(isSelected || node.attributes?.is_flagged || node.attributes?.is_ring) && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={node.attributes?.is_ring ? '4,4' : undefined}
                    opacity={isSelected ? 0.9 : 0.4}
                  />
                )}

                {/* Main Node Body */}
                <circle
                  r="16"
                  fill="#0b111e"
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  style={{
                    filter: `drop-shadow(0 2px 6px ${color}40)`,
                  }}
                />

                {/* Centered Icon */}
                <foreignObject x="-7" y="-7" width="14" height="14" style={{ pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getNodeIcon(node.type)}
                  </div>
                </foreignObject>

                {/* Node Label Below */}
                <text
                  y="28"
                  fill={isSelected ? '#fff' : '#cbd5e1'}
                  fontSize="10px"
                  fontFamily="var(--font-sans)"
                  fontWeight={isSelected ? 700 : 500}
                  textAnchor="middle"
                  style={{
                    userSelect: 'none',
                    paintOrder: 'stroke',
                    stroke: '#06090f',
                    strokeWidth: '3px',
                    strokeLinejoin: 'round',
                  }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Graph Legend */}
      <div className="graph-legend">
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
          <span>Customer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }} />
          <span>Card</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          <span>Flagged Txn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
          <span>Device</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          <span>Linked Card</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} />
          <span>Prior Case</span>
        </div>
      </div>

      {/* Selected Entity Inspector Side Drawer */}
      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '290px',
            background: 'rgba(11, 17, 28, 0.95)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-drawer)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} color="var(--brand-tiger)" />
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
                ENTITY INSPECTOR
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Node Summary Pill */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card-elevated)',
              border: '1px solid var(--border-default)',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: getNodeColor(selectedNode),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getNodeIcon(selectedNode.type)}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedNode.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {selectedNode.type} Vertex
                </div>
              </div>
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--brand-tiger)', wordBreak: 'break-all' }}>
              ID: {selectedNode.id}
            </div>
          </div>

          {/* Attributes List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              TigerGraph Vertex Attributes:
            </span>

            {Object.keys(selectedNode.attributes || {}).length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No additional attributes.
              </div>
            ) : (
              Object.entries(selectedNode.attributes).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {key.replace('_', ' ')}
                  </span>
                  <span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val)}
                  </span>
                </div>
              ))
            )}

            {/* Connected Graph Edges */}
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Connected Relationships ({edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length}):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {edges
                  .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map((e) => {
                    const otherId = e.source === selectedNode.id ? e.target : e.source;
                    const isOutbound = e.source === selectedNode.id;
                    return (
                      <div
                        key={e.id}
                        style={{
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 6px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <span style={{ color: 'var(--brand-tiger)', fontWeight: 600 }}>{e.type}</span>
                        <ArrowRight size={10} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-secondary)' }}>{otherId}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
