import csv
import json
import os
import tempfile
import unittest

import finder


def place(pid, name, website=None, reviews=10, rating=4.5, status="OPERATIONAL", phone="(512) 555-0100"):
    p = {
        "id": pid,
        "displayName": {"text": name},
        "formattedAddress": f"{pid} Main St, Austin, TX",
        "userRatingCount": reviews,
        "rating": rating,
        "businessStatus": status,
        "googleMapsUri": f"https://maps.google.com/?cid={pid}",
        "primaryTypeDisplayName": {"text": "Plumber"},
    }
    if website:
        p["websiteUri"] = website
    if phone:
        p["nationalPhoneNumber"] = phone
    return p


class FakeApi:
    """Serves pages keyed by text query; records every request."""

    def __init__(self, pages_by_query):
        self.pages = pages_by_query
        self.calls = []

    def __call__(self, url, body, headers):
        self.calls.append((url, body, headers))
        pages = self.pages[body["textQuery"]]
        idx = int(body.get("pageToken", "0"))
        resp = {"places": pages[idx]}
        if idx + 1 < len(pages):
            resp["nextPageToken"] = str(idx + 1)
        return resp


class WebsiteStatusTest(unittest.TestCase):
    def test_classification(self):
        self.assertEqual(finder.website_status(None), "none")
        self.assertEqual(finder.website_status(""), "none")
        self.assertEqual(finder.website_status("https://www.facebook.com/joesplumbing"), "social")
        self.assertEqual(finder.website_status("http://m.facebook.com/x"), "social")
        self.assertEqual(finder.website_status("instagram.com/joe"), "social")
        self.assertEqual(finder.website_status("https://www.yelp.com/biz/joe"), "social")
        self.assertEqual(finder.website_status("https://joesplumbing.com"), "own")
        # a domain that merely contains a social name is a real website
        self.assertEqual(finder.website_status("https://notfacebook.com"), "own")


class FindLeadsTest(unittest.TestCase):
    def setUp(self):
        self.api = FakeApi({
            "plumbers in Austin, TX": [
                [place("a", "Has Site", website="https://hassite.com"),
                 place("b", "No Site", reviews=3),
                 place("c", "FB Only", website="https://facebook.com/fbonly", reviews=50)],
                [place("d", "Closed", status="CLOSED_PERMANENTLY"),
                 place("e", "No Phone", phone=None, reviews=8)],
            ],
            "electricians in Austin, TX": [
                [place("b", "No Site", reviews=3),  # duplicate across searches
                 place("f", "Busy Electric", reviews=120, rating=3.9)],
            ],
        })

    def run_find(self, **kw):
        return finder.find_leads(["plumbers", "electricians"], ["Austin, TX"], "KEY", post=self.api, **kw)

    def test_default_keeps_only_operational_without_website_deduped(self):
        names = [r["name"] for r in self.run_find()]
        self.assertEqual(names, ["Busy Electric", "No Phone", "No Site"])  # sorted by reviews desc

    def test_follows_pagination_and_sends_headers(self):
        self.run_find()
        plumber_calls = [b for _, b, _ in self.api.calls if b["textQuery"] == "plumbers in Austin, TX"]
        self.assertEqual(len(plumber_calls), 2)
        self.assertEqual(plumber_calls[1]["pageToken"], "1")
        _, _, headers = self.api.calls[0]
        self.assertEqual(headers["X-Goog-Api-Key"], "KEY")
        self.assertIn("places.websiteUri", headers["X-Goog-FieldMask"])
        self.assertIn("nextPageToken", headers["X-Goog-FieldMask"])

    def test_include_social(self):
        names = {r["name"] for r in self.run_find(include_social=True)}
        self.assertIn("FB Only", names)
        self.assertNotIn("Has Site", names)

    def test_filters(self):
        self.assertEqual([r["name"] for r in self.run_find(min_reviews=5)], ["Busy Electric", "No Phone"])
        self.assertEqual([r["name"] for r in self.run_find(min_rating=4.0)], ["No Phone", "No Site"])
        self.assertNotIn("No Phone", [r["name"] for r in self.run_find(require_phone=True)])
        self.assertIn("Closed", [r["name"] for r in self.run_find(include_closed=True)])

    def test_stops_after_three_pages(self):
        api = FakeApi({"cafes": [[place(str(i), f"P{i}")] for i in range(5)]})
        rows = finder.find_leads(["cafes"], [], "KEY", post=api)
        self.assertEqual(len(api.calls), finder.MAX_PAGES)
        self.assertEqual(len(rows), 3)


class OutputTest(unittest.TestCase):
    def test_csv_and_json(self):
        rows = [finder.to_row(place("x", "Zoë's Café"), "cafes in Austin")]
        with tempfile.TemporaryDirectory() as d:
            c, j = os.path.join(d, "out.csv"), os.path.join(d, "out.json")
            finder.write_output(rows, c)
            finder.write_output(rows, j)
            with open(c, encoding="utf-8") as f:
                got = list(csv.DictReader(f))
            self.assertEqual(got[0]["name"], "Zoë's Café")
            self.assertEqual(got[0]["website_status"], "none")
            with open(j, encoding="utf-8") as f:
                self.assertEqual(json.load(f)[0]["place_id"], "x")

    def test_main_requires_key_and_query(self):
        os.environ.pop("GOOGLE_MAPS_API_KEY", None)
        with self.assertRaises(SystemExit):
            finder.main(["-q", "plumbers"])
        with self.assertRaises(SystemExit):
            finder.main(["--api-key", "K"])


if __name__ == "__main__":
    unittest.main()
