#!/usr/bin/env python3
"""Convert PreTeXt sources of *Understanding Linear Algebra* (chapters 1-4)
into VitePress Markdown, preserving LaTeX math verbatim.

Existing translated files are never overwritten unless --force is given.
"""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / "source-ula" / "src"
DOCS = ROOT / "docs"
SVG_URL = "https://understandinglinearalgebra.org/generated/prefigure/{}.svg"

CHAPTERS = {
    "1": ("chapter-1", "Systems of equations", [
        ("section1-1.xml", "1-1", "1.1"),
        ("section1-2.xml", "1-2", "1.2"),
        ("section1-3.xml", "1-3", "1.3"),
        ("section1-4.xml", "1-4", "1.4"),
    ]),
    "2": ("chapter-2", "Vectors, matrices, and linear combinations", [
        ("section2-1.xml", "2-1", "2.1"),
        ("section2-2.xml", "2-2", "2.2"),
        ("section2-3.xml", "2-3", "2.3"),
        ("section2-4.xml", "2-4", "2.4"),
        ("section2-5.xml", "2-5", "2.5"),
        ("section2-6.xml", "2-6", "2.6"),
    ]),
    "3": ("chapter-3", "Invertibility, bases, and coordinate systems", [
        ("section3-1.xml", "3-1", "3.1"),
        ("section3-2.xml", "3-2", "3.2"),
        ("section3-3.xml", "3-3", "3.3"),
        ("section3-4.xml", "3-4", "3.4"),
        ("section3-5.xml", "3-5", "3.5"),
    ]),
    "4": ("chapter-4", "Eigenvalues and eigenvectors", [
        ("section4-1.xml", "4-1", "4.1"),
        ("section4-2.xml", "4-2", "4.2"),
        ("section4-3.xml", "4-3", "4.3"),
        ("section4-4.xml", "4-4", "4.4"),
        ("section4-5.xml", "4-5", "4.5"),
    ]),
}

NUMBERED = {
    "activity", "exploration", "definition", "theorem", "proposition",
    "example", "observation", "principle", "exercise", "figure", "table",
}
PREFIX = {
    "activity": "活动", "exploration": "活动", "definition": "定义",
    "theorem": "定理", "proposition": "命题", "example": "例",
    "observation": "观察", "principle": "原理", "exercise": "练习",
    "figure": "图", "table": "表", "assemblage": "", "question": "",
}
SKIP = {"title", "caption", "shortdescription", "description", "idx",
        "query", "response", "feedback", "slate", "test", "cell", "fillin",
        "interactive", "webwork", "program", "listing"}

REG: dict[str, dict] = {}
TREES: dict[str, ET.Element] = {}
CTX = {"slug": "", "chapter": "1"}
FIGURES: dict[str, set] = {}
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"


def tag(e) -> str:
    return e.tag.split("}")[-1]


def xid(e) -> str:
    return e.get(XML_ID) or e.get("xml:id") or ""


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s)


def math_text(e) -> str:
    raw = "".join(e.itertext())
    raw = raw.replace("\\amp", "&")
    raw = re.sub(r"[ \t]*\n[ \t]*", "\n", raw)
    return raw.strip()


def display_math(e, force: bool = False) -> str:
    body = math_text(e)
    if not body:
        return ""
    if force or "\\begin{" not in body:
        body = "\\begin{aligned}\n" + body + "\n\\end{aligned}"
    return "$$\n" + body + "\n$$"


def render_xref(e) -> str:
    ref = e.get("ref", "")
    inner = inline(e).strip()
    info = REG.get(ref)
    if e.get("text") == "custom" and inner:
        text, anchor = inner, (info["anchor"] if info else "")
    elif info:
        if info["kind"] == "chapter":
            text = f"第 {info['num']} 章"
        elif info["kind"] == "section":
            text = f"第 {info['num']} 节"
        elif info["kind"] == "subsection":
            text = info["title"]
        elif info["kind"] == "li":
            text = f"（{info['num']}）"
        elif info["kind"] in ("assemblage", "question", "note", "table"):
            text = info["title"] or f"{PREFIX.get(info['kind'], '')} {info['num']}".strip()
        else:
            text = f"{PREFIX.get(info['kind'], '')} {info['num']}".strip()
        anchor = info["anchor"]
    else:
        text, anchor = inner or ref, ""
    if anchor and info:
        return f"[{text}](/chapter-{info['chapter']}/{info['slug']}#{anchor})"
    return text


def inline(e) -> str:
    out = [norm(e.text or "")]
    for ch in e:
        t = tag(ch)
        if t == "m":
            body = math_text(ch)
            if "\\begin{" in body:
                out.append("\n\n$$\n" + body + "\n$$\n\n")
            else:
                out.append("$" + body + "$")
        elif t in ("md", "me", "men"):
            out.append("\n\n" + display_math(ch) + "\n\n")
        elif t == "mrow":
            out.append("\n\n" + display_math(ch, True) + "\n\n")
        elif t == "em":
            out.append("*" + inline(ch).strip() + "*")
        elif t == "term":
            out.append("**" + inline(ch).strip() + "**")
        elif t == "q":
            out.append("“" + inline(ch).strip() + "”")
        elif t == "url":
            label = ch.get("visual") or inline(ch).strip() or ch.get("href")
            out.append(f"[{label}]({ch.get('href')})")
        elif t == "xref":
            out.append(render_xref(ch))
        elif t == "idx":
            pass
        elif t == "nbsp":
            out.append(" ")
        elif t == "amp":
            out.append("&")
        elif t == "lt":
            out.append("<")
        elif t == "gt":
            out.append(">")
        elif t == "fn":
            out.append("（" + inline(ch).strip() + "）")
        elif t in ("ol", "ul"):
            out.append("\n\n" + render_list(ch) + "\n\n")
        elif t == "dl":
            out.append("\n\n" + render_dl(ch) + "\n\n")
        elif t == "cd":
            out.append("`" + "".join(ch.itertext()).strip() + "`")
        elif t == "sage":
            out.append("\n\n" + render_sage(ch) + "\n\n")
        elif t in SKIP:
            pass
        else:
            out.append(inline(ch))
        out.append(norm(ch.tail or ""))
    s = "".join(out)
    return re.sub(r"[ \t]{2,}", " ", s)


def container(kind: str, title: str, body: str, fence: int = 6, anchor_id: str = "") -> str:
    body = body.strip()
    if not body:
        return ""
    bar = ":" * fence
    head = f"{bar} {kind}" + (f" {title}" if title else "")
    pre = f'<a id="{anchor_id}" class="ula-anchor"></a>\n\n' if anchor_id else ""
    return f"{pre}{head}\n\n{body}\n\n{bar}"


def details(title: str, body: str) -> str:
    body = body.strip()
    if not body:
        return ""
    return f"::::: details {title}\n\n{body}\n\n:::::"


BLOCKISH = {"p", "ol", "ul", "dl", "figure", "sidebyside", "sage", "cd",
            "activity", "exploration", "exercise", "definition", "theorem",
            "proposition", "example", "observation", "principle", "table"}


def flow(e) -> str:
    if any(tag(c) in BLOCKISH for c in e):
        return blocks(e).strip()
    return inline(e).strip()


def render_list(e) -> str:
    ordered = tag(e) == "ol"
    items = []
    for i, li in enumerate([c for c in e if tag(c) == "li"]):
        ttl = li.find("title")
        head = f"**{inline(ttl).strip()}** " if ttl is not None else ""
        aid = li.get("_anchor") or ""
        pre = f'<a id="{aid}" class="ula-anchor"></a> ' if aid else ""
        body = (pre + head + flow(li)).strip()
        if not body:
            continue
        marker = f"{i + 1}." if ordered else "-"
        items.append(f"{marker} " + body.replace("\n", "\n   "))
    if not items:
        return ""
    txt = "\n".join(items)
    return f"::: ula-alpha\n{txt}\n:::" if ordered else txt


def render_dl(e) -> str:
    parts = []
    for c in e:
        if tag(c) != "li":
            continue
        ttl = c.find("title")
        head = f"**{inline(ttl).strip()}** — " if ttl is not None else ""
        parts.append(head + flow(c).strip())
    return "::: ula-dl\n" + "\n\n".join(parts) + "\n:::"


def image_src(e) -> str:
    for c in e:
        if tag(c) == "prefigure":
            label = c.get("label") or ""
            if label:
                FIGURES.setdefault(CTX["chapter"], set()).add(label)
                return f"/figures/ch{CTX['chapter']}/{label}.svg"
    fr = e.get("fileref")
    if fr:
        return f"/figures/ch{CTX['chapter']}/" + Path(fr).name
    return ""


def esc_alt(s: str) -> str:
    return norm(s).replace("[", "(").replace("]", ")").strip()


def render_figure(e) -> str:
    srcs = []

    def collect(node):
        for c in node:
            t = tag(c)
            if t == "image":
                src = image_src(c)
                if src:
                    sd = c.find("shortdescription")
                    alt = esc_alt("".join(sd.itertext())) if sd is not None else ""
                    srcs.append((src, alt))
            elif t in ("sidebyside", "figure"):
                collect(c)

    collect(e)
    if not srcs:
        return ""
    if len(srcs) == 1:
        body = f"![{srcs[0][1]}]({srcs[0][0]})"
    else:
        body = "::: ula-sbs\n" + "\n\n".join(f"![{a}]({s})" for s, a in srcs) + "\n:::"
    cap = e.find("caption")
    caption = inline(cap).strip() if cap is not None else ""
    num = e.get("_num")
    if caption:
        label = f"**图 {num}** · " if num else ""
        body += f"\n\n{label}{caption}"
    return container("ula-figure", "", body, 4, anchor_id=xid(e))


def render_sidebyside(e) -> str:
    parts = []
    for c in e:
        t = tag(c)
        if t == "image":
            src = image_src(c)
            if src:
                parts.append(f"![]({src})")
        elif t in ("p", "ol", "ul", "dl", "figure", "sage", "cd", "table"):
            s = blocks_one(c)
            if s:
                parts.append(s)
    return "::: ula-sbs\n" + "\n\n".join(parts) + "\n:::"


def render_choices(e) -> str:
    opts, correct = [], []
    for i, c in enumerate([c for c in e if tag(c) == "choice"]):
        st = c.find("statement")
        txt = blocks(st).strip() if st is not None else ""
        letter = chr(65 + i)
        opts.append(f"**{letter}.** {txt}")
        if c.get("correct") == "yes":
            correct.append(letter)
    ans = "、".join(correct) if correct else "见解析"
    return "\n\n".join(opts) + "\n\n" + details("查看答案", f"正确答案：**{ans}**")


def render_match(e) -> str:
    matches = [c for c in e if tag(c) == "match"]
    left: list[str] = []
    groups: list[dict] = []
    for m in matches:
        pre = [blocks(p).strip() for p in m if tag(p) == "premise"]
        res = [blocks(r).strip() for r in m if tag(r) == "response"]
        start = len(left) + 1
        left.extend(pre)
        groups.append({"start": start, "end": len(left), "res": res})
    order = list(range(len(groups)))
    random.Random(7).shuffle(order)
    ltxt = "\n\n".join(f"**{i + 1}.**\n\n{t}" for i, t in enumerate(left))
    unreliable = any(len(g["res"]) != 1 or not g["res"][0].strip() for g in groups)
    if unreliable:
        note = "（原书在线版中为交互式配对/分类练习，提供可选项与即时反馈。）"
        return "::: ula-sbs\n**左侧**\n\n" + ltxt + "\n:::\n\n" + note
    rtxt = "\n\n".join(
        f"**{chr(65 + i)}.**\n\n" + "\n\n".join(groups[j]["res"])
        for i, j in enumerate(order)
    )
    ans = []
    for i, j in enumerate(order):
        g = groups[j]
        for n in range(g["start"], g["end"] + 1):
            ans.append(f"{n}–{chr(65 + i)}")
    ans.sort(key=lambda s: int(s.split("–")[0]))
    return (
        "::: ula-sbs\n**左侧**\n\n" + ltxt + "\n\n**右侧**\n\n" + rtxt
        + "\n:::\n\n" + details("查看参考配对", "，".join(ans))
    )


def render_sage(e) -> str:
    inp = e.find("input")
    code = "".join(inp.itertext()).strip("\n") if inp is not None else ""
    lines = [line.strip() for line in code.splitlines()]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "```python\n" + "\n".join(lines) + "\n```"


def render_table(e) -> str:
    tab = e.find("tabular")
    if tab is None:
        return ""
    rows = [r for r in tab if tag(r) == "row"]
    if not rows:
        return ""
    grid = []
    for r in rows:
        cells = []
        for c in r:
            if tag(c) != "cell":
                continue
            txt = flow(c).strip().replace("\n\n", "<br>").replace("|", "\\|")
            cells.append(txt)
        grid.append(cells)
    width = max(len(r) for r in grid)
    grid = [r + [""] * (width - len(r)) for r in grid]
    lines = ["| " + " | ".join(grid[0]) + " |",
             "| " + " | ".join(["---"] * width) + " |"]
    for r in grid[1:]:
        lines.append("| " + " | ".join(r) + " |")
    title_el = e.find("title")
    title = inline(title_el).strip() if title_el is not None else ""
    num = e.get("_num")
    head = f"**表 {num}** · {title}" if num and title else (title or "")
    pre = f'<a id="{xid(e)}" class="ula-anchor"></a>\n\n' if xid(e) else ""
    return pre + (head + "\n\n" if head else "") + "\n".join(lines)


def blocks_one(e) -> str:
    t = tag(e)
    if t == "p":
        return inline(e).strip()
    if t in ("ol", "ul"):
        return render_list(e)
    if t == "dl":
        return render_dl(e)
    if t == "sidebyside":
        return render_sidebyside(e)
    if t == "figure":
        return render_figure(e)
    if t == "sage":
        return render_sage(e)
    if t == "cd":
        return "`" + "".join(e.itertext()).strip() + "`"
    if t == "table":
        return render_table(e)
    return blocks(e)


def render_task(e, marker: str) -> str:
    st = e.find("statement")
    body = blocks(st).strip() if st is not None else ""
    extra = []
    chs = e.find("choices")
    if chs is not None:
        extra.append(render_choices(chs))
    ans = e.find("answer")
    if ans is not None:
        a = blocks(ans).strip()
        if a:
            extra.append("**答案**\n\n" + a)
    sol = e.find("solution")
    if sol is not None:
        s = blocks(sol).strip()
        if s:
            extra.append(s)
    if body.startswith("$$") or body.startswith("!["):
        out = f"**（{marker}）**\n\n{body}"
    else:
        out = f"**（{marker}）** {body}"
    if extra:
        out += "\n\n" + details("查看解答", "\n\n".join(extra))
    return out


def render_activity(e) -> str:
    num = e.get("_num", "")
    title_el = e.find("title")
    title = inline(title_el).strip() if title_el is not None else ""
    parts = []
    intro = e.find("introduction")
    if intro is not None:
        parts.append(blocks(intro).strip())
    tasks = [c for c in e if tag(c) == "task"]
    tasks = [
        t for t in tasks
        if blocks(t.find("statement") if t.find("statement") is not None else t).strip()
    ]
    for i, task in enumerate(tasks):
        parts.append(render_task(task, chr(97 + i)))
    if not tasks:
        st = e.find("statement")
        if st is not None:
            parts.append(blocks(st).strip())
        ans = e.find("answer")
        if ans is not None:
            parts.append(details("查看答案", blocks(ans).strip()))
    head = f"活动 {num}" + (f" · {title}" if title else "")
    return container("activity", head, "\n\n".join(p for p in parts if p), anchor_id=e.get("_anchor", ""))


def render_exercise(e) -> str:
    num = e.get("_num", "")
    title_el = e.find("title")
    title = inline(title_el).strip() if title_el is not None else ""
    parts = []
    intro = e.find("introduction")
    if intro is not None:
        parts.append(blocks(intro).strip())
    st = e.find("statement")
    if st is not None:
        parts.append(blocks(st).strip())
    for c in e:
        t = tag(c)
        if t in ("match", "cardsort"):
            parts.append(render_match(c))
        elif t == "choices":
            parts.append(render_choices(c))
        elif t == "blocks":
            for b in c:
                if tag(b) == "block":
                    parts.append(display_math(b))
    for i, task in enumerate([c for c in e if tag(c) == "task"]):
        parts.append(render_task(task, chr(97 + i)))
    head = f"练习 {num}" + (f" · {title}" if title else "")
    return container("exercise", head, "\n\n".join(p for p in parts if p), anchor_id=e.get("_anchor", ""))


def blocks(e) -> str:
    out = []
    for ch in e:
        t = tag(ch)
        if t in SKIP or ch.get("component", "").startswith("rs-"):
            continue
        if t in ("md", "me", "men"):
            out.append(display_math(ch))
        elif t == "mrow":
            out.append(display_math(ch, True))
        elif t == "m":
            body = math_text(ch)
            if "\\begin{" in body:
                out.append("\n\n$$\n" + body + "\n$$\n\n")
            else:
                out.append("$" + body + "$")
        elif t in ("introduction", "statement", "answer", "solution"):
            s = blocks(ch).strip()
            if s:
                out.append(s)
        elif t == "p":
            s = inline(ch).strip()
            if s:
                out.append(s)
        elif t in ("ol", "ul"):
            s = render_list(ch)
            if s:
                out.append(s)
        elif t == "dl":
            out.append(render_dl(ch))
        elif t in ("activity", "exploration"):
            out.append(render_activity(ch))
        elif t == "exercise":
            out.append(render_exercise(ch))
        elif t in ("definition", "theorem", "proposition", "example",
                   "observation", "principle"):
            num = ch.get("_num", "")
            title_el = ch.find("title")
            title = inline(title_el).strip() if title_el is not None else ""
            body = blocks(ch).strip()
            head = f"{PREFIX[t]} {num}" + (f" · {title}" if title else "")
            out.append(container(t, head, body, anchor_id=ch.get("_anchor", "")))
        elif t in ("assemblage", "question", "note", "remark", "notation"):
            title_el = ch.find("title")
            title = inline(title_el).strip() if title_el is not None else ""
            out.append(container("note", title, blocks(ch), anchor_id=xid(ch)))
        elif t == "proof":
            out.append(container("proof", "证明", blocks(ch)))
        elif t == "figure":
            out.append(render_figure(ch))
        elif t == "table":
            out.append(render_table(ch))
        elif t == "sidebyside":
            out.append(render_sidebyside(ch))
        elif t == "sage":
            out.append(render_sage(ch))
        elif t == "cd":
            out.append("`" + "".join(ch.itertext()).strip() + "`")
        elif t == "prefigure":
            src = image_src(ch)
            if src:
                out.append(f"![]({src})")
        else:
            s = blocks(ch).strip()
            if s:
                out.append(s)
    merged = []
    for p in out:
        if merged and re.fullmatch(r"[.,;:]+", p):
            merged[-1] += p
        else:
            merged.append(p)
    return "\n\n".join(p for p in merged if p)


# ---------------------------------------------------------------- numbering

def assign(chapter: str, section_file: str, slug: str, secnum: str) -> None:
    root = ET.parse(SRC / section_file).getroot()
    TREES[slug] = root
    title_el = root.find("title")
    REG[xid(root)] = {
        "kind": "section", "num": secnum, "slug": slug, "chapter": chapter,
        "anchor": "", "title": inline(title_el).strip() if title_el is not None else "",
    }
    counters: dict[str, int] = {}

    def walk(node, parent_tag):
        for sub in node:
            t = tag(sub)
            if t == "subsection":
                sid = xid(sub)
                st = sub.find("title")
                if sid:
                    REG[sid] = {
                        "kind": "subsection", "num": "", "slug": slug,
                        "chapter": chapter, "anchor": sid,
                        "title": inline(st).strip() if st is not None else "",
                    }
            if t in NUMBERED:
                if t == "figure" and parent_tag not in ("section", "subsection"):
                    walk(sub, t)
                    continue
                key = "activity" if t == "exploration" else t
                counters[key] = counters.get(key, 0) + 1
                sub.set("_num", f"{secnum}.{counters[key]}")
                anchor = sub.get("label") or xid(sub) or f"{slug}-{key}-{counters[key]}"
                sub.set("_anchor", anchor)
                REG[anchor] = {
                    "kind": key, "num": sub.get("_num"), "slug": slug,
                    "chapter": chapter, "anchor": anchor, "title": "",
                }
            walk(sub, t)

    walk(root, "section")
    for ol in root.iter():
        if tag(ol) not in ("ol", "ul"):
            continue
        for i, li in enumerate([c for c in ol if tag(c) == "li"]):
            lid = xid(li)
            if lid:
                li.set("_anchor", lid)
                REG[lid] = {"kind": "li", "num": chr(97 + i), "slug": slug,
                            "chapter": chapter, "anchor": lid, "title": ""}
    for el in root.iter():
        i = xid(el)
        if not i or i in REG:
            continue
        t = tag(el)
        if t in ("note", "assemblage", "question", "remark", "notation", "table"):
            tt = el.find("title")
            REG[i] = {
                "kind": t, "num": "", "slug": slug, "chapter": chapter,
                "anchor": i, "title": inline(tt).strip() if tt is not None else "",
            }


def register_chapter(chapter: str, title: str) -> None:
    REG[f"chap{chapter}"] = {
        "kind": "chapter", "num": chapter, "slug": "index", "chapter": chapter,
        "anchor": "", "title": title,
    }


def download_figures() -> None:
    for chapter, labels in FIGURES.items():
        figdir = DOCS / "public" / "figures" / f"ch{chapter}"
        figdir.mkdir(parents=True, exist_ok=True)
        for label in sorted(labels):
            dest = figdir / f"{label}.svg"
            if dest.exists() and dest.stat().st_size > 200:
                continue
            try:
                req = urllib.request.Request(
                    SVG_URL.format(label), headers={"User-Agent": "Mozilla/5.0"}
                )
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = r.read()
                if b"<svg" not in data[:500]:
                    print(f"  ! not svg: {label}")
                    continue
                dest.write_bytes(data)
                print(f"  + ch{chapter}/{label}.svg ({len(data) // 1024} KB)")
            except Exception as exc:  # noqa: BLE001
                print(f"  ! failed {label}: {exc}")


def extract_macros() -> None:
    text = (SRC / "bookinfo.xml").read_text()
    macros = {}
    i = 0
    while True:
        m = re.search(r"\\newcommand\{\\(\w+)\}", text[i:])
        if not m:
            break
        name = m.group(1)
        pos = i + m.end()
        m2 = re.match(r"\[(\d)\]", text[pos:])
        if m2:
            pos += m2.end()
        while pos < len(text) and text[pos].isspace():
            pos += 1
        if pos >= len(text) or text[pos] != "{":
            i = pos
            continue
        depth, start = 0, pos
        while pos < len(text):
            if text[pos] == "{":
                depth += 1
            elif text[pos] == "}":
                depth -= 1
                if depth == 0:
                    break
            pos += 1
        body = text[start + 1:pos].strip()
        macros["\\" + name] = body
        i = pos + 1
    out = DOCS / ".vitepress" / "theme" / "katex-macros.json"
    out.write_text(json.dumps(macros, ensure_ascii=False, indent=2) + "\n")
    print(f"macros: {len(macros)}")


def main() -> None:
    force = "--force" in sys.argv
    for chapter, (folder, ctitle, sections) in CHAPTERS.items():
        register_chapter(chapter, ctitle)
        for f, slug, num in sections:
            assign(chapter, f, slug, num)

    for chapter, (folder, ctitle, sections) in CHAPTERS.items():
        outdir = DOCS / folder
        outdir.mkdir(parents=True, exist_ok=True)
        for f, slug, num in sections:
            CTX["slug"] = slug
            CTX["chapter"] = chapter
            root = TREES[slug]
            title_el = root.find("title")
            title = inline(title_el).strip() if title_el is not None else ""
            body = blocks(root)
            front = f'---\ntitle: "{num} {title}"\n---\n\n# {num} {title}\n\n'
            target = outdir / f"{slug}.md"
            if target.exists() and not force:
                print(f"skip {folder}/{slug}.md")
                continue
            target.write_text(front + body + "\n", encoding="utf-8")
            print(f"wrote {folder}/{slug}.md  {len(body)} chars")

    download_figures()
    extract_macros()


if __name__ == "__main__":
    main()
