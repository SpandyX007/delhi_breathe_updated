from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import polars as pl
import os
from datetime import datetime

router = APIRouter()

# Define the path to the Data folder relative to this file
# Adjusting to robustness - assuming standard layout
# d:\SIH2K25\ISRO_UI\delhi_breathe-main\backend\routers\forecast.py
# -> ../../../Data_SIH_2025
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
# BASE_DIR = os.path.abspath(r"D:\SIH2K25\ISRO_UI\delhi_breathe-main")
# Actual data (ground truth) from unseen_output_blh
ACTUAL_DIR = os.path.join(BASE_DIR, "predictions", "unseen_output_blh", "unseen_output_blh")
# Predicted data from air_quality_predictions_final_v1
PREDICTED_DIR = os.path.join(BASE_DIR, "predictions", "air_quality_predictions_final_v1", "unseen_filled")

@router.get("/forecast")
async def get_forecast_data(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    sites: List[int] = Query(..., description="List of site IDs to fetch data for"),
    granularity: str = Query("1h", description="Data granularity (1h, 6h, 1d, 1w, 1m)")
):
    try:
        # Validate dates
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        data_frames = []

        for site_id in sites:
            # 1. Read Actuals (Ground Truth from unseen_output_blh)
            actual_path = os.path.join(ACTUAL_DIR, f"site_{site_id}_unseen_output.csv")
            actual_lf = None
            
            if os.path.exists(actual_path):
                try:
                    actual_lf = pl.scan_csv(actual_path).with_columns([
                        pl.datetime(
                            pl.col("year").cast(pl.Int32),
                            pl.col("month").cast(pl.Int32),
                            pl.col("day").cast(pl.Int32),
                            pl.col("hour").cast(pl.Int32),
                            0, 0, 0
                        ).alias("time")
                    ]).select([
                        pl.col("time"),
                        pl.col("NO2_target").alias("NO2"),
                        pl.col("O3_target").alias("O3")
                    ])
                except Exception as e:
                    print(f"Error reading actuals for site {site_id}: {e}")

            # 2. Read Predictions (from air_quality_predictions_final_v1)
            pred_path = os.path.join(PREDICTED_DIR, f"site_{site_id}_unseen_filled.csv")
            pred_lf = None
            
            if os.path.exists(pred_path):
                try:
                    pred_lf = pl.scan_csv(pred_path).with_columns([
                        pl.datetime(
                            pl.col("year").cast(pl.Int32),
                            pl.col("month").cast(pl.Int32),
                            pl.col("day").cast(pl.Int32),
                            pl.col("hour").cast(pl.Int32),
                            0, 0, 0
                        ).alias("time")
                    ]).select([
                        pl.col("time"),
                        pl.col("NO2_target").alias("predicted_NO2"),
                        pl.col("O3_target").alias("predicted_O3")
                    ])
                except Exception as e:
                    print(f"Error reading predictions for site {site_id}: {e}")

            # 3. Merge Strategies
            combined = None
            
            if actual_lf is not None and pred_lf is not None:
                # Full outer join to keep all timestamps (history + future)
                combined = actual_lf.join(pred_lf, on="time", how="full", coalesce=True)
            elif actual_lf is not None:
                # Only actuals exist
                combined = actual_lf.with_columns([
                    pl.lit(None).cast(pl.Float64).alias("predicted_NO2"), 
                    pl.lit(None).cast(pl.Float64).alias("predicted_O3")
                ])
            elif pred_lf is not None:
                # Only predictions exist
                combined = pred_lf.with_columns([
                    pl.lit(None).cast(pl.Float64).alias("NO2"), 
                    pl.lit(None).cast(pl.Float64).alias("O3")
                ])
            
            if combined is not None:
                # Filter by date immediately
                filtered = combined.filter(
                    (pl.col("time") >= start) & (pl.col("time") <= end)
                )
                
                # Check emptiness lazily? better collect first chunk
                # Optimized: collect here
                data_frames.append(filtered.collect())

        if not data_frames:
            return []

        # Concatenate all sites
        combined_df = pl.concat(data_frames, how="vertical")
        
        if combined_df.is_empty():
            return []

        # Sort by time for group_by_dynamic
        combined_df = combined_df.sort("time")

        # Group by Time and Calculate Mean (aggregate across sites)
        if granularity not in ['1h', '6h', '1d', '1w', '1m']:
            granularity = '1h'
            
        aggregated_df = combined_df.group_by_dynamic("time", every=granularity).agg([
            pl.col("NO2").mean(), 
            pl.col("O3").mean(), 
            pl.col("predicted_NO2").mean(), 
            pl.col("predicted_O3").mean()
        ]).sort("time")
        
        # Convert to list of dictionaries
        result = aggregated_df.to_dicts()
        
        final_result = []
        for row in result:
            # Ensure time is ISO string
            if row['time']:
                row['time'] = row['time'].isoformat()
            final_result.append(row)
            
        return final_result

    except Exception as e:
        print(f"Error processing forecast request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
