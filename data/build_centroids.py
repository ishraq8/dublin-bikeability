"""Stage 2: geocode neighborhood names → centroids.json using Nominatim."""
import json
import os
import sys
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

NAMES_PATH = os.path.join(os.path.dirname(__file__), "neighborhoods.txt")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "centroids.json")

geocoder = Nominatim(user_agent="dublin-bikeability-scorer/1.0")


def parse_names(lines: list[str]) -> list[str]:
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            result.append(stripped)
    return result


def build_query(name: str, primary: bool) -> str:
    return f"{name}, Dublin, OH" if primary else f"{name}, Ohio"


def parse_location(location) -> tuple:
    if location is None:
        return (None, None)
    return (location.latitude, location.longitude)


def geocode_name(name: str) -> dict:
    for primary in (True, False):
        query = build_query(name, primary)
        try:
            loc = geocoder.geocode(query, exactly_one=True, timeout=10)
        except GeocoderTimedOut:
            loc = None
        lat, lng = parse_location(loc)
        if lat is not None:
            return {
                "name": name,
                "lat": lat,
                "lng": lng,
                "geocode_query": query,
                "geocode_confidence": "primary" if primary else "fallback",
            }
        time.sleep(1)

    print(f"  WARN: could not geocode '{name}' — skipping", file=sys.stderr)
    return {"name": name, "lat": None, "lng": None, "geocode_query": None, "geocode_confidence": "failed"}


def main() -> None:
    with open(NAMES_PATH) as f:
        names = parse_names(f.readlines())

    if not names:
        print("No neighborhood names found in neighborhoods.txt")
        return

    print(f"Geocoding {len(names)} neighborhoods...")
    results = []
    for i, name in enumerate(names, 1):
        print(f"  [{i}/{len(names)}] {name}")
        results.append(geocode_name(name))
        time.sleep(1)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

    failed = [r for r in results if r["lat"] is None]
    print(f"\nDone. {len(results) - len(failed)}/{len(results)} geocoded → {OUTPUT_PATH}")
    if failed:
        print("Failed lookups (fix manually in centroids.json):")
        for r in failed:
            print(f"  {r['name']}")


if __name__ == "__main__":
    main()
