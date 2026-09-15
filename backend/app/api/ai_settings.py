from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import config


router = APIRouter(prefix="/api/ai", tags=["AI settings"])


class ProviderUpdate(BaseModel):
    provider: Literal["nvidia", "ollama"]


@router.get("/provider")
def get_provider():
    return config.get_public_ai_config()


@router.put("/provider")
def update_provider(update: ProviderUpdate):
    if update.provider == "nvidia" and not config.MEMORYMAP_AI_API_KEY:
        raise HTTPException(status_code=400, detail="An NVIDIA API key is not configured on the server.")
    config.set_ai_provider(update.provider)
    return config.get_public_ai_config()
