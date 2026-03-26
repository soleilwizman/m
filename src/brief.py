"""Generate a one-page decision brief from extracted records."""
import os
from pathlib import Path
from typing import List

import anthropic

# Load .env if present
_env = Path(__file__).parent.parent / ".env"
if _env.exists():
    for line in _env.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

from .models import PaperRecord

_PROMPT = """\
You are a scientific advisor writing a one-page decision brief for a biotech thesis \
on ovarian aging and menopause delay.

Based on the paper records below, write a concise brief with these sections:

## Executive Summary
2–3 sentences on the overall evidence landscape.

## Key Mechanisms
Bullet points of the top pathways and molecular targets.

## Most Promising Interventions
Ranked by evidence strength (note modality and species).

## Evidence Gaps
What is missing or under-studied.

## Recommended Next Steps
3–5 specific, actionable items.

---
Records:
{records}

Keep the total under 500 words. Be specific about targets and mechanisms.
"""


def generate_brief(records: List[PaperRecord]) -> str:
    """Return a one-page decision brief as a markdown string."""
    rows = "\n".join(
        f"- [{r.year}] {r.title} | target={r.target} | pathway={r.pathway} | "
        f"intervention={r.intervention} | effect={r.effect_direction} | "
        f"evidence={r.evidence_type} | relevance={r.relevance_to_menopause_delay}"
        for r in records
    )
    msg = anthropic.Anthropic().messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": _PROMPT.format(records=rows)}],
    )
    return msg.content[0].text
