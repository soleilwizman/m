from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field


class EffectDirection(str, Enum):
    positive = "positive"
    negative = "negative"
    neutral = "neutral"
    unclear = "unclear"


class EvidenceType(str, Enum):
    in_vitro = "in_vitro"
    in_vivo = "in_vivo"
    clinical = "clinical"
    review = "review"
    meta_analysis = "meta_analysis"


class PaperRecord(BaseModel):
    title: str
    pmid: Optional[str] = None
    year: Optional[int] = None
    species: Optional[str] = None
    tissue_context: Optional[str] = None
    target: Optional[str] = None
    pathway: Optional[str] = None
    intervention: Optional[str] = None
    modality: Optional[str] = None
    phenotype: Optional[str] = None
    endpoint: Optional[str] = None
    effect_direction: Optional[EffectDirection] = None
    evidence_type: Optional[EvidenceType] = None
    model_system: Optional[str] = None
    relevance_to_menopause_delay: Optional[str] = None
    translational_caveat: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
