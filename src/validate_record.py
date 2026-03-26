"""Validate a PaperRecord JSON file against the schema."""
import json
import sys

from pydantic import ValidationError

from .models import PaperRecord


def validate_file(path: str) -> None:
    with open(path) as f:
        data = json.load(f)
    try:
        record = PaperRecord(**data)
        print(f"Valid record: {record.title!r} (confidence={record.confidence_score})")
    except ValidationError as e:
        print("Validation failed:")
        print(e)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m src.validate_record <path/to/record.json>")
        sys.exit(1)
    validate_file(sys.argv[1])
