
export interface Site {
  id: number;
  name: string;
  lat: number;
  lng: number;
  pollutionLevel: number; // 0-500 scale
}

export interface Model {
  id: string;
  name: string;
  type: string;
  rmse: number;
  r2: number;
  mae: number;
  description: string;
}

export type Granularity = '1h' | '6h' | '1d' | '1w' | '1m';
export type Page = 'dashboard' | 'research' | 'features' | 'models' | 'policy' | 'settings';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- FEATURE ENGINEERING SPECIFIC TYPES ---

export type NodeType = 
  | 'source' 
  | 'cleaning' 
  | 'transform' 
  | 'temporal' 
  | 'aggregation' 
  | 'model' 
  | 'output';

export interface NodePosition {
  x: number;
  y: number;
}

// Config Schemas based on Spec Section II.B

export interface SourceConfig {
  source_name: string;
  format: 'csv' | 'api' | 'database' | 'satellite';
  refresh_rate?: 'static' | 'hourly' | 'daily' | 'realtime';
  columns?: string[];
}

export interface CleaningConfig {
  operation: 'drop_na' | 'fill_na' | 'clip_outliers' | 'remove_duplicates';
  strategy?: 'mean' | 'median' | 'forward_fill' | 'zero' | 'drop' | null;
  threshold?: number | null;
  columns?: string[]; // Target columns
}

export interface TransformConfig {
  operation: 'normalize' | 'standardize' | 'log' | 'sqrt' | 'power' | 'encode_onehot' | 'encode_label' | 'binning';
  params?: {
    power?: number | null;
    bins?: number | null;
    categories?: string[] | null;
  };
  input_columns: string[];
  output_column: string;
}

export interface TemporalConfig {
  operation: 'lag' | 'rolling_mean' | 'rolling_std' | 'rolling_min' | 'rolling_max' | 'diff' | 'pct_change';
  window: number;
  lag_periods?: number[] | null;
  min_periods?: number | null;
  input_column: string;
  output_column: string;
}

export interface AggregationConfig {
  operation: 'sum' | 'mean' | 'median' | 'count' | 'std' | 'var' | 'min' | 'max';
  group_by: string[];
  agg_columns: string[];
  output_column: string;
}

export interface ModelConfig {
  model_type: 'linear' | 'ridge' | 'lasso' | 'random_forest' | 'xgboost' | 'lstm' | 'custom';
  hyperparameters?: {
    alpha?: number | null;
    n_estimators?: number | null;
    max_depth?: number | null;
    learning_rate?: number | null;
    [key: string]: any;
  };
  target_column: string;
  feature_columns: string[];
}

export interface OutputConfig {
  output_name: string;
  format: 'vector' | 'dataframe' | 'prediction' | 'file';
  columns?: string[];
}

export type NodeConfig = 
  | SourceConfig 
  | CleaningConfig 
  | TransformConfig 
  | TemporalConfig 
  | AggregationConfig 
  | ModelConfig 
  | OutputConfig;

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  position: NodePosition;
  connect_from: string[]; // Array of source node IDs
  config: NodeConfig;
}

export interface Edge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
}

export interface PipelineSchema {
  $schema?: string;
  metadata: {
    generated_at: string;
    node_count: number;
    edge_count?: number;
    prompt_hash?: string;
  };
  nodes: Node[];
  edges: Edge[];
  validation?: {
    is_dag: boolean;
    orphan_nodes?: string[];
    warnings: string[];
  };
}
