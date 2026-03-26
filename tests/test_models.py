import json
import pytest
from pydantic import ValidationError
from src.models import PaperRecord, EffectDirection, EvidenceType


def test_full_record():
    r = PaperRecord(
        title="Test paper",
        pmid="12345678",
        year=2022,
        species="Mus musculus",
        tissue_context="ovary",
        target="SIRT1",
        pathway="autophagy",
        intervention="caloric restriction",
        modality="dietary",
        phenotype="preserved follicle count",
        endpoint="follicle count",
        effect_direction="positive",
        evidence_type="in_vivo",
        model_system="C57BL/6 mice",
        relevance_to_menopause_delay="extends follicle pool",
        translational_caveat="mouse model only",
        confidence_score=0.9,
    )
    assert r.effect_direction == EffectDirection.positive
    assert r.evidence_type == EvidenceType.in_vivo


def test_minimal_record():
    r = PaperRecord(title="Minimal paper")
    assert r.pmid is None
    assert r.confidence_score is None


def test_confidence_out_of_range():
    with pytest.raises(ValidationError):
        PaperRecord(title="Bad", confidence_score=1.5)


def test_example_record_file():
    with open("data/processed/example_record.json") as f:
        data = json.load(f)
    r = PaperRecord(**data)
    assert r.title
    assert 0.0 <= r.confidence_score <= 1.0
