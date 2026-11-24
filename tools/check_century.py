"""Validate the last seed 7 SWI benchmark record."""
import json
import math
from pathlib import Path
import sys


def main():
    records = Path(sys.argv[1]).read_text().splitlines()
    records = (json.loads(line) for line in records if line.startswith("{"))
    years = [record for record in records if "year" in record]
    last = years[-1] if years else {}
    if last.get("year") != 1936:
        sys.exit("FAIL century run did not reach 1936")

    limits = {"msPerMonth": 130, "saveBytes": 1_000_000}
    for metric, limit in limits.items():
        value = last.get(metric)
        if type(value) not in (int, float) or not math.isfinite(value) or not 0 < value <= limit:
            sys.exit(f"FAIL 1936 {metric}: {value!r}, limit {limit}")

    expected = Path(__file__).with_name("state_hash.txt").read_text().strip()
    actual = last.get("stateHash")
    if actual != expected:
        sys.exit(f"FAIL 1936 stateHash: {actual!r}, expected {expected}")
    print(f"1936: {last['msPerMonth']} ms/month, {last['saveBytes']} bytes, stateHash {actual}")


if __name__ == "__main__":
    main()
