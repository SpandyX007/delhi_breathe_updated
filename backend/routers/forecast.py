from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import polars as pl
import os
from datetime import datetime

router = APIRouter()

# Define the path to the Data folder relative to this file
# DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../Data_SIH_2025"))
DATA_DIR = r"D:\SIH2K25\ISRO_UI\delhi_breathe-main\Data_SIH_2025"

@router.get("/forecast")
async def get_forecast_data(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    sites: List[int] = Query(..., description="List of site IDs to fetch data for")
):
    try:
        # Validate dates
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        data_frames = []

        for site_id in sites:
            file_path = os.path.join(DATA_DIR, f"site_{site_id}_train_data.csv")
            
            if not os.path.exists(file_path):
                print(f"Warning: File not found for site {site_id}: {file_path}")
                continue
                
            # Read CSV with Polars
            try:
                lf = pl.scan_csv(file_path) # Use lazy frame for optimization
                
                # Create time column from component columns
                lf = lf.with_columns([
                    pl.datetime(
                        pl.col("year").cast(pl.Int32),
                        pl.col("month").cast(pl.Int32),
                        pl.col("day").cast(pl.Int32),
                        pl.col("hour").cast(pl.Int32),
                        0, 0, 0 # min, sec, micro
                    ).alias("time")
                ])

                # Select and Rename cols
                # Filter for only existing columns to be safe (polars requires strict schema usually)
                # But here we assume schema is consistent based on previous view.
                
                cols_map = {
                    'NO2_target': 'NO2',
                    'O3_target': 'O3',
                    'NO2_forecast': 'predicted_NO2',
                    'O3_forecast': 'predicted_O3'
                }
                
                # Check explicit columns? Polars lazy means we define plan.
                # simpler to just select possible cols.
                
                lf = lf.select([
                    pl.col("time"),
                    pl.col("NO2_target").alias("NO2"),
                    pl.col("O3_target").alias("O3"),
                    pl.col("NO2_forecast").alias("predicted_NO2"),
                    pl.col("O3_forecast").alias("predicted_O3")
                ])
                
                # Filter by date immediately (push down predicate optimal)
                lf = lf.filter(
                    (pl.col("time") >= start) & (pl.col("time") <= end)
                )

                data_frames.append(lf.collect()) # Collect into DataFrame
                
            except Exception as read_err:
                 print(f"Error reading file {file_path}: {read_err}")
                 continue
            
        if not data_frames:
            return []

        # Concatenate
        combined_df = pl.concat(data_frames)
        
        if combined_df.is_empty():
            return []

        # Group by Time and Calculate Mean
        aggregated_df = combined_df.group_by("time").mean().sort("time")
        
        # Convert to list of dictionaries
        # Format time to ISO string
        result = aggregated_df.to_dicts()
        
        # Polars exports datetime objects/timestamps, we might need to stringify
        final_result = []
        for row in result:
            row['time'] = row['time'].isoformat()
            final_result.append(row)
            
        return final_result

    except Exception as e:
        print(f"Error processing forecast request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
