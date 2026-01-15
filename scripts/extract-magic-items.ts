import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';

type ItemEntry = {
  name: string;
  source?: {
    book: string;
    start_page_logical?: number;
    end_page_logical?: number;
    start_page_physical?: number;
    end_page_physical?: number;
  };
  magic?: MagicItem;
  [k: string]: unknown;
};

type MagicItem = {
  category: MagicCategory | null;
  rarity: MagicRarity | null;
  requires_attunement: boolean | null;
  attunement?: {
    required: boolean;
    condition: string | null;
  };
  crafting?: {
    tools: string[];
    tool_basis: 'category_mapping' | 'inferred_from_name_or_text' | 'unknown';
    tool_note: string | null;
  };
  tags?: string[];
  facts?: {
    bonuses?: {
      ac?: number | null;
      attack_roll?: number | null;
      damage_roll?: number | null;
      save_dc?: number | null;
      spell_attack?: number | null;
    };
    charges?: {
      max?: number | null;
      recharge?: string | null;
    };
    activation?: {
      time?: string | null;
      action_type?: string | null;
      trigger?: string | null;
      command_word?: string | null;
    };
    duration?: string | null;
    range?: string | null;
    area?: string | null;
    saving_throw?: {
      ability?: string | null;
      dc?: number | null;
    };
    spells_granted?: Array<{
      name: string;
      frequency?: string | null;
      notes?: string | null;
    }>;
    requirements?: string[];
  };
  text_blocks: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'table'; columns?: string[] | null; rows?: string[][] | null; raw?: string | null }
  >;
  raw: {
    title: string;
    meta_line: string | null;
    notes: string[];
  };
};

type MagicCategory =
  | 'Ring'
  | 'Rüstung'
  | 'Schild'
  | 'Schriftrolle'
  | 'Stab'
  | 'Zauberstab'
  | 'Zepter'
  | 'Trank'
  | 'Waffe'
  | 'Wundersamer Gegenstand'
  | 'Sonstiges';

type MagicRarity = 'gewöhnlich' | 'ungewöhnlich' | 'selten' | 'sehr selten' | 'legendär' | 'artefakt';

type ExtractConfig = {
  pdfPath: string;
  itemsJsonPath: string;
  itemsNamesPath?: string;
  outReportPath: string;
  backupDir: string;
  sectionStartPhysicalPage?: number; // 1-based, inclusive (fallback)
  sectionEndPhysicalPage?: number; // 1-based, inclusive (fallback)
  sectionStartMarker?: RegExp; // if found, extraction starts after marker
  sectionEndMarker?: RegExp; // if found, extraction stops before marker
  logicalPageOffset?: number; // logical = physical + offset (optional)
  resetExistingDmgMagic?: boolean;
  enforceWhitelist?: boolean;
};

type PageLine = { physicalPage: number; text: string };

type Report = {
  stats: {
    pdf_pages: number;
    used_pages: { start: number | null; end: number | null };
    extracted_candidates: number;
    matched_exact: number;
    matched_fuzzy: number;
    unmatched: number;
    updated_items: number;
    table_warnings: number;
    missing_meta: number;
    items_total: number;
    items_with_magic: number;
    items_without_magic: number;
  };
  unmatched: Array<{ extracted_name: string; physical_pages: { start: number; end: number }; hint?: string }>;
  fuzzy_matches: Array<{
    extracted_name: string;
    candidate_name: string;
    confidence: number;
    physical_pages: { start: number; end: number };
  }>;
  missing_meta: Array<{ name: string; physical_pages: { start: number; end: number }; meta_line: string | null }>;
  table_parse_warnings: Array<{ name: string; physical_pages: { start: number; end: number }; raw: string }>;
  items_without_magic: string[];
  unresolved_after_recover?: Array<{ name: string; best_score: number; best_excerpt: string | null; best_physical_page: number | null }>;
};

const TOOL_MAP: Record<MagicCategory, string[]> = {
  Ring: ['Juwelierwerkzeug'],
  Rüstung: ['Ledererwerkzeug', 'Schmiedewerkzeug', 'Weberwerkzeug'],
  Schild: ['Ledererwerkzeug', 'Schmiedewerkzeug', 'Weberwerkzeug'],
  Schriftrolle: ['Kalligrafiewerkzeug'],
  Stab: ['Holzschnitzwerkzeug'],
  Zauberstab: ['Holzschnitzwerkzeug'],
  Zepter: ['Holzschnitzwerkzeug'],
  Trank: ['Alchemistenausrüstung', 'Kräuterkundeausrüstung'],
  Waffe: ['Ledererwerkzeug', 'Schmiedewerkzeug', 'Holzschnitzwerkzeug'],
  'Wundersamer Gegenstand': ['Tüftlerwerkzeug'],
  Sonstiges: [],
};

function normalizeName(s: string) {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[“”„"]/g, '"')
    .replace(/[‐‑‒–—]/g, '-')
    .normalize('NFKC')
    .toLowerCase();
}

function compactKey(s: string) {
  // Robust gegen auseinandergezogene Buchstaben / Sonderzeichen
  const up = s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks (Umlaute, Akzente)
    .toUpperCase();
  return up.replace(/[^A-Z0-9+()]/g, '');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeTitleCandidate(s: string) {
  // 1) trim + remove trailing punctuation that commonly appears in PDF tokenization
  const base = s
    .trim()
    .replace(/[,:;.\u00b7]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[“”„"]/g, '"')
    .replace(/[‐‑‒–—]/g, '-')
    .normalize('NFKC');

  // 2) collapse "letter-spaced" OCR artifacts: e.g. "A D A M A N T W A F F E" or mixed "ADAM A NTWAF F E"
  const parts = base.split(' ').filter(Boolean);
  const shortCount = parts.filter(p => p.length <= 2 && /^[A-Za-zÄÖÜäöüß]+$/.test(p)).length;
  if (parts.length >= 5 && shortCount / parts.length >= 0.6) {
    return parts.join('').toLowerCase();
  }

  return base.toLowerCase();
}

function stripArtifacts(s: string) {
  return s.replace(/-\n/g, '').replace(/\u00ad/g, ''); // soft hyphen
}

function isLikelyTableLine(line: string) {
  // Heuristik: mehrere "Spalten" durch große Abstände oder viele kurze Tokens
  if (line.length < 8) return false;
  if (line.includes('\t')) return true;
  if (line.includes('|')) return true;
  // Fallback (sparsam!): offensichtliche Tabellenzeilen mit Zahlenbereichen/mehreren Spalten
  if (line.match(/\b\d+\s*-\s*\d+\b/) && line.match(/\s{3,}\S+/)) return true;
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function computeFuzzyScore(a: string, b: string) {
  // sehr simple Token-Overlap + Prefix-Bonus (0..1)
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const denom = Math.max(1, Math.max(ta.size, tb.size));
  let score = inter / denom;
  if (a === b) score = 1;
  if (a.startsWith(b) || b.startsWith(a)) score = Math.max(score, 0.92);
  return Math.min(1, score);
}

function parseMetaLine(meta: string) {
  const l = meta.toLowerCase();
  const compact = l.replace(/\s+/g, '');

  const rarity =
    (compact.includes('sehrselten') ? 'sehr selten' : null) ??
    (compact.includes('ungewöhnlich') ? 'ungewöhnlich' : null) ??
    (compact.includes('gewöhnlich') ? 'gewöhnlich' : null) ??
    (compact.includes('legendär') ? 'legendär' : null) ??
    (compact.includes('artefakt') ? 'artefakt' : null) ??
    (compact.includes('selten') ? 'selten' : null);

  let category: MagicCategory | null = null;
  const catRules: Array<{ re: RegExp; value: MagicCategory }> = [
    { re: /\bring\b/i, value: 'Ring' },
    { re: /\brüstung\b/i, value: 'Rüstung' },
    { re: /\bschild\b/i, value: 'Schild' },
    { re: /\bschriftrolle\b/i, value: 'Schriftrolle' },
    { re: /\bzauberstab\b/i, value: 'Zauberstab' },
    { re: /\bzepter\b/i, value: 'Zepter' },
    { re: /\bstab\b/i, value: 'Stab' },
    { re: /\btrank\b/i, value: 'Trank' },
    { re: /\bwaffe\b/i, value: 'Waffe' },
    { re: /\bwundersamer gegenstand\b/i, value: 'Wundersamer Gegenstand' },
  ];
  for (const r of catRules) {
    if (r.re.test(meta) || compact.includes(r.value.toLowerCase().replace(/\s+/g, ''))) {
      category = r.value;
      break;
    }
  }

  let attunementRequired: boolean | null = null;
  let attunementCondition: string | null = null;
  const attMatch = meta.match(/(?:Einstimmung erforderlich|erfordert\s+Einstimmung)(?:\s*\(([^)]+)\))?/i);
  if (attMatch) {
    attunementRequired = true;
    attunementCondition = attMatch[1]?.trim() ?? null;
  } else if (/einstimmung/i.test(meta) || compact.includes('einstimmung')) {
    // falls die Formulierung zerrissen ist: "... erfordert Einstimmung" / "... Einstimmung erforderlich"
    if (compact.includes('erforderlich') || compact.includes('erfordert')) attunementRequired = true;
    else attunementRequired = true;
  } else {
    attunementRequired = false;
  }

  return { category, rarity, attunementRequired, attunementCondition };
}

function bigramDice(a: string, b: string) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const ga = grams(a);
  const gb = grams(b);
  let inter = 0;
  for (const [g, ca] of ga) {
    const cb = gb.get(g);
    if (cb) inter += Math.min(ca, cb);
  }
  const total = (a.length - 1) + (b.length - 1);
  return (2 * inter) / Math.max(1, total);
}

async function extractPdfLinesWithLayout(filePath: string): Promise<{ pages: PageLine[]; pageCount: number }> {
  const dataBuffer = await fs.readFile(filePath);
  const pages: PageLine[] = [];

  const options = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagerender: async (pageData: any) => {
      const viewport = pageData.getViewport({ scale: 1.0 });
      const textContent = await pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
      const items: Array<{ str: string; transform: number[]; width?: number }> = textContent.items ?? [];

      const tokens = items
        .map(it => {
          const t = it.transform;
          const x = t[4];
          const y = t[5];
          const w = typeof it.width === 'number' ? it.width : null;
          const s = (it.str ?? '').replace(/\s+/g, ' ').trim();
          return s ? { s, x, y, w } : null;
        })
        .filter(Boolean) as Array<{ s: string; x: number; y: number; w: number | null }>;

      // group into lines by y (pdf coord: larger y = higher on page)
      // Approach: binning stabilizes small y-jitter without accidentally merging neighboring lines.
      const yBin = 3.0;
      const byY = new Map<number, Array<{ x: number; endX: number; s: string }>>();
      for (const tok of tokens) {
        const yKey = Math.round(tok.y / yBin) * yBin;
        const arr = byY.get(yKey) ?? [];
        // if we have width, approximate token end position
        const endX = tok.w != null ? tok.x + tok.w : tok.x;
        arr.push({ x: tok.x, endX, s: tok.s });
        byY.set(yKey, arr);
      }
      const lines: Array<{ y: number; parts: Array<{ x: number; s: string }> }> = [...byY.entries()]
        .sort((a, b) => b[0] - a[0])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map(([y, parts]) => ({ y, parts: parts as any }));

      // compute 2-column split using a simple midpoint heuristic + clustering fallback
      const pageWidth = viewport.width || 600;
      const xs = tokens.map(t => t.x);
      const mid = pageWidth / 2;
      // If distribution is clearly 2 clusters, find split by maximizing gap near middle
      let splitX = mid;
      if (xs.length > 50) {
        const sorted = [...xs].sort((a, b) => a - b);
        let bestGap = 0;
        let bestAt = mid;
        for (let i = 1; i < sorted.length; i++) {
          const a = sorted[i - 1];
          const b = sorted[i];
          const gap = b - a;
          const center = (a + b) / 2;
          if (gap > bestGap && Math.abs(center - mid) < pageWidth * 0.15) {
            bestGap = gap;
            bestAt = center;
          }
        }
        if (bestGap > pageWidth * 0.05) splitX = bestAt;
      }

      const left: string[] = [];
      const right: string[] = [];

      for (const line of lines) {
        line.parts.sort((a, b) => a.x - b.x);
        // IMPORTANT: don't merge left+right column content that shares the same y.
        // Additionally, keep "cells" separated using TAB so we can reconstruct tables later.
        // We only want to create cells for *real* column gaps (tables), not justified text word spacing.
        const columnGapTol = 42; // in viewport units (scale=1), applied to gap between token END and next token START

        const segments: Array<{ xStart: number; text: string }> = [];
        let seg: Array<{ x: number; endX: number; s: string }> = [];
        const flushSeg = () => {
          if (!seg.length) return;
          const text = seg.map(p => p.s).join(' ').replace(/\s+/g, ' ').trim();
          const xStart = seg[0]?.x ?? 0;
          if (text) segments.push({ xStart, text });
          seg = [];
        };

        for (let idx = 0; idx < line.parts.length; idx++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = line.parts[idx] as any;
          const x = p.x as number;
          const s = p.s as string;
          const endX = typeof p.endX === 'number' ? (p.endX as number) : x; // safety
          const prev = seg[seg.length - 1];
          if (prev) {
            const gap = x - prev.endX;
            if (gap > columnGapTol) {
              flushSeg();
            }
          }
          seg.push({ x, endX, s });
        }
        flushSeg();

        const leftSegs = segments.filter(s => s.xStart < splitX);
        const rightSegs = segments.filter(s => s.xStart >= splitX);

        const joinSegs = (segs: Array<{ text: string }>) => {
          if (!segs.length) return null;
          // If we have 2+ segments, they were split by a big gap => treat as table cells.
          return segs.length >= 2 ? segs.map(s => s.text).join('\t') : segs[0]!.text;
        };

        const lText = joinSegs(leftSegs);
        const rText = joinSegs(rightSegs);
        if (lText) left.push(lText);
        if (rText) right.push(rText);
      }

      const ordered = [...left, ...right].join('\n');
      pages.push({ physicalPage: pageData.pageNumber, text: ordered });
      return ordered;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = await pdf(dataBuffer, options as any);
  const pageCount = parsed.numpages ?? pages.length;
  // pages[] is built via pagerender callbacks (should already be in order)
  pages.sort((a, b) => a.physicalPage - b.physicalPage);
  return { pages, pageCount };
}

function determineSectionRange(pages: PageLine[], cfg: ExtractConfig) {
  // Start is anchored by the known physical page; markers are only used to refine within/after that range.
  let start = cfg.sectionStartPhysicalPage ?? 1;
  let end = cfg.sectionEndPhysicalPage ?? (pages[pages.length - 1]?.physicalPage ?? 1);

  if (cfg.sectionStartMarker) {
    for (const p of pages) {
      if (p.physicalPage < start) continue;
      if (cfg.sectionStartMarker.test(p.text)) {
        start = p.physicalPage;
        break;
      }
    }
  }

  if (cfg.sectionEndMarker) {
    for (const p of pages) {
      if (p.physicalPage <= start) continue;
      if (cfg.sectionEndMarker.test(p.text)) {
        end = p.physicalPage;
        break;
      }
    }
  }

  return { start, end };
}

function sliceSectionLines(pages: PageLine[], start: number, end: number, cfg?: ExtractConfig) {
  const lines: Array<{ physicalPage: number; line: string }> = [];
  let startedInsidePage = cfg?.sectionStartMarker ? false : true;
  let ended = false;

  const embeddedHeaderRe =
    /(?:^|[.!?]\s+)([A-ZÄÖÜ][A-ZÄÖÜ0-9\s\-+()]{5,80})\s+(Wundersamer Gegenstand|Waffe|Rüstung|Schild|Ring|Trank|Schriftrolle|Stab|Zauberstab|Zepter)\s*,\s*(gewöhnlich|ungewöhnlich|selten|sehr selten|legendär)/;

  function splitEmbeddedHeaders(s: string) {
    // Falls ein neues Item mitten in einer Zeile beginnt, splitten wir die Zeile in zwei.
    // Das ist best-effort und verhindert, dass mehrere Items in einem Paragraph landen.
    const out: string[] = [];
    let rest = s;
    let matchFound = true;
    while (matchFound) {
      const m = rest.match(embeddedHeaderRe);
      if (!m) {
        matchFound = false;
        break;
      }
      const idx = m.index ?? -1;
      if (idx <= 0) break;
      const before = rest.slice(0, idx).trim();
      const after = rest.slice(idx).trim();
      if (before) out.push(before);
      rest = after;
      // falls mehrere Header in einer Zeile sind: loop
      if (out.length > 5) break;
    }
    if (rest.trim()) out.push(rest.trim());
    return out;
  }

  for (const p of pages) {
    if (p.physicalPage < start || p.physicalPage > end) continue;
    const clean = stripArtifacts(p.text);
    let startMarkerWindow = '';
    let endMarkerWindow = '';
    for (const raw of clean.split('\n')) {
      const line = raw.trim();
      if (!line) continue;

      if (!startedInsidePage && cfg?.sectionStartMarker) {
        startMarkerWindow = (startMarkerWindow + ' ' + line).trim();
        if (startMarkerWindow.length > 200) startMarkerWindow = startMarkerWindow.slice(-200);
        if (cfg.sectionStartMarker.test(startMarkerWindow)) {
          startedInsidePage = true;
          continue; // begin AFTER marker window
        }
        continue;
      }

      if (cfg?.sectionEndMarker) {
        endMarkerWindow = (endMarkerWindow + ' ' + line).trim();
        if (endMarkerWindow.length > 200) endMarkerWindow = endMarkerWindow.slice(-200);
        if (cfg.sectionEndMarker.test(endMarkerWindow)) {
          ended = true;
          break;
        }
      }

      if (!startedInsidePage) continue;
      for (const part of splitEmbeddedHeaders(line)) {
        lines.push({ physicalPage: p.physicalPage, line: part });
      }
    }
    if (ended) break;
  }
  return lines;
}

function extractItemsFromLines(
  lines: Array<{ physicalPage: number; line: string }>,
  knownNames: Array<{ name: string; norm: string }>
) {
  const knownByNorm = new Map<string, string>();
  for (const k of knownNames) knownByNorm.set(k.norm, k.name);

  const candidates: Array<{
    extracted_title_raw: string;
    matched_name: string;
    match_type: 'exact' | 'fuzzy';
    confidence: number;
    meta: string;
    physicalStart: number;
    physicalEnd: number;
    bodyLines: string[];
  }> = [];

  // Name-first: wir matchen Titel über compactKey, damit auch "A M U L E T T ..." gefunden wird.
  const nameByCompact = new Map<string, string>();
  for (const k of knownNames) nameByCompact.set(compactKey(k.name), k.name);

  type Start = { idx: number; take: number; matched_name: string; extracted_title_raw: string };
  const starts: Start[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    for (let take = 1; take <= 4; take++) {
      if (idx + take > lines.length) break;
      const raw = lines
        .slice(idx, idx + take)
        .map(x => x.line)
        .join(' ')
        .trim();
      if (!raw || raw.length > 140) continue;
      const hit = nameByCompact.get(compactKey(raw));
      if (hit) {
        starts.push({ idx, take, matched_name: hit, extracted_title_raw: raw });
        break;
      }
    }
  }

  // Dedup: pro matched_name die früheste Stelle nehmen, zusätzlich überlappende Starts bereinigen
  const bestStartByName = new Map<string, Start>();
  for (const s of starts) {
    const existing = bestStartByName.get(s.matched_name);
    if (!existing || s.idx < existing.idx) bestStartByName.set(s.matched_name, s);
  }

  function looksHeaderLike(raw: string) {
    const letters = raw.replace(/[^A-Za-zÄÖÜäöüß]/g, '');
    if (letters.length < 4) return false;
    const upperLetters = letters.replace(/[^A-ZÄÖÜ]/g, '').length;
    const ratioUpper = upperLetters / Math.max(1, letters.length);
    return ratioUpper >= 0.65;
  }

  function bigramDice(a: string, b: string) {
    // Dice coefficient on bigrams (0..1), robust for minor OCR differences
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const grams = (s: string) => {
      const m = new Map<string, number>();
      for (let i = 0; i < s.length - 1; i++) {
        const g = s.slice(i, i + 2);
        m.set(g, (m.get(g) ?? 0) + 1);
      }
      return m;
    };
    const ga = grams(a);
    const gb = grams(b);
    let inter = 0;
    for (const [g, ca] of ga) {
      const cb = gb.get(g);
      if (cb) inter += Math.min(ca, cb);
    }
    const total = (a.length - 1) + (b.length - 1);
    return (2 * inter) / Math.max(1, total);
  }

  // 2nd pass: fuzzy title detection for remaining names (OCR/encoding drift)
  const missing = knownNames
    .map(k => k.name)
    .filter(n => !bestStartByName.has(n))
    .map(n => ({ name: n, ck: compactKey(n) }))
    .filter(x => x.ck.length >= 6);

  if (missing.length) {
    for (let idx = 0; idx < lines.length; idx++) {
      for (let take = 1; take <= 4; take++) {
        if (idx + take > lines.length) break;
        const raw = lines
          .slice(idx, idx + take)
          .map(x => x.line)
          .join(' ')
          .trim();
        if (!raw || raw.length > 140) continue;
        if (!looksHeaderLike(raw)) continue;
        const ck = compactKey(raw);
        if (ck.length < 6) continue;
        if (nameByCompact.has(ck)) continue; // already exact-handled elsewhere

        let best: { name: string; score: number } | null = null;
        for (const m of missing) {
          if (bestStartByName.has(m.name)) continue;
          const score = bigramDice(ck, m.ck);
          if (!best || score > best.score) best = { name: m.name, score };
        }
        // In dieser PDF-Quelle gibt es teils harte OCR-/Encoding-Artefakte (z.B. AUSSPÄHUNG -> AussPilHUNG).
        // Daher ist der Threshold bewusst niedriger, aber nur für die kleine Restmenge und nur bei header-like Zeilen.
        if (best && best.score >= 0.84) {
          bestStartByName.set(best.name, { idx, take, matched_name: best.name, extracted_title_raw: raw });
          // keep scanning; multiple can start on same page
        }
      }
    }
  }

  // 3rd pass: token-based (very tolerant) for remaining items with severe OCR in one token
  const remainingAfterBigrams = knownNames
    .map(k => k.name)
    .filter(n => !bestStartByName.has(n))
    .map(n => {
      const norm = n
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
      // remove common German stopwords for matching
      const tokens = norm
        .split(/[^A-Z0-9+()]+/)
        .filter(Boolean)
        .filter(t => !['DER', 'DES', 'DIE', 'DAS', 'UND', 'VON', 'GEGEN', 'MIT', 'ZU', 'IM'].includes(t));
      return { name: n, tokens: tokens.length ? tokens : [compactKey(n)] };
    });

  if (remainingAfterBigrams.length) {
    const lineTexts = lines.map(l =>
      l.line
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim()
    );

    for (const rem of remainingAfterBigrams) {
      const tokens = rem.tokens;
      const wantMin = Math.min(2, tokens.length);
      let best: { idx: number; take: number; score: number; raw: string } | null = null;

      for (let idx = 0; idx < lineTexts.length; idx++) {
        for (let take = 1; take <= 4; take++) {
          if (idx + take > lineTexts.length) break;
          const raw = lineTexts.slice(idx, idx + take).join(' ');
          if (!raw) continue;

          let hit = 0;
          for (const t of tokens) {
            if (t.length < 3) continue;
            if (raw.includes(t)) hit++;
          }

          const score = hit / Math.max(1, tokens.length);
          if (hit >= wantMin && (!best || score > best.score)) {
            best = { idx, take, score, raw: lines.slice(idx, idx + take).map(x => x.line).join(' ').trim() };
            if (score >= 0.75) break;
          }
        }
      }

      if (best && !bestStartByName.has(rem.name)) {
        bestStartByName.set(rem.name, { idx: best.idx, take: best.take, matched_name: rem.name, extracted_title_raw: best.raw });
      }
    }
  }

  const uniqueStarts = [...bestStartByName.values()].sort((a, b) => a.idx - b.idx);

  function parseMetaOptional(startIdx: number) {
    // best effort: sammle bis zu 10 Zeilen Meta; wenn keine Seltenheit erkennbar -> null
    const parts: string[] = [];
    for (let j = startIdx; j < Math.min(startIdx + 10, lines.length); j++) {
      const l = lines[j].line.trim();
      if (!l) continue;
      parts.push(l);
      const compact = parts.join('').toLowerCase().replace(/\s+/g, '');
      const hasRarity =
        compact.includes('sehrselten') ||
        compact.includes('ungewöhnlich') ||
        compact.includes('gewöhnlich') ||
        compact.includes('legendär') ||
        compact.includes('artefakt') ||
        compact.includes('selten');
      if (hasRarity) {
        const meta = parts.join(' ').replace(/\s+/g, ' ').trim();
        // schneiden, falls Body schon anfängt ("Wenn ...")
        const cutAt = meta.search(/\bWenn\b|\bDu\b/i);
        if (cutAt > 0) return { meta: meta.slice(0, cutAt).trim(), bodyCarry: meta.slice(cutAt).trim(), metaEndIdx: j + 1 };
        return { meta, bodyCarry: null as string | null, metaEndIdx: j + 1 };
      }
    }
    return { meta: null as string | null, bodyCarry: null as string | null, metaEndIdx: startIdx };
  }

  for (let sIdx = 0; sIdx < uniqueStarts.length; sIdx++) {
    const s = uniqueStarts[sIdx];
    const next = uniqueStarts[sIdx + 1];
    const endIdx = next ? next.idx : lines.length;

    const metaInfo = parseMetaOptional(s.idx + s.take);
    const bodyLines: string[] = [];
    if (metaInfo.bodyCarry) bodyLines.push(metaInfo.bodyCarry);

    for (let k = metaInfo.metaEndIdx; k < endIdx; k++) {
      bodyLines.push(lines[k].line);
    }

    const physicalStart = lines[s.idx].physicalPage;
    const physicalEnd = lines[Math.max(s.idx, endIdx - 1)]?.physicalPage ?? physicalStart;

    candidates.push({
      extracted_title_raw: s.extracted_title_raw,
      matched_name: s.matched_name,
      match_type: 'exact',
      confidence: 1,
      meta: metaInfo.meta ?? '',
      physicalStart,
      physicalEnd,
      bodyLines,
    });
  }

  return candidates;
}

function recoverMissingByFuzzySearch(
  lines: Array<{ physicalPage: number; line: string }>,
  missingNames: string[],
  alreadyHave: Set<string>
) {
  // Search best window position per missing name.
  const results: Array<{
    name: string;
    idx: number;
    take: number;
    score: number;
    excerpt: string;
    physicalPage: number;
  }> = [];

  const normLine = lines.map(l => ({
    physicalPage: l.physicalPage,
    raw: l.line,
    ck: compactKey(l.line),
  }));

  for (const name of missingNames) {
    if (alreadyHave.has(name)) continue;
    const target = compactKey(name);
    if (!target) continue;

    let best: { idx: number; take: number; score: number; excerpt: string; physicalPage: number } | null = null;
    for (let idx = 0; idx < normLine.length; idx++) {
      for (let take = 1; take <= 6; take++) {
        if (idx + take > normLine.length) break;
        const excerpt = normLine.slice(idx, idx + take).map(x => x.raw).join(' ').trim();
        if (!excerpt || excerpt.length > 220) continue;
        const ck = compactKey(excerpt);
        if (!ck || ck.length < 4) continue;

        // hard anchor: at least one 4-char chunk from target should appear (reduces false matches)
        const anchor = target.slice(0, Math.min(6, target.length));
        const hasAnchor = ck.includes(anchor.slice(0, 4)) || ck.includes(anchor.slice(-4));
        if (!hasAnchor && target.length >= 10) continue;

        const score = bigramDice(ck, target);
        if (!best || score > best.score) {
          best = { idx, take, score, excerpt, physicalPage: normLine[idx].physicalPage };
        }
      }
    }

    if (best && best.score >= 0.78) {
      results.push({ name, ...best });
    } else if (best) {
      // keep weak best as diagnostic, but don't auto-apply
      results.push({ name, ...best });
    } else {
      results.push({ name, idx: -1, take: 0, score: 0, excerpt: '', physicalPage: -1 });
    }
  }

  // only keep those with idx>=0 and strong-ish score
  const applied = results
    .filter(r => r.idx >= 0 && r.score >= 0.78)
    .sort((a, b) => a.idx - b.idx);

  return { applied, diagnostics: results };
}

function parseTabularBlockToRows(tableLines: string[]) {
  // Converts lines with TAB-separated cells into rows.
  // Falls back to a single-cell row if no tabs exist.
  const rows: string[][] = [];
  for (const l of tableLines) {
    const cells = l
      .split('\t')
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 0);
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function buildMagicObjectFromCandidate(c: { name: string; meta: string | null; bodyLines: string[] }) {
  const metaLine = c.meta;
  const parsed = metaLine ? parseMetaLine(metaLine) : { category: null, rarity: null, attunementRequired: null, attunementCondition: null };

  const category = parsed.category ?? 'Sonstiges';
  const tools = TOOL_MAP[category] ?? [];

  // text blocks: best-effort paragraphs + raw tables
  const text_blocks: MagicItem['text_blocks'] = [];
  let buf: string[] = [];
  let tableBuf: string[] = [];

  const flushParagraph = () => {
    const t = buf.join(' ').replace(/\s+/g, ' ').trim();
    if (t) text_blocks.push({ type: 'paragraph', text: t });
    buf = [];
  };
  const flushTable = () => {
    const raw = tableBuf.join('\n').trim();
    if (raw) {
      const rows = parseTabularBlockToRows(tableBuf);
      // If we didn't manage to split anything meaningful, keep raw only.
      const isStructured = rows.length > 0 && rows.some(r => r.length >= 2);
      text_blocks.push({
        type: 'table',
        raw: isStructured ? null : raw,
        columns: null,
        rows: isStructured ? rows : null,
      });
    }
    tableBuf = [];
  };

  for (const line of c.bodyLines) {
    // skip repeating title/meta line occurrences
    if (normalizeName(line) === normalizeName(c.name)) continue;
    if (metaLine && normalizeName(line) === normalizeName(metaLine)) continue;

    if (isLikelyTableLine(line)) {
      flushParagraph();
      tableBuf.push(line);
      continue;
    }
    if (tableBuf.length) {
      // end of table region
      flushTable();
    }
    buf.push(line);
  }
  flushParagraph();
  flushTable();

  const magic: MagicItem = {
    category: parsed.category,
    rarity: parsed.rarity,
    requires_attunement: parsed.attunementRequired,
    attunement: {
      required: parsed.attunementRequired === true,
      condition: parsed.attunementCondition,
    },
    crafting: {
      tools,
      tool_basis: 'category_mapping',
      tool_note: category === 'Sonstiges' ? 'Kategorie nicht sicher erkannt' : null,
    },
    tags: ['magisch'],
    facts: {
      bonuses: { ac: null, attack_roll: null, damage_roll: null, save_dc: null, spell_attack: null },
      charges: { max: null, recharge: null },
      activation: { time: null, action_type: null, trigger: null, command_word: null },
      duration: null,
      range: null,
      area: null,
      saving_throw: { ability: null, dc: null },
      spells_granted: [],
      requirements: [],
    },
    text_blocks,
    raw: { title: c.name, meta_line: metaLine, notes: [] },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { magic, tableWarnings: text_blocks.filter(b => b.type === 'table' && (b as any).rows == null).length, missingMeta: metaLine ? 0 : 1 };
}

async function main() {
  const cfg: ExtractConfig = {
    pdfPath: path.resolve('resources/books/2024_D&D Spielleiterhandbuch (2024).pdf'),
    itemsJsonPath: path.resolve('exports/items.json'),
    itemsNamesPath: path.resolve('exports/items_names.json'),
    outReportPath: path.resolve('exports/magic-items-import-report.json'),
    backupDir: path.resolve('exports/backups'),
    sectionStartPhysicalPage: 228,
    sectionEndPhysicalPage: 326,
    // Ende ist optional: wir stoppen entweder über Marker oder am Ende des PDFs
    sectionStartMarker: /magische\s+gegenstände\s+a-?z/i,
    sectionEndMarker: /stichwortverzeichnis|index\b/i,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logicalPageOffset: null as any,
    resetExistingDmgMagic: true,
    enforceWhitelist: true,
  };

  await fs.mkdir(cfg.backupDir, { recursive: true });

  const itemsRaw = await fs.readFile(cfg.itemsJsonPath, 'utf-8');
  let items = JSON.parse(itemsRaw) as ItemEntry[];

  // Hard guardrail: only allow names from items_names.json (Source of Truth)
  if (cfg.enforceWhitelist) {
    if (!cfg.itemsNamesPath) throw new Error('enforceWhitelist=true but itemsNamesPath is missing');
    const namesRaw = await fs.readFile(cfg.itemsNamesPath, 'utf-8');
    const namesArr = JSON.parse(namesRaw) as Array<{ name: string }>;
    const whitelist = namesArr.map(x => x?.name).filter((x): x is string => typeof x === 'string');
    const wlSet = new Set(whitelist);

    // prune extras
    items = items.filter(it => it?.name && wlSet.has(it.name));

    // ensure all whitelist names exist (preserve existing object if present)
    const byName = new Map(items.map(it => [it.name, it]));
    items = whitelist.map(name => byName.get(name) ?? { name });

    // validate (fail fast if still inconsistent)
    const itemsSet = new Set(items.map(it => it.name));
    const extra = [...itemsSet].filter(n => !wlSet.has(n));
    const missing = [...wlSet].filter(n => !itemsSet.has(n));
    if (extra.length || missing.length) {
      throw new Error(`Whitelist validation failed: extra=${extra.length}, missing=${missing.length}`);
    }
  }
  const known = items
    .filter(it => typeof it?.name === 'string')
    .map(it => ({ name: it.name, norm: normalizeName(it.name) }));

  const { pages, pageCount } = await extractPdfLinesWithLayout(cfg.pdfPath);
  const range = determineSectionRange(pages, cfg);
  const sectionLines = sliceSectionLines(pages, range.start, range.end, cfg);

  const candidates = extractItemsFromLines(sectionLines, known);

  const report: Report = {
    stats: {
      pdf_pages: pageCount,
      used_pages: { start: range.start, end: range.end },
      extracted_candidates: candidates.length,
      matched_exact: 0,
      matched_fuzzy: 0,
      unmatched: 0,
      updated_items: 0,
      table_warnings: 0,
      missing_meta: 0,
      items_total: items.length,
      items_with_magic: 0,
      items_without_magic: 0,
    },
    unmatched: [],
    fuzzy_matches: [],
    missing_meta: [],
    table_parse_warnings: [],
    items_without_magic: [],
  };

  const byNorm = new Map<string, number>();
  items.forEach((it, idx) => {
    if (typeof it?.name === 'string') byNorm.set(normalizeName(it.name), idx);
  });

  // Cleanup: remove prior DMG-derived magic if we are going to repopulate it.
  if (cfg.resetExistingDmgMagic) {
    const dmgBook = path.basename(cfg.pdfPath);
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const src = it?.source as { book?: string } | undefined;
      if (src?.book === dmgBook && it.magic) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { magic, source, ...rest } = it as { magic?: unknown; source?: unknown; [key: string]: unknown };
        // keep name + other non-magic fields, but drop magic+source if it came from the DMG
        items[idx] = { ...rest, name: it.name } as typeof it;
      }
    }
  }

  for (const c of candidates) {
    const norm = normalizeName(c.matched_name);
    const idx = byNorm.get(norm);
    if (idx != null) {
      if (c.match_type === 'exact') report.stats.matched_exact++;
      else report.stats.matched_fuzzy++;

      if (c.match_type === 'fuzzy') {
        report.fuzzy_matches.push({
          extracted_name: c.extracted_title_raw,
          candidate_name: c.matched_name,
          confidence: c.confidence,
          physical_pages: { start: c.physicalStart, end: c.physicalEnd },
        });
      }

      const { magic, tableWarnings, missingMeta } = buildMagicObjectFromCandidate({ name: c.matched_name, meta: c.meta, bodyLines: c.bodyLines });
      report.stats.table_warnings += tableWarnings;
      report.stats.missing_meta += missingMeta;
      if (missingMeta) report.missing_meta.push({ name: c.matched_name, physical_pages: { start: c.physicalStart, end: c.physicalEnd }, meta_line: c.meta });
      if (tableWarnings) report.table_parse_warnings.push({ name: c.matched_name, physical_pages: { start: c.physicalStart, end: c.physicalEnd }, raw: 'table blocks exported as raw' });

      const logicalOffset = typeof cfg.logicalPageOffset === 'number' ? cfg.logicalPageOffset : null;
      const source = {
        book: path.basename(cfg.pdfPath),
        start_page_physical: c.physicalStart,
        end_page_physical: c.physicalEnd,
        ...(logicalOffset != null
          ? {
              start_page_logical: c.physicalStart + logicalOffset,
              end_page_logical: c.physicalEnd + logicalOffset,
            }
          : {}),
      };

      items[idx] = {
        ...items[idx],
        source,
        magic,
      };
      report.stats.updated_items++;
      continue;
    }

    report.stats.unmatched++;
    report.unmatched.push({ extracted_name: c.extracted_title_raw, physical_pages: { start: c.physicalStart, end: c.physicalEnd } });
  }

  // Recover pass for still-missing items: use last report list if present, else current missing.
  const currentMissing = items.filter(it => !it.magic).map(it => it.name);
  let reportMissing: string[] = [];
  try {
    const prevReport = JSON.parse(await fs.readFile(cfg.outReportPath, 'utf-8')) as Partial<Report>;
    if (Array.isArray(prevReport.items_without_magic)) reportMissing = prevReport.items_without_magic.filter((x): x is string => typeof x === 'string');
  } catch {
    // ignore
  }

  const missingToRecover = (reportMissing.length ? reportMissing : currentMissing).filter(n => currentMissing.includes(n));
  const alreadyHave = new Set(items.filter(it => it.magic).map(it => it.name));

  const { applied: recoverStarts, diagnostics } = recoverMissingByFuzzySearch(sectionLines, missingToRecover, alreadyHave);

  // Apply recovered blocks (in order). We stop each block at the next recovered start.
  const byName = new Map<string, number>();
  items.forEach((it, idx) => byName.set(it.name, idx));

  for (let sIdx = 0; sIdx < recoverStarts.length; sIdx++) {
    const s = recoverStarts[sIdx];
    const next = recoverStarts[sIdx + 1];
    const endIdx = next ? next.idx : sectionLines.length;
    const idxInItems = byName.get(s.name);
    if (idxInItems == null) continue;
    if (items[idxInItems]?.magic) continue; // don't overwrite

    // meta: next up to 10 lines
    const metaParts: string[] = [];
    for (let j = s.idx + s.take; j < Math.min(s.idx + s.take + 10, sectionLines.length); j++) {
      const l = sectionLines[j].line.trim();
      if (!l) continue;
      metaParts.push(l);
      const compact = metaParts.join('').toLowerCase().replace(/\s+/g, '');
      const hasRarity =
        compact.includes('sehrselten') ||
        compact.includes('ungewöhnlich') ||
        compact.includes('gewöhnlich') ||
        compact.includes('legendär') ||
        compact.includes('artefakt') ||
        compact.includes('selten');
      if (hasRarity) break;
    }
    const meta = metaParts.length ? metaParts.join(' ').replace(/\s+/g, ' ').trim() : null;

    const bodyLines: string[] = [];
    for (let k = (s.idx + s.take); k < endIdx; k++) {
      bodyLines.push(sectionLines[k].line);
    }

    const { magic } = buildMagicObjectFromCandidate({ name: s.name, meta, bodyLines });
    items[idxInItems] = {
      ...items[idxInItems],
      source: {
        book: path.basename(cfg.pdfPath),
        start_page_physical: s.physicalPage,
        end_page_physical: sectionLines[Math.max(0, endIdx - 1)]?.physicalPage ?? s.physicalPage,
      },
      magic,
    };
  }

  report.items_without_magic = items.filter(it => !it.magic).map(it => it.name);
  report.stats.items_with_magic = items.length - report.items_without_magic.length;
  report.stats.items_without_magic = report.items_without_magic.length;
  report.unresolved_after_recover = diagnostics
    .filter(d => !recoverStarts.some(s => s.name === d.name))
    .map(d => ({
      name: d.name,
      best_score: d.score,
      best_excerpt: d.excerpt || null,
      best_physical_page: d.physicalPage >= 0 ? d.physicalPage : null,
    }));

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(cfg.backupDir, `items.json.bak_${ts}`);
  await fs.writeFile(backupPath, itemsRaw, 'utf-8');
  await fs.writeFile(cfg.itemsJsonPath, JSON.stringify(items, null, 2) + '\n', 'utf-8');
  await fs.writeFile(cfg.outReportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log('✅ Fertig');
  console.log('Backup:', backupPath);
  console.log('Updated:', cfg.itemsJsonPath);
  console.log('Report:', cfg.outReportPath);
  console.log('Stats:', report.stats);
}

main().catch(err => {
  console.error('❌ Fehler:', err);
  process.exit(1);
});

