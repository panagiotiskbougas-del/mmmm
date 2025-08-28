from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import analyze, export


app = FastAPI(title="BeamLab", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


app.include_router(analyze.router, prefix="")
app.include_router(export.router, prefix="")

