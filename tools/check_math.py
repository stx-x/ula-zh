#!/usr/bin/env python3
"""Compare math, figures and anchors between the English baseline and the
Chinese translation, so that no formula silently changes during translation."""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "tools" / "baseline"
DOCS = ROOT / "docs"

MATH = re.compile(r"\$\$(.+?)\$\$|(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)", re.S)
IMG = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
ANCHOR = re.compile(r'<a id="([^"]+)"')
CONTAINER = re.compile(r"^:{3,}[ \t]+(activity|definition|theorem|proposition|example|observation|principle|exercise|note|proof|details|ula-figure)\b", re.M)


def norm(s: str) -> str:
    s = s.replace("\\amp", "&")
    return re.sub(r"\s+", " ", s).strip()


def extract(text: str) -> Counter:
    flat = re.sub(r"\s+", " ", text)
    return Counter(norm(m.group(1) or m.group(2)) for m in MATH.finditer(flat))


def main(slugs: list[str]) -> int:
    bad = 0
    for slug in slugs:
        en = (BASE / f"{slug}.md").read_text()
        zh = (DOCS / f"chapter-{slug[0]}" / f"{slug}.md").read_text()
        en_m, zh_m = extract(en), extract(zh)
        problems = []
        if set(en_m) != set(zh_m):
            missing = Counter({k: 1 for k in set(en_m) - set(zh_m)})
            extra = Counter({k: 1 for k in set(zh_m) - set(en_m)})
            if missing:
                problems.append(f"公式缺失 {sum(missing.values())} 处：")
                for k, _ in list(missing.items())[:6]:
                    problems.append(f"    - {k[:140]}")
            if extra:
                problems.append(f"公式多出 {sum(extra.values())} 处：")
                for k, _ in list(extra.items())[:6]:
                    problems.append(f"    + {k[:140]}")
        en_img, zh_img = Counter(IMG.findall(en)), Counter(IMG.findall(zh))
        if en_img != zh_img:
            problems.append(f"图片不一致: 缺失 {en_img - zh_img} 多出 {zh_img - en_img}")
        en_a, zh_a = Counter(ANCHOR.findall(en)), Counter(ANCHOR.findall(zh))
        if en_a != zh_a:
            problems.append(f"锚点不一致: 缺失 {en_a - zh_a} 多出 {zh_a - en_a}")
        en_c, zh_c = Counter(CONTAINER.findall(en)), Counter(CONTAINER.findall(zh))
        if en_c != zh_c:
            problems.append(f"容器数量不一致: {en_c} vs {zh_c}")
        if problems:
            bad += 1
            print(f"✗ {slug}")
            for p in problems:
                print("  " + p)
        else:
            print(
                f"✓ {slug}  公式 {sum(en_m.values())} 条，图片 {sum(en_img.values())} 张，"
                f"锚点 {sum(en_a.values())} 个"
            )
    return bad


if __name__ == "__main__":
    slugs = sys.argv[1:] or ["1-1", "1-2", "1-3", "1-4"]
    sys.exit(1 if main(slugs) else 0)
