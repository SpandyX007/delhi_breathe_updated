from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import forecast, features

app = FastAPI(title="AeroAnalytica Backend", version="1.0.0")

# CORS Configuration
# Allowing all origins for development simplicity
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(forecast.router, prefix="/api/v1", tags=["forecast"])
app.include_router(features.router, prefix="/api/v1", tags=["features"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AeroAnalytica Backend API"}
