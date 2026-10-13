#!/usr/bin/env python3
"""Find businesses on Google Maps that have no website listed.

Uses the official Google Places API (New) Text Search endpoint. Each search
returns up to 60 places (3 pages of 20); places whose listing has no website
(or, optionally, only a social-media page) are written to a CSV or JSON file.

Example:
    export GOOGLE_MAPS_API_KEY=...
    python finder.py -q plumbers -q electricians -l "Austin, TX" -o leads.csv
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.googleMapsUri",
    "places.rating",
    "places.userRatingCount",
    "places.businessStatus",
    "places.primaryTypeDisplayName",
    "nextPageToken",
])
MAX_PAGES = 3  # the API returns at most 60 results per query
SOCIAL_DOMAINS = (
    "facebook.com", "fb.com", "instagram.com", "twitter.com", "x.com",
    "tiktok.com", "linkedin.com", "yelp.com", "nextdoor.com", "linktr.ee",
    "youtube.com", "pinterest.com",
)
CSV_FIELDS = [
    "name", "category", "phone", "address", "rating", "reviews",
    "website", "website_status", "maps_url", "place_id", "search",
]


class ApiError(Exception):
    pass


def post_json(url, body, headers, retries=3):
    """POST JSON and return the decoded response, retrying rate limits and server errors."""
    data = json.dumps(body).encode()
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2 ** attempt)
                continue
            raise ApiError(f"HTTP {e.code}: {detail}") from None
        except urllib.error.URLError as e:
            if attempt < retries:
                time.sleep(2 ** attempt)
                continue
            raise ApiError(f"Network error: {e.reason}") from None


def search_places(text_query, api_key, post=post_json, region=None):
    """Yield every place for one text query, following up to MAX_PAGES pages."""
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    body = {"textQuery": text_query, "pageSize": 20}
    if region:
        body["regionCode"] = region
    for _ in range(MAX_PAGES):
        resp = post(SEARCH_URL, body, headers)
        yield from resp.get("places", [])
        token = resp.get("nextPageToken")
        if not token:
            return
        body = {**body, "pageToken": token}


def website_status(uri):
    """Classify a listing's website: 'none', 'social' (a social or directory page only), or 'own'."""
    if not uri:
        return "none"
    host = (urlparse(uri if "://" in uri else "https://" + uri).hostname or "").lower()
    if any(host == d or host.endswith("." + d) for d in SOCIAL_DOMAINS):
        return "social"
    return "own"


def to_row(place, search):
    return {
        "name": place.get("displayName", {}).get("text", ""),
        "category": place.get("primaryTypeDisplayName", {}).get("text", ""),
        "phone": place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber", ""),
        "address": place.get("formattedAddress", ""),
        "rating": place.get("rating", ""),
        "reviews": place.get("userRatingCount", 0),
        "website": place.get("websiteUri", ""),
        "website_status": website_status(place.get("websiteUri")),
        "maps_url": place.get("googleMapsUri", ""),
        "place_id": place.get("id", ""),
        "search": search,
    }


def find_leads(queries, locations, api_key, include_social=False, min_reviews=0,
               min_rating=0.0, require_phone=False, include_closed=False,
               region=None, post=post_json, log=lambda msg: None):
    """Run every query x location search and return de-duplicated places without a website."""
    wanted = {"none", "social"} if include_social else {"none"}
    seen, leads = set(), []
    for q in queries:
        for loc in locations or [""]:
            text = f"{q} in {loc}" if loc else q
            found = kept = 0
            for place in search_places(text, api_key, post=post, region=region):
                found += 1
                pid = place.get("id")
                if pid in seen:
                    continue
                seen.add(pid)
                row = to_row(place, text)
                if row["website_status"] not in wanted:
                    continue
                if not include_closed and place.get("businessStatus", "OPERATIONAL") != "OPERATIONAL":
                    continue
                if row["reviews"] < min_reviews or (min_rating and (row["rating"] or 0) < min_rating):
                    continue
                if require_phone and not row["phone"]:
                    continue
                leads.append(row)
                kept += 1
            log(f"{text!r}: {found} places, {kept} new without a website")
    leads.sort(key=lambda r: (-int(r["reviews"] or 0), r["name"]))
    return leads


def write_output(leads, path):
    if path.lower().endswith(".json"):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(leads, f, indent=2, ensure_ascii=False)
    else:
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            w.writeheader()
            w.writerows(leads)


def read_lines(path):
    with open(path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip() and not line.startswith("#")]


def main(argv=None):
    p = argparse.ArgumentParser(description="Find Google Maps businesses that have no website.")
    p.add_argument("-q", "--query", action="append", default=[], help="business type, e.g. 'plumbers' (repeatable)")
    p.add_argument("-l", "--location", action="append", default=[], help="city or area, e.g. 'Austin, TX' (repeatable)")
    p.add_argument("--queries-file", help="file with one business type per line")
    p.add_argument("--locations-file", help="file with one location per line")
    p.add_argument("-o", "--output", default="no_website_leads.csv", help="output file (.csv or .json)")
    p.add_argument("--include-social", action="store_true", help="also keep places whose only 'website' is a Facebook/Instagram/Yelp-style page")
    p.add_argument("--min-reviews", type=int, default=0, help="skip places with fewer reviews (filters out inactive listings)")
    p.add_argument("--min-rating", type=float, default=0.0, help="skip places rated below this")
    p.add_argument("--require-phone", action="store_true", help="only keep places with a phone number")
    p.add_argument("--include-closed", action="store_true", help="keep temporarily or permanently closed places")
    p.add_argument("--region", help="two-letter region code to bias results, e.g. US")
    p.add_argument("--api-key", default=os.environ.get("GOOGLE_MAPS_API_KEY"), help="defaults to $GOOGLE_MAPS_API_KEY")
    a = p.parse_args(argv)

    queries = a.query + (read_lines(a.queries_file) if a.queries_file else [])
    locations = a.location + (read_lines(a.locations_file) if a.locations_file else [])
    if not queries:
        p.error("give at least one --query or --queries-file")
    if not a.api_key:
        p.error("set GOOGLE_MAPS_API_KEY or pass --api-key")

    try:
        leads = find_leads(
            queries, locations, a.api_key, include_social=a.include_social,
            min_reviews=a.min_reviews, min_rating=a.min_rating,
            require_phone=a.require_phone, include_closed=a.include_closed,
            region=a.region, log=lambda m: print(m, file=sys.stderr),
        )
    except ApiError as e:
        print(f"Google Places API error: {e}", file=sys.stderr)
        return 1
    write_output(leads, a.output)
    print(f"Saved {len(leads)} businesses without a website to {a.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
