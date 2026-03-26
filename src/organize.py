"""Organise extracted records by mechanism, modality, and evidence."""
from typing import Dict, List

import pandas as pd

from .models import PaperRecord


def records_to_df(records: List[PaperRecord]) -> pd.DataFrame:
    return pd.DataFrame([r.model_dump() for r in records])


def group_by(records: List[PaperRecord], field: str) -> Dict[str, List[PaperRecord]]:
    groups: Dict[str, List[PaperRecord]] = {}
    for r in records:
        val = getattr(r, field, None)
        key = str(val) if val is not None else "unknown"
        groups.setdefault(key, []).append(r)
    return groups


def filter_records(
    records: List[PaperRecord],
    modality: str = None,
    pathway: str = None,
    evidence_type: str = None,
    min_confidence: float = 0.0,
) -> List[PaperRecord]:
    out = records
    if modality:
        out = [r for r in out if r.modality and modality.lower() in r.modality.lower()]
    if pathway:
        out = [r for r in out if r.pathway and pathway.lower() in r.pathway.lower()]
    if evidence_type:
        out = [r for r in out if r.evidence_type and r.evidence_type.value == evidence_type]
    if min_confidence:
        out = [r for r in out if (r.confidence_score or 0) >= min_confidence]
    return out


def top_by_confidence(records: List[PaperRecord], n: int = 10) -> List[PaperRecord]:
    return sorted(records, key=lambda r: r.confidence_score or 0, reverse=True)[:n]
