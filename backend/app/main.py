from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.routes import (
    assets,
    auth,
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

for module in (auth, lookups, plans, operations, assets, investments, summary, history, meta):
    app.include_router(module.router)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(_request: Request, _exc: IntegrityError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Некорректная ссылка на справочник или дубликат записи"},
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}
