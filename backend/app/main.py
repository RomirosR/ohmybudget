from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    assets,
    history,
    investments,
    lookups,
    meta,
    operations,
    plans,
    summary,
)
from app.core.config import settings

app = FastAPI(title="OhMyBudget API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (lookups, plans, operations, assets, investments, summary, history, meta):
    app.include_router(module.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
