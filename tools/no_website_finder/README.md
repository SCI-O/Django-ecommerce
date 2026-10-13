# No-Website Business Finder

Finds businesses on Google Maps that have **no website** listed and saves them to a CSV or JSON file, with name, category, phone, address, rating, review count, and a Google Maps link.

It uses Google's official [Places API (New) Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search), not page scraping, so it is reliable and within Google's terms. Python 3.8+ only; no packages to install.

## Setup (one time)

1. Go to the [Google Cloud console](https://console.cloud.google.com/), create a project, and turn on billing.
2. Enable **Places API (New)** for the project.
3. Create an **API key** (APIs & Services → Credentials). Restrict it to Places API (New).
4. Save the key in your terminal:

   ```bash
   export GOOGLE_MAPS_API_KEY="your-key-here"
   ```

## Use

```bash
# One business type in one city
python finder.py -q plumbers -l "Austin, TX"

# Several types and cities; every combination is searched, duplicates removed
python finder.py -q plumbers -q electricians -q "hair salons" \
                 -l "Austin, TX" -l "Round Rock, TX" -o leads.csv

# Long lists from files (one per line)
python finder.py --queries-file types.txt --locations-file cities.txt -o leads.json
```

Useful options:

| Option | What it does |
|---|---|
| `--include-social` | Also keep businesses whose only "website" is a Facebook, Instagram, Yelp, Linktree, or similar page. These are often the best prospects. The `website_status` column shows `none` or `social`. |
| `--min-reviews 5` | Skip listings with fewer than 5 reviews (helps drop dead or fake listings). |
| `--min-rating 4` | Skip listings rated below 4.0. |
| `--require-phone` | Only keep businesses with a phone number. |
| `--include-closed` | Keep closed businesses (skipped by default). |
| `--region US` | Bias results to a country. |
| `-o file.csv` / `-o file.json` | Output file; the format follows the extension. |

Results are sorted by review count, most first. Busy businesses without a website usually come first.

## Limits and cost

- Google returns at most **60 results per search** (3 pages of 20). To cover a big city, search smaller areas such as neighborhoods, suburbs, or ZIP codes (`-l "78704"`), or use narrower business types.
- Each page is one billed request. Reading the website and phone fields puts these requests in a higher-priced Text Search tier. Check the current [Places API pricing](https://developers.google.com/maps/billing-and-pricing/pricing) and any monthly free usage before large runs, and set a budget alert in Google Cloud.
- "No website" means none is listed on the Google Maps profile. The business might still have a site Google doesn't know about, so check before you reach out.
- Google's [Maps Platform terms](https://cloud.google.com/maps-platform/terms) limit how long you may store Places data other than place IDs. Use the results for your outreach rather than building a permanent database, and follow anti-spam rules when you contact businesses.

## Tests

```bash
python -m unittest -v test_finder
```

The tests use a fake API, so they need no key and no network.
