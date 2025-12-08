
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Database, Eraser, FunctionSquare, Clock, Layers, Cpu, Target,
  X, ZoomIn, ZoomOut, Maximize, Minimize, Save, Trash2, Undo2, Redo2, Grip
} from 'lucide-react';
import { fetchPipelinePlan, uploadDatasetFeatures } from '../services/api'; // UPDATED IMPORT

// ... (existing imports)

// ... inside component ...

import { Node, Edge, NodeType, PipelineSchema } from '../types';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- VISUAL CONTRACT (Section VIII.A) ---

const NODE_VISUALS: Record<NodeType, { color: string, icon: React.ReactNode, border: string, bg: string }> = {
  source: {
    color: 'text-sky-600',
    icon: <Database size={16} />,
    border: 'border-sky-500/50',
    bg: 'bg-sky-500/10'
  },
  cleaning: {
    color: 'text-teal-600',
    icon: <Eraser size={16} />,
    border: 'border-teal-500/50',
    bg: 'bg-teal-500/10'
  },
  transform: {
    color: 'text-amber-600',
    icon: <FunctionSquare size={16} />,
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10'
  },
  temporal: {
    color: 'text-orange-600',
    icon: <Clock size={16} />,
    border: 'border-orange-500/50',
    bg: 'bg-orange-500/10'
  },
  aggregation: {
    color: 'text-rose-600',
    icon: <Layers size={16} />,
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10'
  },
  model: {
    color: 'text-blue-600',
    icon: <Cpu size={16} />,
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10'
  },
  output: {
    color: 'text-emerald-600',
    icon: <Target size={16} />,
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10'
  },
};

// Initial Mock Data compliant with Schema
const RAW_NODES: Node[] = [
  {
    id: 'raw_wind',
    type: 'source',
    label: 'Wind Sensor Array',
    description: 'Telemetry from 4 major stations',
    position: { x: 100, y: 100 },
    connect_from: [],
    config: { source_name: 'Sensor_Array_A', format: 'api', refresh_rate: 'realtime' }
  },
  {
    id: 'raw_temp',
    type: 'source',
    label: 'IMD Temperature',
    description: 'Ambient temp data',
    position: { x: 100, y: 240 },
    connect_from: [],
    config: { source_name: 'IMD_Station', format: 'database', refresh_rate: 'hourly' }
  },
  {
    id: 'raw_sat',
    type: 'source',
    label: 'Sentinel-5P AOD',
    description: 'Satellite Aerosol Optical Depth',
    position: { x: 100, y: 380 },
    connect_from: [],
    config: { source_name: 'Sentinel-5P', format: 'satellite', refresh_rate: 'daily' }
  },
];

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface FeaturesProps {
  pendingPrompt: string | null;
  onClearPrompt: () => void;
  onLog: (message: string) => void;
  onProgress: (percent: number) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const Features: React.FC<FeaturesProps> = ({
  pendingPrompt,
  onClearPrompt,
  onLog,
  onProgress,
  isFullScreen,
  onToggleFullScreen
}) => {
  // Canvas State with Persistence
  const [nodes, setNodes] = useState<Node[]>(() => {
    const saved = localStorage.getItem('aero_features_nodes_v2');
    return saved ? JSON.parse(saved) : RAW_NODES;
  });
  const [edges, setEdges] = useState<Edge[]>(() => {
    const saved = localStorage.getItem('aero_features_edges_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  // History Stack
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: RAW_NODES, edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // File Upload Handler
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onLog(`Uploading ${file.name}...`);
    onProgress(20);

    try {
      const schema = await uploadDatasetFeatures(file);
      onProgress(60);

      // Update Canvas
      setNodes(schema.nodes);
      setEdges(schema.edges);
      saveToHistory(schema.nodes, schema.edges);

      onLog(`Analysis complete. Generated ${schema.nodes.length} feature nodes.`);
      onProgress(100);
      setTimeout(() => onProgress(0), 1000);
    } catch (e: any) {
      onLog(`Error: ${e.message}`);
      onProgress(0);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Interaction State
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const dragDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('aero_features_nodes_v2', JSON.stringify(nodes));
  }, [nodes]);
  useEffect(() => {
    localStorage.setItem('aero_features_edges_v2', JSON.stringify(edges));
  }, [edges]);

  // Handle Incoming Prompts
  useEffect(() => {
    if (pendingPrompt) {
      handleGenerate(pendingPrompt);
      onClearPrompt();
    }
  }, [pendingPrompt]);

  const saveToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const currentState = { nodes: newNodes, edges: newEdges };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    if (confirm("Are you sure you want to clear the entire canvas? This cannot be undone easily (unless you use undo).")) {
      setNodes([]);
      setEdges([]);
      saveToHistory([], []);
      onLog("Canvas cleared.");
    }
  }, [onLog, saveToHistory]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = -e.deltaY * 0.001;
      const newZoom = Math.max(0.2, Math.min(3, viewport.zoom + zoomFactor));
      setViewport(prev => ({ ...prev, zoom: newZoom }));
    } else {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? e.deltaX : e.deltaY;
      setViewport(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    }
  };

  const handleGenerate = async (userPrompt: string) => {
    onLog(`Architecting pipeline for: "${userPrompt}"...`);
    onProgress(10);

    try {
      // Call the API layer instead of direct service
      const plan: PipelineSchema | null = await fetchPipelinePlan(userPrompt, nodes);

      if (!plan || !plan.nodes) {
        onLog(`Failed to generate a valid plan. Try being more specific.`);
        onProgress(0);
        return;
      }

      onLog(`Plan accepted. Identified ${plan.nodes.length} new logical units.`);
      onProgress(30);

      // Animation Loop (Client-side visual effect)
      const newNodes: Node[] = [...nodes];
      const newEdges: Edge[] = [...edges];
      const stepsTotal = plan.nodes.length;

      for (let i = 0; i < stepsTotal; i++) {
        const node = plan.nodes[i];
        const progressPercent = 30 + Math.floor(((i + 1) / stepsTotal) * 70);
        onProgress(progressPercent);

        await new Promise(r => setTimeout(r, 600));

        // Prevent duplicate IDs
        if (newNodes.some(n => n.id === node.id)) {
          continue;
        }

        newNodes.push(node);
        setNodes([...newNodes]);
        onLog(`Deployed node: [${node.type.toUpperCase()}] ${node.label}`);
      }

      // Add Edges
      if (plan.edges) {
        plan.edges.forEach(e => {
          if (!newEdges.some(ex => ex.id === e.id)) {
            newEdges.push(e);
          }
        });
        setEdges([...newEdges]);
      }

      saveToHistory(newNodes, newEdges);
      onLog(`Pipeline construction complete.`);
      onProgress(100);
      setTimeout(() => onProgress(0), 2000);

    } catch (e) {
      onLog(`Critical Error: ${e}`);
      onProgress(0);
    }
  };

  const getPath = (source: Node, target: Node) => {
    const NODE_WIDTH = 220;
    const ANCHOR_OFFSET_Y = 24;
    const startX = source.position.x + NODE_WIDTH;
    const startY = source.position.y + ANCHOR_OFFSET_Y;
    const endX = target.position.x;
    const endY = target.position.y + ANCHOR_OFFSET_Y;
    const dist = Math.abs(endX - startX);
    const controlOffset = Math.max(dist * 0.5, 50);
    const cp1X = startX + controlOffset;
    const cp1Y = startY;
    const cp2X = endX - controlOffset;
    const cp2Y = endY;
    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  };

  // Section VIII.B: Config Display Rules
  const renderConfigSummary = (node: Node) => {
    const c = node.config as any;
    // Primary Display based on spec
    switch (node.type) {
      case 'source':
        return <div className="font-mono text-[10px]">{c.source_name} • {c.format}</div>;
      case 'cleaning':
        return <div className="font-mono text-[10px]">{c.operation} • {c.strategy || 'N/A'}</div>;
      case 'transform':
        return <div className="font-mono text-[10px]">{c.operation} → {c.output_column}</div>;
      case 'temporal':
        return <div className="font-mono text-[10px]">{c.operation} ({c.window})</div>;
      case 'aggregation':
        return <div className="font-mono text-[10px]">{c.operation} by [{c.group_by?.join(',')}]</div>;
      case 'model':
        return <div className="font-mono text-[10px]">{c.model_type}</div>;
      case 'output':
        return <div className="font-mono text-[10px]">{c.output_name} • {c.format}</div>;
      default:
        return <div className="font-mono text-[10px]">Configured</div>;
    }
  };

  const renderSecondaryConfig = (node: Node) => {
    const c = node.config as any;
    // Secondary Display for Hover
    switch (node.type) {
      case 'source':
        return (
          <>
            <div>Refresh: {c.refresh_rate}</div>
            <div>Cols: {c.columns?.length || 0}</div>
          </>
        );
      case 'cleaning':
        return (
          <>
            <div>Threshold: {c.threshold ?? 'N/A'}</div>
            <div>Targets: {c.columns?.join(', ')}</div>
          </>
        );
      case 'transform':
        return (
          <>
            {c.params && Object.entries(c.params).map(([k, v]) => (
              <div key={k}>{k}: {String(v)}</div>
            ))}
          </>
        );
      case 'temporal':
        return (
          <>
            <div>Lag Periods: {c.lag_periods?.join(', ') || 'None'}</div>
            <div>Min Periods: {c.min_periods ?? 'N/A'}</div>
          </>
        );
      case 'aggregation':
        return (
          <>
            <div>Agg Cols: {c.agg_columns?.join(', ')}</div>
          </>
        );
      case 'model':
        return (
          <>
            {c.hyperparameters && Object.entries(c.hyperparameters).slice(0, 3).map(([k, v]) => (
              <div key={k}>{k}: {String(v)}</div>
            ))}
          </>
        );
      case 'output':
        return (
          <>
            <div>Cols: {c.columns?.length || 'All'}</div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-background select-none">

      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('.node-element')) return;
          setIsDraggingCanvas(true);
          setLastMousePos({ x: e.clientX, y: e.clientY });
        }}
        onMouseMove={(e) => {
          const dx = e.clientX - lastMousePos.x;
          const dy = e.clientY - lastMousePos.y;
          const scaledDx = dx / viewport.zoom;
          const scaledDy = dy / viewport.zoom;

          if (isDraggingNode) {
            dragDistanceRef.current += Math.abs(dx) + Math.abs(dy);
            setNodes(prev => prev.map(n =>
              n.id === isDraggingNode ? { ...n, position: { x: n.position.x + scaledDx, y: n.position.y + scaledDy } } : n
            ));
          } else if (isDraggingCanvas) {
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          }
          setLastMousePos({ x: e.clientX, y: e.clientY });
        }}
        onMouseUp={() => {
          if (isDraggingNode) saveToHistory(nodes, edges);
          setIsDraggingCanvas(false);
          setIsDraggingNode(null);
        }}
        onMouseLeave={() => { setIsDraggingCanvas(false); setIsDraggingNode(null); }}
        onWheel={handleWheel}
      >
        {/* Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.15] dark:opacity-[0.2]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`
          }}
        />

        {/* Transform Container */}
        <div
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%'
          }}
        >
          {/* Edges */}
          <svg className="absolute top-0 left-0 overflow-visible w-full h-full pointer-events-none z-0">
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;
              return (
                <g key={edge.id}>
                  <path d={getPath(sourceNode, targetNode)} fill="none" stroke="var(--background)" strokeWidth="4" className="opacity-80" />
                  <path d={getPath(sourceNode, targetNode)} fill="none" stroke="hsl(var(--accent))" strokeWidth="2" className="opacity-70" />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const visual = NODE_VISUALS[node.type] || NODE_VISUALS.source;
            return (
              <div
                key={node.id}
                className={cn(
                  "node-element absolute w-[220px] rounded-xl border-2 shadow-xl bg-card transition-all duration-200 group",
                  visual.border, visual.bg,
                  selectedNode?.id === node.id ? "ring-2 ring-accent shadow-2xl scale-105" : "hover:shadow-2xl hover:scale-[1.02]",
                  isDraggingNode === node.id ? "cursor-grabbing scale-105 z-50 shadow-2xl" : "cursor-grab z-10"
                )}
                style={{ left: node.position.x, top: node.position.y }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingNode(node.id);
                  setLastMousePos({ x: e.clientX, y: e.clientY });
                  dragDistanceRef.current = 0;
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragDistanceRef.current < 5) setSelectedNode(node);
                }}
              >
                {/* Anchors */}
                <div className="absolute top-[24px] -left-1.5 w-3 h-3 bg-accent border-2 border-background rounded-full z-20" />
                <div className="absolute top-[24px] -right-1.5 w-3 h-3 bg-accent border-2 border-background rounded-full z-20" />

                <div className="h-10 px-3 border-b border-inherit bg-inherit/20 flex items-center justify-between rounded-t-md">
                  <div className={cn("flex items-center gap-2 font-bold text-xs uppercase tracking-wider", visual.color)}>
                    {visual.icon}
                    {node.type}
                  </div>
                  <Grip size={12} className="opacity-30" />
                </div>

                <div className="p-3 bg-card/95 rounded-b-md">
                  <div className="font-bold text-sm text-foreground truncate mb-1" title={node.label}>{node.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-snug mb-2 line-clamp-2">{node.description}</div>
                  <div className="bg-muted/50 p-1.5 rounded border border-border/50 text-foreground overflow-hidden">
                    {renderConfigSummary(node)}
                  </div>
                </div>

                {/* Hover Details (Secondary Display) */}
                {hoveredNode === node.id && !isDraggingCanvas && !isDraggingNode && !selectedNode && (
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl p-3 border border-border z-[100] pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      {renderSecondaryConfig(node)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-6 z-20 flex gap-3">
        {/* Zoom */}
        <div className="bg-card/95 backdrop-blur border border-border/50 p-2 rounded-xl shadow-xl flex items-center gap-1">
          <button className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg text-muted-foreground transition-colors" onClick={() => setViewport(v => ({ ...v, zoom: v.zoom + 0.1 }))}><ZoomIn size={18} /></button>
          <span className="text-[10px] text-muted-foreground font-semibold w-10 text-center">{Math.round(viewport.zoom * 100)}%</span>
          <button className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg text-muted-foreground transition-colors" onClick={() => setViewport(v => ({ ...v, zoom: v.zoom - 0.1 }))}><ZoomOut size={18} /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg text-muted-foreground transition-colors" onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}><Maximize size={18} /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            className={cn("p-2 rounded-lg transition-colors", isFullScreen ? "text-accent bg-accent/15" : "hover:bg-accent/10 hover:text-accent text-muted-foreground")}
            onClick={onToggleFullScreen}
          >
            {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>

        {/* History & Clear */}
        <div className="bg-card/95 backdrop-blur border border-border/50 p-2 rounded-xl shadow-xl flex items-center gap-1">
          <button
            className={cn("p-2 rounded-lg transition-colors", historyIndex > 0 ? "hover:bg-accent/10 hover:text-accent text-foreground" : "text-muted-foreground opacity-40 cursor-not-allowed")}
            onClick={handleUndo}
            disabled={historyIndex === 0}
          >
            <Undo2 size={18} />
          </button>
          <button
            className={cn("p-2 rounded-lg transition-colors", historyIndex < history.length - 1 ? "hover:bg-accent/10 hover:text-accent text-foreground" : "text-muted-foreground opacity-40 cursor-not-allowed")}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 size={18} />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            className="p-2 hover:bg-destructive/15 hover:text-destructive text-muted-foreground rounded-lg transition-colors"
            title="Clear Canvas"
            onClick={handleClearCanvas}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Upload Button overlay (top-right) */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-to-r from-accent to-teal-600 hover:shadow-2xl text-white px-5 py-2.5 rounded-lg shadow-xl font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Database size={18} /> Upload Data
        </button>
      </div>

      {/* Edit/Details Dialog */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onMouseDown={() => setSelectedNode(null)}>
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                {NODE_VISUALS[selectedNode.type].icon}
                <span className="text-muted-foreground">Details:</span>
                <span className="text-accent">{selectedNode.label}</span>
              </h3>
              <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-0 overflow-y-auto flex-1">
              {/* 1. Header Info */}
              <div className="p-6 pb-4 border-b border-border/50 bg-card">
                <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Description</div>
                <div className="text-sm bg-muted/30 p-3 rounded-md border border-border/50 whitespace-pre-wrap">{selectedNode.description}</div>
              </div>

              {/* 2. Intelligent Data Display */}
              <div className="p-6 space-y-6">
                {/* Case A: Source Node */}
                {selectedNode.type === 'source' && (
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Database size={16} className="text-accent" /> File Configuration
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/20 p-3 rounded border border-border/50">
                        <div className="text-[10px] text-muted-foreground uppercase">Source Name</div>
                        <div className="font-mono text-sm">{(selectedNode.config as any).source_name}</div>
                      </div>
                      <div className="bg-muted/20 p-3 rounded border border-border/50">
                        <div className="text-[10px] text-muted-foreground uppercase">Format</div>
                        <div className="font-mono text-sm">{(selectedNode.config as any).format}</div>
                      </div>
                      <div className="col-span-2 bg-muted/20 p-3 rounded border border-border/50">
                        <div className="text-[10px] text-muted-foreground uppercase">Columns (Check to include)</div>
                        <div className="bg-background border border-border rounded mt-1 p-2 max-h-32 overflow-y-auto">
                          {((selectedNode.config as any).columns || []).map((col: string) => (
                            <div key={col} className="flex items-center gap-2 text-xs py-1">
                              <div className="w-3 h-3 rounded-sm bg-accent/20 border border-accent flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-accent rounded-sm" />
                              </div>
                              {col}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Case B: Transform Node (Stats) */}
                {selectedNode.type === 'transform' && (selectedNode.config as any).params && (
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <FunctionSquare size={16} className="text-accent" /> Statistical Insights
                    </h4>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 text-left">Feature</th>
                            <th className="px-4 py-2 text-right">Value (Mean/Unique)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {Object.entries((selectedNode.config as any).params).map(([key, val]) => (
                            <tr key={key} className="hover:bg-muted/10">
                              <td className="px-4 py-2 font-medium">{key}</td>
                              <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                                {typeof val === 'number'
                                  ? (Number.isInteger(val) ? val : val.toFixed(4))
                                  : String(val)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Case C: Generic Config View */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">Raw Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedNode.config).filter(([k]) => k !== 'params' && k !== 'source_name' && k !== 'columns').map(([key, val]) => (
                      <div key={key}>
                        <label className="text-[10px] font-medium uppercase text-muted-foreground mb-1 block">{key.replace('_', ' ')}</label>
                        <div className="w-full bg-muted/20 border border-border/50 rounded px-3 py-2 text-xs font-mono text-foreground overflow-hidden text-ellipsis">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  const newNodes = nodes.filter(n => n.id !== selectedNode.id);
                  const newEdges = edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
                  setNodes(newNodes);
                  setEdges(newEdges);
                  saveToHistory(newNodes, newEdges);
                  setSelectedNode(null);
                }}
                className="text-destructive text-sm flex items-center gap-2 hover:bg-destructive/10 px-3 py-2 rounded transition-colors"
              >
                <Trash2 size={16} /> Delete Node
              </button>
              <button onClick={() => setSelectedNode(null)} className="px-6 py-2 bg-foreground text-background hover:bg-foreground/90 rounded text-sm font-medium shadow-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Handler */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".csv,.parquet"
      />
    </div>
  );
};
