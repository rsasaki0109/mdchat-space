import type { SearchHit, ThreadPost } from "@/lib/types";

const TOKEN_RE = /[A-Za-z0-9_-]+|[一-龠ぁ-ゔァ-ヴー]+/g;
const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "です",
  "ます",
  "する",
  "した",
  "して",
  "ある",
  "いる",
  "こと",
  "それ",
  "これ",
]);

function normalizeText(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

function tokenize(text: string): string[] {
  const n = normalizeText(text);
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE.source, "g");
  while ((m = re.exec(n)) !== null) {
    const t = m[0];
    if (!STOP.has(t)) {
      out.push(t);
    }
  }
  return out;
}

function embed(text: string, dimensions = 128): number[] {
  const vec = new Array(dimensions).fill(0);
  const tokens = tokenize(text);
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  for (const [tok, count] of freq) {
    let h = 0;
    for (let i = 0; i < tok.length; i++) {
      h = (h * 31 + tok.charCodeAt(i)) | 0;
    }
    const slot = Math.abs(h) % dimensions;
    vec[slot] += count;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm === 0) {
    return vec;
  }
  return vec.map((v) => v / norm);
}

function cosineSimilarity(left: number[], right: number[]): number {
  let s = 0;
  for (let i = 0; i < left.length; i++) {
    s += left[i] * right[i];
  }
  return s;
}

function keywordScore(query: string, body: string): number {
  const qt = new Set(tokenize(query));
  const bt = new Set(tokenize(body));
  if (!qt.size || !bt.size) {
    return 0;
  }
  let overlap = 0;
  for (const t of qt) {
    if (bt.has(t)) {
      overlap++;
    }
  }
  return overlap / qt.size;
}

function phraseSubstringScore(query: string, body: string): number {
  const raw = query.trim();
  if (!raw.length) {
    return 0;
  }
  const qn = normalizeText(raw);
  const bn = normalizeText(body);
  if (qn.length >= 1 && qn.length < 2 && !bn.includes(qn)) {
    return 0;
  }
  if (bn.includes(qn)) {
    return 1;
  }
  const parts = qn.split(/[\s　]+/).filter((p) => p.length >= 1);
  if (!parts.length) {
    return 0;
  }
  const hits = parts.filter((p) => bn.includes(p)).length;
  return hits / parts.length;
}

function substringDensityScore(query: string, body: string): number {
  const qn = normalizeText(query.trim());
  const bn = normalizeText(body);
  if (qn.length < 2) {
    return 0;
  }
  if (bn.includes(qn)) {
    return Math.min(1, 0.55 + (0.45 * qn.length) / Math.max(bn.length, 1));
  }
  return 0;
}

function combinedScore(query: string, body: string): number {
  const phrase = phraseSubstringScore(query, body);
  const sub = substringDensityScore(query, body);
  const lex = keywordScore(query, body);
  const sem = cosineSimilarity(embed(query), embed(body));
  return phrase * 0.42 + sub * 0.18 + lex * 0.22 + sem * 0.18;
}

function excerptFromBody(body: string, limit = 160): string {
  const compact = body.trim().split(/\s+/).join(" ");
  if (compact.length <= limit) {
    return compact;
  }
  return `${compact.slice(0, limit - 1).trimEnd()}…`;
}

function excerptAroundMatch(body: string, query: string, radius = 90): string {
  const raw = query.trim();
  if (!raw.length) {
    return excerptFromBody(body, radius * 2);
  }
  const nb = body.normalize("NFKC");
  const terms = [raw, ...raw.split(/[\s　]+/).filter((t) => t.length >= 1)];
  let idx = -1;
  let needleLen = 0;
  for (const term of terms) {
    const nt = term.normalize("NFKC");
    if (!nt.length) {
      continue;
    }
    const esc = nt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(esc, "i");
    const m = re.exec(nb);
    if (m) {
      idx = m.index;
      needleLen = Math.max(1, m[0].length);
      break;
    }
  }
  if (idx < 0) {
    return excerptFromBody(body, radius * 2);
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(nb.length, idx + needleLen + radius);
  let snippet = nb.slice(start, end).replace(/\n/g, " ").trim();
  if (start > 0) {
    snippet = "…" + snippet;
  }
  if (end < nb.length) {
    snippet = snippet + "…";
  }
  return snippet;
}

export function rankPostsForSearch(
  query: string,
  posts: ThreadPost[],
  channelPrefix: string | null,
  limit: number,
): SearchHit[] {
  const normPrefix = channelPrefix?.trim() ? channelPrefix.replace(/\/$/, "") : null;
  const filtered =
    normPrefix === null || !normPrefix.length
      ? posts
      : posts.filter((p) => p.channel === normPrefix || p.channel.startsWith(`${normPrefix}/`));

  const scored: { score: number; hit: SearchHit }[] = [];
  for (const post of filtered) {
    let score = combinedScore(query, post.body);
    if (phraseSubstringScore(query, post.author) > 0 || phraseSubstringScore(query, post.channel) > 0) {
      score = Math.min(1, score + 0.1);
    }
    if (score <= 0.01) {
      continue;
    }
    scored.push({
      score,
      hit: {
        post_id: post.id,
        channel: post.channel,
        author: post.author,
        created_at: post.created_at,
        excerpt: excerptAroundMatch(post.body, query),
        score: Math.round(score * 10000) / 10000,
      },
    });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.hit.created_at).getTime() - new Date(a.hit.created_at).getTime();
  });
  return scored.slice(0, limit).map((s) => s.hit);
}
