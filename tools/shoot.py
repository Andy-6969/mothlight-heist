"""Take the entry's screenshots: real renders of the game's own staged moments (?shot=...).

Serve the game first (`node serve.ts --port 8094`), then: python tools/shoot.py
Reads shots.json and writes 1280x720 JPEGs under 256 KiB into screenshots/.
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8094/"
LIMIT = 256 * 1024


def main():
    shots = json.load(open(os.path.join(ROOT, "shots.json"), encoding="utf-8"))
    out_dir = os.path.join(ROOT, "screenshots")
    os.makedirs(out_dir, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        for shot in shots:
            page.goto(URL + shot["query"])
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(700)
            path = os.path.join(out_dir, shot["name"])
            for quality in (92, 88, 84, 80, 75, 70):
                page.screenshot(path=path, type="jpeg", quality=quality)
                if os.path.getsize(path) <= LIMIT:
                    break
            print(shot["name"], os.path.getsize(path), "bytes, quality", quality)
        browser.close()


if __name__ == "__main__":
    main()
