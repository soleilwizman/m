
# Ovarian Aging Thesis Copilot

A lightweight starter repo for a literature-intelligence workflow around ovarian aging,
reproductive aging, fibrosis, inflammation, and menopause-delay theses.

## What this starter includes

- A typed schema for structured paper extraction
- Validation utilities for JSON records
- A template generator for example data and gold-set labeling
- A PubMed ingestion script using the NCBI Entrez API
- A first-pass relevance screener based on transparent rules

## Suggested workflow

1. Fetch literature from PubMed
2. Save metadata and abstracts to `data/raw/`
3. Run the relevance screener
4. Manually review `likely_relevant` papers
5. Label a gold set in `eval/`
6. Add extraction/evaluation logic later

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Quick start

Generate templates:

```bash
python src/template.py
```

Validate the example record:

```bash
python src/validate_record.py data/processed/example_record.json
```

Fetch PubMed abstracts:

```bash
python src/fetch_pubmed.py \
  --query "ovarian aging" \
  --query "ovarian inflammation aging" \
  --retmax 50 \
  --email your_email@example.com
```

Run the relevance screener:

```bash
python src/screen_relevance.py \
  --input data/raw/pubmed_results.csv \
  --output data/processed/papers_screened.csv
```

## Notes

- NCBI asks that you provide an email for API access.
- The screener is intentionally simple and interpretable.
- The schema is opinionated toward investor/founder research workflows.
