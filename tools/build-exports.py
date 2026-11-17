#!/usr/bin/env python3
"""Generate the two single-file exports from index.html.

    python3 -I tools/build-exports.py

Outputs (both are GENERATED — never hand-edit them):

  pelican-lake-cup-single.html
      index.html with css/style.css and js/main.js inlined. Images are still
      relative paths, so keep it next to the image files.

  pelican-lake-cup-portable.html
      The same, plus every local image inlined as a base64 data URI. One file,
      no sibling assets — mail it, print it, open it offline.

Google Fonts stay as an external <link> in both; the stylesheet declares serif
and sans-serif fallbacks, so an offline open still renders correctly.

Standard library only. No npm, no build tooling, no dependencies.
"""

from __future__ import annotations

import base64
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SOURCE = ROOT / "index.html"
CSS = ROOT / "css" / "style.css"
JS = ROOT / "js" / "main.js"

SINGLE = ROOT / "pelican-lake-cup-single.html"
PORTABLE = ROOT / "pelican-lake-cup-portable.html"

BANNER = (
    "<!-- GENERATED FILE — do not edit by hand.\n"
    "     Source: index.html + css/style.css + js/main.js\n"
    "     Rebuild: python3 -I tools/build-exports.py -->\n"
)

# Local asset references worth inlining for the portable build. Only src= and
# url() are matched: the favicon and the og:image use href=/content= and are
# irrelevant to an offline render, so they stay as paths and stay small.
ASSET_RE = re.compile(r"""(src=|url\()(['"]?)([A-Za-z0-9._-]+\.(?:png|jpg|jpeg|gif|svg|webp))\2""")


def inline_assets(html: str) -> str:
    """Rewrite local image references as base64 data URIs."""
    cache: dict[str, str] = {}

    def encode(name: str) -> str | None:
        if name in cache:
            return cache[name]
        path = ROOT / name
        if not path.is_file():
            print(f"  ! missing asset, left as a path: {name}", file=sys.stderr)
            return None
        mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
        data = base64.b64encode(path.read_bytes()).decode("ascii")
        cache[name] = f"data:{mime};base64,{data}"
        return cache[name]

    def swap(match: re.Match[str]) -> str:
        prefix, quote, name = match.group(1), match.group(2), match.group(3)
        encoded = encode(name)
        if encoded is None:
            return match.group(0)
        # A data URI must be quoted inside url(), so force quotes when missing.
        q = quote or "'"
        return f"{prefix}{q}{encoded}{q}"

    return ASSET_RE.sub(swap, html)


def build() -> int:
    for required in (SOURCE, CSS, JS):
        if not required.is_file():
            print(f"missing required file: {required}", file=sys.stderr)
            return 1

    html = SOURCE.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")

    link = '<link rel="stylesheet" href="css/style.css">'
    script = '<script src="js/main.js"></script>'

    if link not in html or script not in html:
        print("index.html no longer links css/style.css and js/main.js as expected", file=sys.stderr)
        return 1

    bundled = html.replace(link, "<style>\n" + css + "\n</style>", 1)
    bundled = bundled.replace(script, "<script>\n" + js + "\n</script>", 1)
    bundled = bundled.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n" + BANNER, 1)

    SINGLE.write_text(bundled, encoding="utf-8")
    print(f"  wrote {SINGLE.name} ({SINGLE.stat().st_size / 1024:.0f} KB)")

    PORTABLE.write_text(inline_assets(bundled), encoding="utf-8")
    print(f"  wrote {PORTABLE.name} ({PORTABLE.stat().st_size / 1024:.0f} KB)")

    return 0


if __name__ == "__main__":
    raise SystemExit(build())
