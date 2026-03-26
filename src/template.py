"""Print an empty PaperRecord template as JSON."""
import json

TEMPLATE = {
    "title": "",
    "pmid": None,
    "year": None,
    "species": None,
    "tissue_context": None,
    "target": None,
    "pathway": None,
    "intervention": None,
    "modality": None,
    "phenotype": None,
    "endpoint": None,
    "effect_direction": None,
    "evidence_type": None,
    "model_system": None,
    "relevance_to_menopause_delay": None,
    "translational_caveat": None,
    "confidence_score": None,
}

if __name__ == "__main__":
    print(json.dumps(TEMPLATE, indent=2))
