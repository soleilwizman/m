"""Collect papers from PubMed by query."""
import time
import xml.etree.ElementTree as ET
from typing import Dict, List

import requests

PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


def search_pubmed(query: str, max_results: int = 20) -> List[str]:
    """Return a list of PMIDs matching the query."""
    r = requests.get(
        f"{PUBMED_BASE}/esearch.fcgi",
        params={"db": "pubmed", "term": query, "retmax": max_results, "retmode": "json"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["esearchresult"]["idlist"]


def fetch_abstract(pmid: str) -> Dict:
    """Fetch title, abstract, and year for a single PMID."""
    r = requests.get(
        f"{PUBMED_BASE}/efetch.fcgi",
        params={"db": "pubmed", "id": pmid, "retmode": "xml"},
        timeout=15,
    )
    r.raise_for_status()

    root = ET.fromstring(r.text)
    article = root.find(".//PubmedArticle")
    if article is None:
        return {}

    title_el = article.find(".//ArticleTitle")
    abstract_els = article.findall(".//AbstractText")
    year_el = article.find(".//PubDate/Year")

    return {
        "pmid": pmid,
        "title": title_el.text if title_el is not None else "",
        "abstract": " ".join(el.text or "" for el in abstract_els),
        "year": int(year_el.text) if year_el is not None else None,
    }


def collect_papers(query: str, max_results: int = 20) -> List[Dict]:
    """Search PubMed and return a list of paper dicts with abstracts."""
    pmids = search_pubmed(query, max_results)
    papers = []
    for pmid in pmids:
        paper = fetch_abstract(pmid)
        if paper:
            papers.append(paper)
        time.sleep(0.34)  # NCBI rate limit: max 3 req/s
    return papers
