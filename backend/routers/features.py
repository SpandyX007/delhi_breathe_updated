from fastapi import APIRouter, UploadFile, File, HTTPException
import polars as pl
import io
import uuid
from datetime import datetime
from typing import Dict, Any, List

router = APIRouter()

@router.post("/features/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Uploads a CSV or Parquet file, analyzes it using Polars, 
    and returns a graph representation (PipelineSchema) for the frontend canvas.
    """
    if not file.filename.endswith(('.csv', '.parquet')):
         raise HTTPException(status_code=400, detail="Only .csv and .parquet files are supported")

    content = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            # Using read_csv directly on BytesIO
            df = pl.read_csv(io.BytesIO(content), ignore_errors=True, n_rows=10000) # Limit rows for fast "describe"
        else:
            df = pl.read_parquet(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # Analysis
    schema = df.schema
    
    # --- Construct Nodes & Edges ---
    nodes = []
    edges = []
    
    # 1. Source Node
    source_id = f"node_{uuid.uuid4().hex[:8]}"
    nodes.append({
        "id": source_id,
        "type": "source",
        "label": file.filename,
        "description": f"Dataset: {df.height} rows (sampled), {df.width} columns.",
        "position": {"x": 100, "y": 250},
        "connect_from": [],
        "config": {
            "source_name": file.filename,
            "format": "csv" if file.filename.endswith('.csv') else "database",
            "columns": df.columns
        }
    })

    # Group Columns
    numeric_cols = []
    categorical_cols = []
    temporal_cols = []

    for col_name, dtype in schema.items():
        # Polars Types Check
        if dtype in (pl.Int8, pl.Int16, pl.Int32, pl.Int64, pl.UInt8, pl.UInt16, pl.UInt32, pl.UInt64, pl.Float32, pl.Float64):
            numeric_cols.append(col_name)
        elif dtype in (pl.Date, pl.Datetime, pl.Duration, pl.Time):
            temporal_cols.append(col_name)
        else:
            # Assuming remaining are categorical (String, Boolean, Categorical)
            categorical_cols.append(col_name)

    # 2. Numeric Analysis Node
    if numeric_cols:
        node_id = f"node_{uuid.uuid4().hex[:8]}"
        
        # Calculate brief stats for first few columns
        subset_cols = numeric_cols[:5]
        try:
            stats_df = df.select([
                pl.col(c).mean().alias(c) for c in subset_cols
            ])
            stats = stats_df.to_dicts()[0] if not stats_df.is_empty() else {}
        except:
            stats = {}

        # Format stats for description
        desc = "Mean Values (Sample):\n" + "\n".join([f"{k}: {v:.2f}" for k, v in stats.items() if v is not None])
        if len(numeric_cols) > 5:
            desc += f"\n...and {len(numeric_cols)-5} more."
            
        nodes.append({
            "id": node_id,
            "type": "transform", 
            "label": "Numeric Features",
            "description": f"Group: {len(numeric_cols)} numeric signals.\n{desc}",
            "position": {"x": 500, "y": 100},
            "connect_from": [source_id],
            "config": {
                "operation": "standardize", # Default suggestion
                "input_columns": numeric_cols,
                "output_column": "features_norm",
                "params": stats 
            }
        })
        edges.append({"id": f"edge_{uuid.uuid4().hex[:8]}", "source": source_id, "target": node_id})

    # 3. Categorical Analysis Node
    if categorical_cols:
        node_id = f"node_{uuid.uuid4().hex[:8]}"
        
        subset_cols = categorical_cols[:5]
        try:
            unique_df = df.select([
                pl.col(c).n_unique().alias(c) for c in subset_cols
            ])
            uniques = unique_df.to_dicts()[0] if not unique_df.is_empty() else {}
        except:
            uniques = {}
            
        desc = "Cardinality (Unique Values):\n" + "\n".join([f"{k}: {v}" for k, v in uniques.items()])
        if len(categorical_cols) > 5:
            desc += f"\n...and {len(categorical_cols)-5} more."
            
        nodes.append({
             "id": node_id,
             "type": "transform",
             "label": "Categorical Features",
             "description": f"Group: {len(categorical_cols)} categorical fields.\n{desc}",
             "position": {"x": 500, "y": 300},
             "connect_from": [source_id],
             "config": {
                 "operation": "encode_onehot",
                 "input_columns": categorical_cols,
                 "output_column": "features_cat",
                 "params": uniques
             }
        })
        edges.append({"id": f"edge_{uuid.uuid4().hex[:8]}", "source": source_id, "target": node_id})
        
    # 4. Temporal Node
    if temporal_cols:
        node_id = f"node_{uuid.uuid4().hex[:8]}"
        nodes.append({
             "id": node_id,
             "type": "temporal",
             "label": "Time Series",
             "description": f"Found time columns: {', '.join(temporal_cols)}",
             "position": {"x": 500, "y": 500},
             "connect_from": [source_id],
             "config": {
                 "operation": "rolling_mean",
                 "window": 7,
                 "input_column": temporal_cols[0],
                 "output_column": f"{temporal_cols[0]}_smooth"
             }
        })
        edges.append({"id": f"edge_{uuid.uuid4().hex[:8]}", "source": source_id, "target": node_id})

    return {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "node_count": len(nodes)
        },
        "nodes": nodes,
        "edges": edges
    }
