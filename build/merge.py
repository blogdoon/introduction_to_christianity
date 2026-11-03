#!/usr/bin/env python3
"""Merge content + nuance JSONs into src/content.js, validating as we go."""
import json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORDER = ["content-intro.json", "content-part1.json", "content-p2a.json", "content-p2b.json", "content-part3.json"]
NUANCE_FILES = {"content-intro.json": "nuance-intro.json", "content-part1.json": "nuance-p1.json",
                "content-p2a.json": "nuance-p2a.json", "content-p2b.json": "nuance-p2b3.json",
                "content-part3.json": "nuance-p2b3.json"}
PART_ORDER = {"intro": 0, "one": 1, "two": 2, "three": 3}

BOOK = (ROOT / "build" / "book.txt").read_text(encoding="utf-8").split("\f")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).lower()
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = re.sub(r"[\s\u00a0]+", " ", s)
    return s.strip()


def check_quote(where, quote, page_a, page_b, errors):
    if not (1 <= page_a <= page_b <= len(BOOK)):
        errors.append(f"{where} bad page range [{page_a}, {page_b}]")
        return
    window = norm(" ".join(BOOK[page_a - 1 : page_b]))
    if norm(quote) not in window:
        errors.append(f"{where} quote not verbatim in pages {page_a}-{page_b}: {quote!r}")


def article_for(cid: str, title: str) -> int:
    t = title.lower()
    if cid.startswith(("intro", "p1")):
        return 0
    if cid.startswith("p2a") or cid in ("p2b-1", "p2b-8"):
        return 1
    if "conceived by the power" in t:
        return 2
    if "pontius pilate" in t:
        return 3
    if "descended" in t:
        return 4
    if "rose again" in t:
        return 5
    if "ascended" in t:
        return 6
    if "judge the living" in t:
        return 7
    if cid.startswith("p3"):
        if "catholic" in t:
            return 9
        if "resurrection of the body" in t:
            return 11
        if "holy spirit" in t:
            return 8
        return 11
    return 0


errors, cards, parts, seen_ids = [], [], [], set()

# ── base cards ──────────────────────────────────────────────────
for fname in ORDER:
    path = ROOT / "src" / fname
    if not path.exists():
        errors.append(f"MISSING {fname}")
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    parts.append({"id": data["part"], "title": data["partTitle"], "creedLine": data["creedLine"]})
    for i, c in enumerate(data["cards"], 1):
        cid = c.get("id", f"{fname}-{i}")
        where = f"{fname}:{cid}"
        if cid in seen_ids:
            errors.append(f"{where} duplicate id")
        seen_ids.add(cid)
        for field in ("section", "title", "idea", "before", "after", "why", "quote", "recall", "tags"):
            if not c.get(field):
                errors.append(f"{where} missing {field}")
        if len(c.get("idea", "").split()) > 30:
            errors.append(f"{where} idea is {len(c['idea'].split())} words (max 30)")
        if len(c.get("cloze", [])) != 3:
            errors.append(f"{where} needs exactly 3 cloze items, has {len(c.get('cloze', []))}")
        else:
            for j, cl in enumerate(c["cloze"]):
                if not cl.get("blank") or any(k not in cl for k in ("pre", "blank", "post")):
                    errors.append(f"{where} cloze {j+1} incomplete")
        a, b = c.get("pages", [0, 0])
        check_quote(f"{where} quote", c.get("quote", "x"), a, b, errors)
        c.setdefault("order", i)
        c["article"] = article_for(cid, c.get("title", ""))
        c["part"] = data["part"]
        cards.append(c)

# ── nuance: misreading / argument / rubric per card ─────────────
nuance_by_id = {}
for fname, nfname in sorted(set(NUANCE_FILES.items())):
    path = ROOT / "src" / nfname
    if not path.exists():
        errors.append(f"MISSING {nfname}")
        continue
    for n in json.loads(path.read_text(encoding="utf-8"))["cards"]:
        nuance_by_id[n["id"]] = n

for c in cards:
    n = nuance_by_id.get(c["id"])
    where = f"nuance:{c['id']}"
    if not n:
        errors.append(f"{where} missing")
        continue
    m = n.get("misreading") or {}
    if not all(m.get(k) for k in ("wrong", "right", "quote", "page")):
        errors.append(f"{where} misreading incomplete")
    else:
        check_quote(f"{where} misreading.quote", m["quote"], m["page"], m["page"], errors)
    arg = n.get("argument") or {}
    if not all(arg.get(k) for k in ("tension", "move", "payoff")):
        errors.append(f"{where} argument incomplete")
    rub = n.get("rubric") or []
    if len(rub) != 3:
        errors.append(f"{where} rubric needs 3 elements, has {len(rub)}")
    c["misreading"] = m
    c["argument"] = arg
    c["rubric"] = rub

# ── glossary / thinkers / corrections / scripture / creed words ─
def load_nuance_list(fname, key, lo, hi, required, quote_page=True):
    path = ROOT / "src" / fname
    if not path.exists():
        errors.append(f"MISSING {fname}")
        return []
    items = json.loads(path.read_text(encoding="utf-8")).get(key, [])
    if not (lo <= len(items) <= hi):
        errors.append(f"{fname}: {len(items)} {key} (want {lo}-{hi})")
    ids = set()
    for it in items:
        where = f"{fname}:{it.get('id') or it.get('word') or it.get('ref')}"
        for f in required:
            if it.get(f) in (None, ""):
                errors.append(f"{where} missing {f}")
        key = it.get("id") or it.get("word") or it.get("ref")
        if key in ids:
            errors.append(f"{where} duplicate id")
        ids.add(key)
        if quote_page:
            check_quote(f"{where} quote", it.get("quote", "x"), it.get("page", 0), it.get("page", 0), errors)
        for cid in it.get("cards", []):
            if cid not in seen_ids:
                errors.append(f"{where} links unknown card {cid}")
    return items


glossary = load_nuance_list("nuance-glossary.json", "terms", 24, 40,
                            ["id", "term", "origin", "definition", "nuance", "page"], quote_page=False)
thinkers = load_nuance_list("nuance-thinkers.json", "thinkers", 10, 16,
                            ["id", "name", "tradition", "claim", "counter", "quote", "page"])
corrections = load_nuance_list("nuance-context.json", "corrections", 4, 8,
                               ["id", "year", "title", "what", "quote", "page"])
scripture = load_nuance_list("nuance-context.json", "scripture", 6, 12,
                             ["id", "ref", "text", "ratzinger", "page"], quote_page=False)
creed_words = load_nuance_list("nuance-creed.json", "words", 10, 16,
                               ["word", "article", "means", "excludes", "quote", "page"])
for w in creed_words:
    if not (0 <= w.get("article", -1) <= 11):
        errors.append(f"nuance-creed.json:{w.get('word')} bad article {w.get('article')}")

cards.sort(key=lambda c: (PART_ORDER.get(c["part"], 9), c["order"]))
seen_parts, uniq_parts = set(), []
for p in sorted(parts, key=lambda p: PART_ORDER.get(p["id"], 9)):
    if p["id"] not in seen_parts:
        seen_parts.add(p["id"])
        uniq_parts.append(p)

if errors:
    print("\n".join(errors))
    sys.exit(1)

out = {"parts": uniq_parts, "cards": cards, "glossary": glossary, "thinkers": thinkers,
       "corrections": corrections, "scripture": scripture, "creedWords": creed_words}
(ROOT / "src" / "content.js").write_text(
    "window.SITE = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8"
)
print(f"content.js written: {len(cards)} cards, {len(glossary)} terms, {len(thinkers)} thinkers, "
      f"{len(corrections)} corrections, {len(scripture)} scripture, {len(creed_words)} creed words")
