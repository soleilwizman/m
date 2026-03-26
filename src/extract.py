"""Extract structured claims from paper abstracts using Claude."""
import json
import os
from pathlib import Path
from typing import Dict

import anthropic

# Load .env if present
_env = Path(__file__).parent.parent / ".env"
if _env.exists():
    for line in _env.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

from .models import PaperRecord

_client = anthropic.Anthropic()

_SYSTEM = (
    "You are a biomedical research analyst specialising in aging biology "
    "and reproductive longevity. Extract structured fields from paper abstracts "
    "and return only valid JSON — no markdown, no commentary."
)

_PROMPT = """\
Extract the following fields from this paper. Use null for any field you cannot determine.

Fields:
- title (string)
- pmid (string or null)
- year (integer or null)
- species (string or null)
- tissue_context (string or null)
- target: molecular target, gene or protein (string or null)
- pathway (string or null)
- intervention: what was done or tested (string or null)
- modality: e.g. genetic, pharmacological, dietary, lifestyle (string or null)
- phenotype: observed biological phenotype (string or null)
- endpoint: measured outcome (string or null)
- effect_direction: one of "positive", "negative", "neutral", "unclear"
- evidence_type: one of "in_vitro", "in_vivo", "clinical", "review", "meta_analysis"
- model_system (string or null)
- relevance_to_menopause_delay: how this relates to extending ovarian lifespan (string or null)
- translational_caveat: key limitation for human translation (string or null)
- confidence_score: your extraction confidence, 0.0–1.0 (float)

Paper:
Title: {title}
PMID: {pmid}
Year: {year}

Abstract:
{abstract}
"""


def extract_record(paper: Dict) -> PaperRecord:
    """Call Claude to extract a structured PaperRecord from a paper dict."""
    prompt = _PROMPT.format(
        title=paper.get("title", ""),
        pmid=paper.get("pmid", ""),
        year=paper.get("year", ""),
        abstract=paper.get("abstract", ""),
    )
    msg = _client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(msg.content[0].text.strip())
    return PaperRecord(**data)
