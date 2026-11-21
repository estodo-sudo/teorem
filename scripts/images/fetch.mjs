#!/usr/bin/env node
/**
 * Image pipeline (SPEC_GORSELLER_V5 §1, §5).
 *
 *   node scripts/images/fetch.mjs            # download what is missing or changed, process, write the registry
 *   node scripts/images/fetch.mjs --force    # reprocess everything
 *
 * Reads assets/images/manifest.json. Originals are cached in .cache/images/ (not committed). For every
 * accepted entry it writes WebP files under assets/images/, records sizes, blurhash and the readability
 * result in assets/images/fetch-lock.json, and regenerates src/content/images.ts (the single registry).
 *
 * Ids: "story/<id>" (cover → 2:3 card + 9:16 slide), "story/<id>/<n>" (slide), "camp/<id>",
 * "program/<id>", "glossary/<id>".
 */
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { encode } from 'blurhash';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFEST = path.join(ROOT, 'assets/images/manifest.json');
const LOCK = path.join(ROOT, 'assets/images/fetch-lock.json');
const REGISTRY = path.join(ROOT, 'src/content/images.ts');
const CACHE = path.join(ROOT, '.cache/images');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
/** Bump when the processing below changes, so every file is rebuilt. */
const PIPELINE = 5;

/** §5 table: ratio as w×h, quality, byte limit. `slideMinQuality` is the fallback when the total is over 18 MB. */
export const KINDS = {
  slide: { w: 720, h: 1280, q: 62, max: 110 * 1024 },
  card: { w: 600, h: 900, q: 70, max: 80 * 1024 },
  camp: { w: 900, h: 420, q: 70, max: 70 * 1024 },
  program: { w: 660, h: 390, q: 70, max: 60 * 1024 },
  glossary: { w: 320, h: 320, q: 72, max: 40 * 1024 },
};
export const TOTAL_MAX = 18 * 1024 * 1024;

/**
 * Bottom scrim the viewer draws (StoryViewer `SlideScrim`): 0 at 40 % height, eased to `max` at the bottom.
 * The same stops are used here to measure readability, so the test and the screen agree.
 */
export const SCRIM_STOPS = [
  [0.4, 0],
  [0.5, 0.55],
  [0.6, 0.85],
  [0.75, 0.97],
  [1, 1],
];
/** Slide types whose text sits on the dark frosted card (theme `veil.card`, rgba(15,18,20,0.72)). */
export const CARD_TYPES = ['myth', 'quiz', 'didYouKnow', 'doctor'];
const CARD_RGB = [15, 18, 20];
const CARD_ALPHA = 0.72;
export const SCRIM_BASE = 0.78;
export const SCRIM_MAX = 0.88;
export const TOP_SCRIM = 0.35;

export function scrimAt(t, max) {
  if (t <= SCRIM_STOPS[0][0]) return 0;
  for (let i = 1; i < SCRIM_STOPS.length; i++) {
    const [t1, a1] = SCRIM_STOPS[i];
    const [t0, a0] = SCRIM_STOPS[i - 1];
    if (t <= t1) return max * (a0 + ((a1 - a0) * (t - t0)) / (t1 - t0));
  }
  return max;
}

/** What files an id produces: [{kind, file}] relative to assets/images/. */
export function outputsFor(id) {
  const parts = id.split('/');
  if (parts[0] === 'story' && parts.length === 2) return [{ kind: 'card', file: `story/${parts[1]}/card.webp` }, { kind: 'slide', file: `story/${parts[1]}/1.webp` }];
  if (parts[0] === 'story' && parts.length === 3) return [{ kind: 'slide', file: `story/${parts[1]}/${parts[2]}.webp` }];
  if (parts[0] === 'camp') return [{ kind: 'camp', file: `camp/${parts[1]}.webp` }];
  if (parts[0] === 'program') return [{ kind: 'program', file: `program/${parts[1]}.webp` }];
  if (parts[0] === 'glossary') return [{ kind: 'glossary', file: `glossary/${parts[1]}.webp` }];
  throw new Error(`unknown image id ${id}`);
}

/** Crop box of ratio w/h inside W×H, centred on the focus point and kept inside the image. */
export function cropBox(W, H, w, h, focus) {
  const r = w / h;
  let cw = W;
  let ch = H;
  if (W / H > r) cw = Math.round(H * r);
  else ch = Math.round(W / r);
  const left = Math.round(Math.min(Math.max(focus.x * W - cw / 2, 0), W - cw));
  const top = Math.round(Math.min(Math.max(focus.y * H - ch / 2, 0), H - ch));
  return { left, top, width: cw, height: ch };
}

/** sRGB 0–255 → relative luminance (WCAG). */
const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
export const luminance = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

/**
 * Readability (§5): white text on the bottom 45 % of the slide, under the scrim. The 95th-percentile pixel
 * luminance stands for "the brightest the text will sit on". Returns the lowest scrim (0.78 … 0.88) that
 * reaches 4.5:1, or null when even 0.88 is not enough.
 */
export async function readability(buf, onCard = false) {
  const W = 72;
  const H = 128;
  const { data } = await sharp(buf).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const contrastFor = (max) => {
    const ls = [];
    for (let y = Math.floor(H * 0.55); y < H; y++) {
      const a = scrimAt((y + 0.5) / H, max);
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3;
        const px = [0, 1, 2].map((k) => data[i + k] * (1 - a));
        const c = onCard ? px.map((v, k) => v * (1 - CARD_ALPHA) + CARD_RGB[k] * CARD_ALPHA) : px;
        ls.push(luminance(c[0], c[1], c[2]));
      }
    }
    ls.sort((p, q) => p - q);
    const l95 = ls[Math.floor(ls.length * 0.95)];
    return 1.05 / (l95 + 0.05);
  };
  for (let m = SCRIM_BASE; m <= SCRIM_MAX + 1e-9; m += 0.02) {
    const c = contrastFor(m);
    if (c >= 4.5) return { scrim: Math.round(m * 100) / 100, contrast: Math.round(c * 100) / 100 };
  }
  return { scrim: null, contrast: Math.round(contrastFor(SCRIM_MAX) * 100) / 100 };
}

async function download(entry) {
  const key = crypto.createHash('sha1').update(entry.download).digest('hex').slice(0, 10);
  const file = path.join(CACHE, `${entry.source?.photoId ?? entry.id.replace(/\//g, '_')}-${key}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return file;
  fs.mkdirSync(CACHE, { recursive: true });
  for (let i = 0; i < 3; i++) {
    const r = await fetch(entry.download, { headers: { 'user-agent': UA } }).catch(() => null);
    if (r?.ok) {
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      return file;
    }
    await new Promise((res) => setTimeout(res, 1500));
  }
  throw new Error(`download failed: ${entry.id} ${entry.download}`);
}

/** Colour step (§5): saturation −8 %, contrast −5 %, a slight warm shift. */
const grade = (img) =>
  img
    .recomb([
      [1.02, 0, 0],
      [0, 1, 0],
      [0, 0, 0.96],
    ])
    .modulate({ saturation: 0.92 })
    .linear(0.95, 128 * 0.05);

async function render(src, kind, focus, quality, soften = 0) {
  const spec = KINDS[kind];
  const meta = await sharp(src).rotate().metadata();
  const box = cropBox(meta.width, meta.height, spec.w, spec.h, focus);
  let base = sharp(src).rotate().extract(box).resize(spec.w, spec.h, { kernel: 'lanczos3' });
  if (soften) base = base.blur(soften);
  return grade(base).webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
}

async function blurhashOf(buf) {
  const { data, info } = await sharp(buf).resize(32, 32, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
}

const hashOf = (entry, slideQ) => crypto.createHash('sha1').update(JSON.stringify([PIPELINE, entry.download, entry.focus, slideQ])).digest('hex').slice(0, 12);

/** "story/<id>/<n>" → slide type, from the story content. */
function slideTypes() {
  const stories = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/stories.tr.json'), 'utf8'));
  const list = Array.isArray(stories) ? stories : stories.stories;
  const out = {};
  for (const st of list) st.slides.forEach((p, i) => (out[i === 0 ? `story/${st.id}` : `story/${st.id}/${i + 1}`] = p.type));
  return out;
}

async function processAll({ force, slideQuality }) {
  const types = slideTypes();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const lock = fs.existsSync(LOCK) ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : { images: {} };
  const next = {};
  let built = 0;
  for (const entry of manifest.images) {
    if (entry.status !== 'accepted') continue;
    const h = hashOf(entry, slideQuality);
    const outs = outputsFor(entry.id);
    const prev = lock.images[entry.id];
    const present = outs.every((o) => fs.existsSync(path.join(ROOT, 'assets/images', o.file)));
    if (!force && prev?.hash === h && present) {
      next[entry.id] = prev;
      continue;
    }
    const src = await download(entry);
    const files = {};
    let blurhash = null;
    let read = null;
    for (const o of outs) {
      const spec = KINDS[o.kind];
      let q = o.kind === 'slide' ? slideQuality : spec.q;
      let buf = await render(src, o.kind, entry.focus, q);
      while (buf.length > spec.max && q > 50) {
        q -= 4;
        buf = await render(src, o.kind, entry.focus, q);
      }
      // Very fine textures (gravel, leaves): soften slightly instead of dropping quality further.
      for (const sigma of [0.5, 0.7, 0.9]) {
        if (buf.length <= spec.max) break;
        buf = await render(src, o.kind, entry.focus, q, sigma);
      }
      const out = path.join(ROOT, 'assets/images', o.file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, buf);
      files[o.kind] = { file: o.file, bytes: buf.length, quality: q, overLimit: buf.length > spec.max };
      if (!blurhash) blurhash = await blurhashOf(buf);
      if (o.kind === 'slide') read = { ...(await readability(buf, CARD_TYPES.includes(types[entry.id]))), type: types[entry.id] ?? 'cover' };
    }
    next[entry.id] = { hash: h, files, blurhash, readability: read };
    built++;
    process.stdout.write(`built ${entry.id}${read ? ` contrast ${read.contrast}${read.scrim ? ` scrim ${read.scrim}` : ' FAIL'}` : ''}\n`);
  }
  return { manifest, lock: { pipeline: PIPELINE, slideQuality, images: next }, built };
}

const bytesOf = (lock) => Object.values(lock.images).reduce((n, e) => n + Object.values(e.files).reduce((m, f) => m + f.bytes, 0), 0);

function writeRegistry(manifest, lock) {
  const q = (s) => JSON.stringify(s);
  const lines = [];
  for (const entry of manifest.images) {
    const l = lock.images[entry.id];
    if (entry.status !== 'accepted' || !l) continue;
    const main = l.files.card ?? l.files.camp ?? l.files.program ?? l.files.glossary ?? l.files.slide;
    const slide = l.files.card ? l.files.slide : undefined;
    const fields = [
      `image: require('../../assets/images/${main.file}')`,
      slide ? `slide: require('../../assets/images/${slide.file}')` : null,
      `blurhash: ${q(l.blurhash)}`,
      `alt: ${q(entry.alt)}`,
      `focus: { x: ${entry.focus.x}, y: ${entry.focus.y} }`,
      l.readability?.scrim ? `scrim: ${l.readability.scrim}` : null,
      `bytes: ${main.bytes + (slide?.bytes ?? 0)}`,
    ].filter(Boolean);
    lines.push(`  ${q(entry.id)}: { ${fields.join(', ')} },`);
  }

  const src = `/**
 * Image registry (SPEC_GORSELLER_V5 §6). GENERATED by scripts/images/fetch.mjs from assets/images/manifest.json;
 * do not edit by hand. Sources and licences: assets/images/CREDITS.md.
 *
 * Ids: "story/<id>" is a story cover (\`image\` = 2:3 card, \`slide\` = 9:16 full-screen slide),
 * "story/<id>/<n>" a story slide, "camp/<id>", "program/<id>", "glossary/<id>" cards.
 * Anything without an entry falls back to a tone gradient with an icon.
 */
export interface AppImage {
  image: number;
  /** Full-screen 9:16 crop of a story cover. */
  slide?: number;
  blurhash: string;
  alt: string;
  /** Crop focus, 0–1; also used as expo-image \`contentPosition\`. */
  focus: { x: number; y: number };
  /** Bottom scrim opacity this slide needs for 4.5:1 white text (default 0.78). */
  scrim?: number;
  /** File size in bytes (size report / tests). */
  bytes: number;
}

export const IMAGES: Record<string, AppImage> = {
${lines.join('\n')}
};

export const appImage = (id: string | undefined): AppImage | undefined => (id ? IMAGES[id] : undefined);

/** Keşfet sections → registry prefixes. */
const PREFIX = { stories: 'story', camps: 'camp', programs: 'program', glossary: 'glossary' } as const;
export type ExploreSection = keyof typeof PREFIX;
export type ExploreImage = AppImage;
export const exploreImage = (section: ExploreSection, id: string): AppImage | undefined => IMAGES[\`\${PREFIX[section]}/\${id}\`];
`;
  fs.writeFileSync(REGISTRY, src);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force');
  let res = await processAll({ force, slideQuality: KINDS.slide.q });
  if (bytesOf(res.lock) > TOTAL_MAX) {
    console.log(`total ${(bytesOf(res.lock) / 1048576).toFixed(1)} MB > 18 MB → slide quality 58`);
    res = await processAll({ force: true, slideQuality: 58 });
  }
  fs.writeFileSync(LOCK, JSON.stringify(res.lock, null, 2) + '\n');
  writeRegistry(res.manifest, res.lock);
  const fails = Object.entries(res.lock.images).filter(([, e]) => e.readability && !e.readability.scrim).map(([id]) => id);
  const over = Object.entries(res.lock.images).flatMap(([id, e]) => Object.values(e.files).filter((f) => f.overLimit).map((f) => `${id}:${f.file}`));
  console.log(`built ${res.built}, total ${(bytesOf(res.lock) / 1048576).toFixed(2)} MB, readability fails: ${fails.join(', ') || 'none'}, over limit: ${over.join(', ') || 'none'}`);
}
