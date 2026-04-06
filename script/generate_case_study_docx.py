from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = REPO_ROOT / "docs" / "datumx-case-study.md"
OUTPUT_PATH = REPO_ROOT / "output" / "doc" / "DatumX-Case-Study.docx"
LOGO_PATH = REPO_ROOT / "New folder" / "DatumX-removebg-preview.png"

PRIMARY = RGBColor(33, 36, 41)
SECONDARY = RGBColor(89, 95, 102)
ACCENT = RGBColor(117, 97, 64)
ACCENT_LIGHT = RGBColor(242, 237, 227)
RULE = RGBColor(203, 195, 180)

AUTHOR_NAME = "ZRT"
AUTHOR_ROLES = "Smart Contract Engineer | Blockchain Systems Engineer | Web3 Infrastructure Engineer"
AUTHOR_META = "Canada AB | github.com/zrt219 | linkedin.com/in/zhane-grey-987258395"
AUTHOR_SUMMARY = (
    "Blockchain engineer with 6 live contracts deployed across 5 networks, specializing in "
    "production-grade Solidity and full-stack Web3 execution layers. Extensive hands-on experience "
    "on XRPL EVM Sidechain - including reverse-engineering undocumented RPC incompatibilities "
    "(eth_estimateGas / eth_gasPrice absent), implementing legacy tx overrides, and bypassing "
    "Foundry simulation for non-standard EVM environments. Architects dependency-free, zero-backend "
    "systems with forward-only state machines, per-record access control, and integer-encoded domain "
    "values - designed to minimize attack surface and maximize auditability. Owns the full stack: "
    "contract architecture -> security invariants -> frontend execution -> deployment tooling."
)

CALLOUTS = {
    1: (
        "Core Thesis",
        "DatumX does not frame industrial data as a storage problem. It frames transformed releases as "
        "governed analytical units that need explicit provenance, review, consensus, and closure."
    ),
    6: (
        "Key Innovation",
        "The adapter boundary is where project-specific messiness becomes canonical release structure. "
        "That separation keeps the protocol core strict while letting each project normalize its own inputs."
    ),
    8: (
        "Role Separation",
        "Validator-only reviews and auditor-only finalization split technical judgment from release closure. "
        "That separation is one of DatumX's strongest integrity decisions."
    ),
    11: (
        "Live Proof",
        "The XRPL EVM deployment matters because DatumX already demonstrated a live root -> child lineage path, "
        "with thresholds restored after the fast-path exercise."
    ),
}

MOJIBAKE_REPLACEMENTS = {
    "\ufeff": "",
    "\u00a0": " ",
    "â€”": "-",
    "â€“": "-",
    "â€™": "'",
    "â€œ": '"',
    "â€": '"',
    "â€¦": "...",
    "â†’": "->",
    "â€": '"',
    "Â·": " | ",
    "Â": "",
    "—": "-",
    "–": "-",
    "’": "'",
    "“": '"',
    "”": '"',
    "…": "...",
    "→": "->",
    "·": " | ",
}


def normalize_text(text: str) -> str:
    for old, new in MOJIBAKE_REPLACEMENTS.items():
        text = text.replace(old, new)
    text = text.replace("**", "")
    text = text.replace("`", "")
    return re.sub(r"\s+", " ", text).strip()


def set_paragraph_spacing(paragraph, before: int = 0, after: int = 0, line: float | None = None) -> None:
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    if line is not None:
        fmt.line_spacing = line


def set_section_margins(section) -> None:
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.95)
    section.right_margin = Inches(0.95)


def add_run(paragraph, text: str, *, font_name: str, size: float, bold: bool = False, italic: bool = False, color=PRIMARY):
    run = paragraph.add_run(text)
    run.font.name = font_name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return run


def ensure_style(document: Document, name: str, style_type: WD_STYLE_TYPE):
    try:
        return document.styles[name]
    except KeyError:
        return document.styles.add_style(name, style_type)


def configure_styles(document: Document) -> None:
    normal = document.styles["Normal"]
    normal.font.name = "Georgia"
    normal.font.size = Pt(11.25)
    normal.font.color.rgb = PRIMARY
    normal.paragraph_format.space_after = Pt(8)
    normal.paragraph_format.line_spacing = 1.18

    body = ensure_style(document, "DatumX Body", WD_STYLE_TYPE.PARAGRAPH)
    body.base_style = normal
    body.font.name = "Georgia"
    body.font.size = Pt(11.25)
    body.font.color.rgb = PRIMARY
    body.paragraph_format.space_after = Pt(8)
    body.paragraph_format.line_spacing = 1.18

    label = ensure_style(document, "DatumX Label", WD_STYLE_TYPE.PARAGRAPH)
    label.base_style = normal
    label.font.name = "Aptos"
    label.font.size = Pt(8.5)
    label.font.bold = True
    label.font.color.rgb = ACCENT
    label.paragraph_format.space_after = Pt(3)

    section_title = ensure_style(document, "DatumX Section Title", WD_STYLE_TYPE.PARAGRAPH)
    section_title.base_style = normal
    section_title.font.name = "Aptos Display"
    section_title.font.size = Pt(18)
    section_title.font.bold = True
    section_title.font.color.rgb = PRIMARY
    section_title.paragraph_format.space_before = Pt(0)
    section_title.paragraph_format.space_after = Pt(8)
    section_title.paragraph_format.keep_with_next = True

    small = ensure_style(document, "DatumX Small", WD_STYLE_TYPE.PARAGRAPH)
    small.base_style = normal
    small.font.name = "Aptos"
    small.font.size = Pt(9.5)
    small.font.color.rgb = SECONDARY
    small.paragraph_format.space_after = Pt(4)

    callout = ensure_style(document, "DatumX Callout", WD_STYLE_TYPE.PARAGRAPH)
    callout.base_style = normal
    callout.font.name = "Georgia"
    callout.font.size = Pt(12)
    callout.font.italic = True
    callout.font.color.rgb = PRIMARY
    callout.paragraph_format.space_after = Pt(3)
    callout.paragraph_format.line_spacing = 1.15


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color: str = "CBC3B4", size: str = "8") -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.find(qn("w:tcBorders"))
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        element = borders.find(qn(f"w:{edge}"))
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_paragraph_border(paragraph, edge: str = "bottom", color: str = "CBC3B4", size: str = "10") -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    border = p_bdr.find(qn(f"w:{edge}"))
    if border is None:
        border = OxmlElement(f"w:{edge}")
        p_bdr.append(border)
    border.set(qn("w:val"), "single")
    border.set(qn("w:sz"), size)
    border.set(qn("w:space"), "1")
    border.set(qn("w:color"), color)


def add_page_field(paragraph) -> None:
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_end)


def add_toc_field(paragraph) -> None:
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = ' TOC \\o "1-2" \\h \\z \\u '
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    placeholder = OxmlElement("w:t")
    placeholder.text = "Update table of contents in Word to refresh page references."
    placeholder_run = OxmlElement("w:r")
    placeholder_run.append(placeholder)
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    paragraph._p.append(begin)
    paragraph._p.append(instr)
    paragraph._p.append(separate)
    paragraph._p.append(placeholder_run)
    paragraph._p.append(end)


def extract_sections(markdown_text: str) -> list[tuple[int, str]]:
    sections: list[tuple[int, str]] = []
    for raw_line in markdown_text.splitlines():
        line = normalize_text(raw_line)
        if not line.startswith("## "):
            continue
        match = re.match(r"^(\d+)\.\s+(.*)$", line[3:])
        if match:
            sections.append((int(match.group(1)), match.group(2)))
    return sections


def set_page_number_start(section, start: int) -> None:
    sect_pr = section._sectPr
    pg_num = sect_pr.find(qn("w:pgNumType"))
    if pg_num is None:
        pg_num = OxmlElement("w:pgNumType")
        sect_pr.append(pg_num)
    pg_num.set(qn("w:start"), str(start))


def configure_header_footer(section) -> None:
    section.header.is_linked_to_previous = False
    section.footer.is_linked_to_previous = False

    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    header.clear()
    add_run(header, "DATUMX PROTOCOL CASE STUDY", font_name="Aptos", size=8.5, bold=True, color=SECONDARY)
    set_paragraph_spacing(header, after=0)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    footer.clear()
    add_run(footer, "Page ", font_name="Aptos", size=9, color=SECONDARY)
    add_page_field(footer)
    set_paragraph_spacing(footer, after=0)


def add_cover_page(document: Document) -> None:
    if LOGO_PATH.exists():
        logo = document.add_paragraph()
        logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        logo_run = logo.add_run()
        logo_run.add_picture(str(LOGO_PATH), width=Inches(1.85))
        set_paragraph_spacing(logo, before=10, after=10)

    label = document.add_paragraph(style="DatumX Label")
    label.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(label, "PROTOCOL DOSSIER", font_name="Aptos", size=9, bold=True, color=ACCENT)

    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(
        title,
        "DatumX - Verifying AI-Transformed Exploration Data with On-Chain Provenance and Consensus Validation",
        font_name="Aptos Display",
        size=24,
        bold=True,
        color=PRIMARY,
    )
    set_paragraph_spacing(title, before=42, after=12, line=1.02)

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(
        subtitle,
        "A technical case study on trusted transformed industrial datasets, canonical payload design, "
        "deterministic lineage, validator review, and XRPL EVM deployment realities.",
        font_name="Georgia",
        size=12,
        italic=True,
        color=SECONDARY,
    )
    set_paragraph_spacing(subtitle, after=18, line=1.15)

    motif = document.add_table(rows=1, cols=1)
    motif.alignment = WD_TABLE_ALIGNMENT.CENTER
    motif.autofit = False
    motif.columns[0].width = Inches(3.8)
    motif_cell = motif.cell(0, 0)
    set_cell_shading(motif_cell, "F8F4EC")
    set_cell_border(motif_cell, color="B99D72", size="12")
    motif_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    motif_text = motif_cell.paragraphs[0]
    motif_text.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(motif_text, "CANONICAL PAYLOADS | DETERMINISTIC LINEAGE | CONSENSUS VALIDATION", font_name="Aptos", size=8.8, bold=True, color=ACCENT)
    set_paragraph_spacing(motif_text, before=5, after=5)

    band = document.add_table(rows=1, cols=1)
    band.alignment = WD_TABLE_ALIGNMENT.CENTER
    band.autofit = True
    cell = band.cell(0, 0)
    set_cell_shading(cell, "F2EDE3")
    set_cell_border(cell, color="C2B59B", size="10")
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    meta = cell.paragraphs[0]
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(meta, "DatumX Protocol | Built by ZRT | XRPL EVM Testnet", font_name="Aptos", size=10.5, bold=True, color=PRIMARY)
    set_paragraph_spacing(meta, before=6, after=6)

    intro = document.add_paragraph()
    intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(
        intro,
        "This document presents DatumX as infrastructure for proving that AI-transformed industrial releases "
        "are reviewable, traceable, and decision-worthy after multiple computational and human interventions.",
        font_name="Georgia",
        size=11.5,
        color=PRIMARY,
    )
    set_paragraph_spacing(intro, before=22, after=0, line=1.2)


def add_author_profile_page(document: Document) -> None:
    label = document.add_paragraph(style="DatumX Label")
    add_run(label, "BUILDER PROFILE", font_name="Aptos", size=9, bold=True, color=ACCENT)
    set_paragraph_spacing(label, before=8, after=3)

    name = document.add_paragraph()
    add_run(name, AUTHOR_NAME, font_name="Aptos Display", size=22, bold=True, color=PRIMARY)
    set_paragraph_spacing(name, after=3)

    roles = document.add_paragraph(style="DatumX Small")
    add_run(roles, AUTHOR_ROLES, font_name="Aptos", size=10.5, bold=True, color=SECONDARY)
    set_paragraph_spacing(roles, after=4)

    meta = document.add_paragraph(style="DatumX Small")
    add_run(meta, AUTHOR_META, font_name="Aptos", size=10, color=SECONDARY)
    set_paragraph_spacing(meta, after=14)

    summary_label = document.add_paragraph(style="DatumX Label")
    add_run(summary_label, "SUMMARY", font_name="Aptos", size=9, bold=True, color=ACCENT)
    set_paragraph_spacing(summary_label, after=4)

    table = document.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = True
    cell = table.cell(0, 0)
    set_cell_shading(cell, "F7F5F0")
    set_cell_border(cell, color="D4CCBF", size="10")
    cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
    paragraph = cell.paragraphs[0]
    paragraph.style = document.styles["DatumX Body"]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    add_run(paragraph, AUTHOR_SUMMARY, font_name="Georgia", size=11.25, color=PRIMARY)
    set_paragraph_spacing(paragraph, before=10, after=10, line=1.18)


def add_contents_page(document: Document, sections: list[tuple[int, str]]) -> None:
    heading = document.add_paragraph(style="DatumX Section Title")
    add_run(heading, "Contents", font_name="Aptos Display", size=18, bold=True, color=PRIMARY)
    set_paragraph_spacing(heading, after=6)
    set_paragraph_border(heading, edge="bottom")

    note = document.add_paragraph(style="DatumX Small")
    add_run(note, "Structured section map for the DatumX protocol dossier.", font_name="Aptos", size=9.5, italic=True, color=SECONDARY)
    set_paragraph_spacing(note, after=10)

    table = document.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = True
    headers = table.rows[0].cells
    for idx, text in enumerate(["Section", "Topic"]):
        set_cell_shading(headers[idx], "EFE8DA")
        set_cell_border(headers[idx], color="C4B89F", size="10")
        p = headers[idx].paragraphs[0]
        add_run(p, text, font_name="Aptos", size=9.5, bold=True, color=PRIMARY)
        set_paragraph_spacing(p, before=3, after=3)

    for number, title in sections:
        row = table.add_row().cells
        set_cell_border(row[0], color="D4CCBF", size="8")
        set_cell_border(row[1], color="D4CCBF", size="8")
        p0 = row[0].paragraphs[0]
        add_run(p0, f"{number:02d}", font_name="Aptos", size=10.5, bold=True, color=ACCENT)
        set_paragraph_spacing(p0, before=3, after=3)
        p1 = row[1].paragraphs[0]
        add_run(p1, title, font_name="Georgia", size=10.8, color=PRIMARY)
        set_paragraph_spacing(p1, before=3, after=3, line=1.08)

    spacer = document.add_paragraph()
    set_paragraph_spacing(spacer, after=4)


def add_protocol_diagram_page(document: Document) -> None:
    label = document.add_paragraph(style="DatumX Label")
    add_run(label, "PROTOCOL SCHEMA", font_name="Aptos", size=9, bold=True, color=ACCENT)
    set_paragraph_spacing(label, before=8, after=2)

    title = document.add_paragraph(style="DatumX Section Title")
    add_run(title, "How a transformed release becomes decision-grade", font_name="Aptos Display", size=18, bold=True, color=PRIMARY)
    set_paragraph_spacing(title, after=8)
    set_paragraph_border(title, edge="bottom")

    intro = document.add_paragraph(style="DatumX Small")
    add_run(
        intro,
        "The protocol separates normalization, registration, review, and closure so each release passes through an explicit trust boundary before downstream use.",
        font_name="Aptos",
        size=9.8,
        color=SECONDARY,
    )
    set_paragraph_spacing(intro, after=12, line=1.12)

    add_visual_table(
        document,
        "Release pathway",
        ["Phase", "Protocol Action", "Trust Outcome"],
        [
            ["1. Adapter normalization", "Project adapter receives typed payload and emits canonical dataset input.", "Project-specific messiness is constrained before entering the core registry."],
            ["2. Canonical registration", "Router forwards normalized release into DatasetRegistry.", "The release gets a durable identity, project binding, and lineage anchor."],
            ["3. Validator review", "Assigned validators submit approval and confidence judgments.", "Consensus becomes explicit instead of implied by operator workflow."],
            ["4. Auditor finalization", "Auditor closes only approved releases that still satisfy thresholds.", "The dataset becomes decision-grade and eligible to parent the next stage."],
        ],
    )

    add_visual_table(
        document,
        "Operational lanes",
        ["Lane", "Primary Components", "Why It Matters"],
        [
            ["Normalization", "Adapters + ProjectRouter", "Keeps domain-specific input rules out of the canonical registry core."],
            ["Integrity", "DatasetRegistry + DatasetGraph", "Enforces duplicate protection, finalized-parent rules, and no-branch lineage."],
            ["Consensus", "ValidationModule + Access roles", "Separates validator judgment from auditor-controlled release closure."],
        ],
    )


def add_callout(document: Document, label_text: str, body_text: str) -> None:
    table = document.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = True
    cell = table.cell(0, 0)
    set_cell_shading(cell, "F5F1E8")
    set_cell_border(cell, color="BCA98A", size="12")
    cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP

    label = cell.paragraphs[0]
    add_run(label, label_text.upper(), font_name="Aptos", size=8.5, bold=True, color=ACCENT)
    set_paragraph_spacing(label, before=6, after=2)

    body = cell.add_paragraph(style="DatumX Callout")
    add_run(body, body_text, font_name="Georgia", size=12, italic=True, color=PRIMARY)
    set_paragraph_spacing(body, after=8, line=1.12)

    spacer = document.add_paragraph()
    set_paragraph_spacing(spacer, after=4)


def add_visual_table(document: Document, title_text: str, columns: list[str], rows: list[list[str]]) -> None:
    label = document.add_paragraph(style="DatumX Label")
    add_run(label, title_text.upper(), font_name="Aptos", size=8.5, bold=True, color=ACCENT)
    set_paragraph_spacing(label, before=6, after=4)

    table = document.add_table(rows=1, cols=len(columns))
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.style = "Table Grid"
    table.autofit = True

    header_cells = table.rows[0].cells
    for index, column in enumerate(columns):
        cell = header_cells[index]
        set_cell_shading(cell, "EFE8DA")
        set_cell_border(cell, color="C4B89F", size="10")
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        add_run(paragraph, column, font_name="Aptos", size=9.5, bold=True, color=PRIMARY)
        set_paragraph_spacing(paragraph, before=3, after=3)

    for row_values in rows:
        row = table.add_row().cells
        for index, value in enumerate(row_values):
            cell = row[index]
            set_cell_border(cell, color="D4CCBF", size="8")
            cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
            paragraph = cell.paragraphs[0]
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            add_run(paragraph, value, font_name="Georgia", size=10.5, color=PRIMARY)
            set_paragraph_spacing(paragraph, before=3, after=3, line=1.08)

    spacer = document.add_paragraph()
    set_paragraph_spacing(spacer, after=8)


def add_section_heading(document: Document, heading_text: str) -> int | None:
    match = re.match(r"^(\d+)\.\s+(.*)$", heading_text)
    section_number = int(match.group(1)) if match else None
    section_title = match.group(2) if match else heading_text

    if section_number is not None:
        label = document.add_paragraph(style="DatumX Label")
        add_run(label, f"SECTION {section_number:02d}", font_name="Aptos", size=8.5, bold=True, color=ACCENT)
        set_paragraph_spacing(label, before=16, after=2)

    title = document.add_paragraph(style="DatumX Section Title")
    add_run(title, section_title, font_name="Aptos Display", size=18, bold=True, color=PRIMARY)
    set_paragraph_spacing(title, after=8)
    set_paragraph_border(title, edge="bottom")
    return section_number


def add_body_paragraph(document: Document, text: str) -> None:
    paragraph = document.add_paragraph(style="DatumX Body")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    add_run(paragraph, text, font_name="Georgia", size=11.25, color=PRIMARY)
    set_paragraph_spacing(paragraph, after=8, line=1.18)


def add_markdown_list(document: Document, text: str, numbered: bool) -> None:
    style_name = "List Number" if numbered else "List Bullet"
    paragraph = document.add_paragraph(style=style_name)
    add_run(paragraph, text, font_name="Georgia", size=11, color=PRIMARY)
    set_paragraph_spacing(paragraph, after=4, line=1.1)


def add_contextual_visuals(document: Document, section_number: int) -> None:
    if section_number == 4:
        add_visual_table(
            document,
            "Architecture at a glance",
            ["Lane", "Primary Role", "Why It Exists"],
            [
                ["Adapter Layer", "Normalizes project-specific submissions", "Prevents domain-specific ingestion logic from leaking into the registry core."],
                ["Protocol Layer", "Stores canonical releases and lineage", "Defines what counts as a valid, traceable, governed dataset release."],
                ["Validation Layer", "Captures review, confidence, and closure", "Turns technical judgment into explicit release legitimacy."],
            ],
        )
    if section_number == 7:
        add_visual_table(
            document,
            "Dataset lifecycle model",
            ["Stage", "Required Gate", "Result"],
            [
                ["Submission", "Canonical payload accepted", "A release enters the registry with project, stage, and lineage context."],
                ["Validation", "Validator-only reviews recorded", "Approval, rejection, and confidence become explicit and auditable."],
                ["Finalization", "Auditor closes approved release", "The dataset becomes a finalized parent eligible for the next stage."],
                ["Supersession", "Next-stage child is created", "Lineage remains deterministic and branch-free."],
            ],
        )


def build_document(markdown_text: str) -> Document:
    document = Document()
    configure_styles(document)
    sections = extract_sections(markdown_text)

    cover_section = document.sections[0]
    set_section_margins(cover_section)
    cover_section.different_first_page_header_footer = True
    add_cover_page(document)

    main_section = document.add_section(WD_SECTION.NEW_PAGE)
    set_section_margins(main_section)
    set_page_number_start(main_section, 1)
    configure_header_footer(main_section)

    add_author_profile_page(document)
    document.add_page_break()
    add_contents_page(document, sections)
    document.add_page_break()
    add_protocol_diagram_page(document)
    document.add_page_break()

    current_section = None
    for raw_line in markdown_text.splitlines():
        line = normalize_text(raw_line)
        if not line:
            continue
        if line.startswith("# "):
            continue
        if line.startswith("## "):
            current_section = add_section_heading(document, line[3:])
            if current_section in CALLOUTS:
                label_text, body_text = CALLOUTS[current_section]
                add_callout(document, label_text, body_text)
            add_contextual_visuals(document, current_section or 0)
            continue
        if re.match(r"^[-*] ", line):
            add_markdown_list(document, line[2:].strip(), numbered=False)
            continue
        if re.match(r"^\d+\.\s", line):
            add_markdown_list(document, re.sub(r"^\d+\.\s*", "", line), numbered=True)
            continue
        add_body_paragraph(document, line)

    return document


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    markdown_text = SOURCE_PATH.read_text(encoding="utf-8")
    document = build_document(markdown_text)
    document.save(OUTPUT_PATH)
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
