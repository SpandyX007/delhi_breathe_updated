
import { Node } from '../types';

/**
 * PIPELINE LOGIC DOCUMENTATION
 * 
 * This file contains the "Business Logic" and "Schema Contracts" for the Feature Engineering Pipeline.
 * It separates the construction rules from the UI rendering and the API transmission.
 */

// --- SECTION 1: NODE TYPE DEFINITIONS & SCHEMAS ---

export const TYPE_SCHEMAS_TEXT = `
**Type: source**
{
  "source_name": string,
  "format": enum["csv", "api", "database", "satellite"],
  "refresh_rate": enum["static", "hourly", "daily", "realtime"],
  "columns": string[]
}

**Type: cleaning**
{
  "operation": enum["drop_na", "fill_na", "clip_outliers", "remove_duplicates"],
  "strategy": enum["mean", "median", "forward_fill", "zero", "drop"] | null,
  "threshold": number | null,
  "columns": string[]
}

**Type: transform**
{
  "operation": enum["normalize", "standardize", "log", "sqrt", "power", "encode_onehot", "encode_label", "binning"],
  "params": { "power": number | null, "bins": number | null, "categories": string[] | null },
  "input_columns": string[],
  "output_column": string
}

**Type: temporal**
{
  "operation": enum["lag", "rolling_mean", "rolling_std", "rolling_min", "rolling_max", "diff", "pct_change"],
  "window": number,
  "lag_periods": number[] | null,
  "min_periods": number | null,
  "input_column": string,
  "output_column": string
}

**Type: aggregation**
{
  "operation": enum["sum", "mean", "median", "count", "std", "var", "min", "max"],
  "group_by": string[],
  "agg_columns": string[],
  "output_column": string
}

**Type: model**
{
  "model_type": enum["linear", "ridge", "lasso", "random_forest", "xgboost", "lstm", "custom"],
  "hyperparameters": { "alpha": number | null, "n_estimators": number | null, "max_depth": number | null, "learning_rate": number | null },
  "target_column": string,
  "feature_columns": string[]
}

**Type: output**
{
  "output_name": string,
  "format": enum["vector", "dataframe", "prediction", "file"],
  "columns": string[]
}
`;

// --- SECTION 2: PROMPT ENGINEERING LOGIC ---

/**
 * Constructs the System Instruction for the LLM based on current context.
 * Enforces the strict layout zones and type constraints.
 */
export const buildPipelinePrompt = (existingNodes: Node[], userPrompt: string): string => {
  // Context reduction for token efficiency
  const existingContext = existingNodes.map(n => ({ id: n.id, type: n.type, label: n.label }));

  return `
  You are a feature engineering architect for air quality forecasting. 

  STRICT CONSTRAINTS:
  1. Use ONLY these node types: source, cleaning, transform, temporal, aggregation, model, output
  2. Every node MUST have: id, type, label, description, position, connect_from, config
  3. Config MUST follow the exact schema for each type (provided below)
  4. Position nodes in zones: 
     - Zone 1 (Ingestion): X=60-280 (source)
     - Zone 2 (Preprocessing): X=320-540 (cleaning, transform)
     - Zone 3 (Features): X=580-800 (temporal, aggregation)
     - Zone 4 (Modeling): X=840-1060 (model)
     - Zone 5 (Output): X=1100-1320 (output)
     
     Vertical Positioning: Stack nodes of same type with 140px vertical gap. First node of type starts at Y=80.
  5. Snap all positions to 20px grid.
  6. No cycles allowed (DAG).
  7. Consolidate operations—do NOT create single-operation chains. Group related logic.

  EXISTING NODES (do not recreate, use IDs to connect if needed): 
  ${JSON.stringify(existingContext)}

  TYPE SCHEMAS:
  ${TYPE_SCHEMAS_TEXT}

  USER REQUEST: "${userPrompt}"

  Respond with valid JSON following the schema. No markdown, no explanation.
  Format:
  {
    "metadata": { "generated_at": "ISOString", "node_count": number },
    "nodes": [ ... ],
    "edges": [ { "id": "source_to_target", "source": "id", "target": "id" } ]
  }
  `;
};

// --- SECTION 3: GRAPH POST-PROCESSING LOGIC ---

/**
 * Ensures all nodes returned by the LLM adhere to the grid system.
 * This is the "Backend Validation/Sanitization" layer mentioned in the spec.
 */
export const sanitizeNodePositions = (nodes: Node[]): Node[] => {
  if (!Array.isArray(nodes)) return [];
  
  return nodes.map((n: Node) => ({
    ...n,
    position: {
      x: Math.round(n.position.x / 20) * 20,
      y: Math.round(n.position.y / 20) * 20
    }
  }));
};
