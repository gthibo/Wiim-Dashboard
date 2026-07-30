/**
 * EQ response-curve math — pure logic, no React, no server-only.
 *
 * Ported from ozbenh/rustywiim `src/ui/eq/parametric.rs` `band_response()`,
 * a clean RBJ Audio-EQ-Cookbook biquad-magnitude implementation. Only the
 * MATH is ported — the Cairo drawing code is not (that's the component's job).
 *
 * Provenance / mapping notes (Round 41 build of the Round 40 plan):
 *  - rustywiim keys on a `PeqBandMode` enum; we key on our integer `mode`
 *    field directly: -1/unknown → flat (0 dB); 0=LowShelf, 1=Peak,
 *    2=HighShelf are gain-driven (with the |gain|<0.001 → 0 early-out);
 *    3=LowPass, 5=HighPass are gain-INDEPENDENT cutoff forms (NO early-out —
 *    they shape the curve at gain 0, and our data model has no gain field for
 *    them). 4 is unused/reserved → treated as flat.
 *  - Sample rate hardcoded 48000 (matches rustywiim and the device).
 *  - Q: we use each band's own `q` value as-read. NOTE the codebase carries
 *    two different q defaults — device reads default to 0.25 (eq.ts toBands),
 *    reset writes 1 — so an untouched band renders with q=0.25. That's the
 *    real device state; the curve reflects it faithfully. `q.max(0.01)`
 *    guards the divide, mirroring rustywiim.
 *  - Parametric curve sums ONLY the visible band set (a–j / PEQ_LETTERS), not
 *    a–l — bands k/l exist in firmware but aren't shown, so they must not
 *    contribute to the drawn curve.
 */

import { PEQ_RANGE, PEQ_LETTERS, GRAPHIC_BANDS } from "./eq-constants";
import type { ParametricBand, GraphicBand } from "./types";

const SAMPLE_RATE = 48000;
const TWO_PI = 2 * Math.PI;

/** Filter-mode integers (mirrors PEQ_MODES / ParametricBand.mode). */
const MODE_LOW_SHELF = 0;
const MODE_PEAK = 1;
const MODE_HIGH_SHELF = 2;
const MODE_LOW_PASS = 3;
const MODE_HIGH_PASS = 5;

/** True for the two gain-independent cutoff filters (no gain term / early-out). */
function isGainIndependent(mode: number): boolean {
  return mode === MODE_LOW_PASS || mode === MODE_HIGH_PASS;
}

/**
 * One band's contribution in dB at `evalFreq`, from its own freq/q/gain/mode.
 * Direct port of rustywiim's `band_response`. Returns 0 (flat) for Off /
 * unknown modes and for gain-driven modes sitting at ~0 dB.
 */
export function bandResponseDb(band: ParametricBand, evalFreq: number): number {
  const { mode, frequency: freqHz, q, gain: gainDb } = band;

  const gainIndependent = isGainIndependent(mode);

  // Off (-1), unused (4), or anything we don't model → flat.
  if (
    mode !== MODE_LOW_SHELF &&
    mode !== MODE_PEAK &&
    mode !== MODE_HIGH_SHELF &&
    mode !== MODE_LOW_PASS &&
    mode !== MODE_HIGH_PASS
  ) {
    return 0;
  }
  // Gain-driven modes at ~0 dB contribute nothing (matches rustywiim early-out).
  if (!gainIndependent && Math.abs(gainDb) < 0.001) return 0;

  const w0 = (TWO_PI * freqHz) / SAMPLE_RATE;
  const w = (TWO_PI * evalFreq) / SAMPLE_RATE;
  const a = Math.pow(10, gainDb / 40);
  const alpha = Math.sin(w0) / (2 * Math.max(q, 0.01));
  const cosW0 = Math.cos(w0);

  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;

  switch (mode) {
    case MODE_PEAK:
      b0 = 1 + alpha * a;
      b1 = -2 * cosW0;
      b2 = 1 - alpha * a;
      a0 = 1 + alpha / a;
      a1 = -2 * cosW0;
      a2 = 1 - alpha / a;
      break;
    case MODE_LOW_SHELF: {
      const sq = 2 * Math.sqrt(a) * alpha;
      b0 = a * (a + 1 - (a - 1) * cosW0 + sq);
      b1 = 2 * a * (a - 1 - (a + 1) * cosW0);
      b2 = a * (a + 1 - (a - 1) * cosW0 - sq);
      a0 = a + 1 + (a - 1) * cosW0 + sq;
      a1 = -2 * (a - 1 + (a + 1) * cosW0);
      a2 = a + 1 + (a - 1) * cosW0 - sq;
      break;
    }
    case MODE_HIGH_SHELF: {
      const sq = 2 * Math.sqrt(a) * alpha;
      b0 = a * (a + 1 + (a - 1) * cosW0 + sq);
      b1 = -2 * a * (a - 1 + (a + 1) * cosW0);
      b2 = a * (a + 1 + (a - 1) * cosW0 - sq);
      a0 = a + 1 - (a - 1) * cosW0 + sq;
      a1 = 2 * (a - 1 - (a + 1) * cosW0);
      a2 = a + 1 - (a - 1) * cosW0 - sq;
      break;
    }
    case MODE_LOW_PASS:
      // Pure cutoff — no `a`/gain term. Real Ultra captures show gain 0 here.
      b0 = (1 - cosW0) / 2;
      b1 = 1 - cosW0;
      b2 = (1 - cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
    case MODE_HIGH_PASS:
      b0 = (1 + cosW0) / 2;
      b1 = -(1 + cosW0);
      b2 = (1 + cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
    default:
      return 0;
  }

  const cw = Math.cos(w);
  const c2w = Math.cos(2 * w);
  const num = b0 * b0 + b1 * b1 + b2 * b2 + 2 * (b0 * b1 + b1 * b2) * cw + 2 * b0 * b2 * c2w;
  const den = a0 * a0 + a1 * a1 + a2 * a2 + 2 * (a0 * a1 + a1 * a2) * cw + 2 * a0 * a2 * c2w;
  if (den <= 0) return 0;
  return 10 * Math.log10(num / den);
}

// --- coordinate helpers ------------------------------------------------------
// Log-frequency X over [freqMin, freqMax]; linear dB Y over [gainMin, gainMax].
// Both directions provided: the forward maps drive curve-first (this round);
// the inverses (`xToFreq`/`yToDb`) are unused until the draggable-nodes round
// but land now at zero cost so that round needs no data-layer change.

const LN_FMIN = Math.log(PEQ_RANGE.freqMin);
const LN_FMAX = Math.log(PEQ_RANGE.freqMax);

/** Frequency (Hz) → normalised X in [0, plotW]. */
export function freqToX(freq: number, plotW: number): number {
  const clamped = Math.min(Math.max(freq, PEQ_RANGE.freqMin), PEQ_RANGE.freqMax);
  return ((Math.log(clamped) - LN_FMIN) / (LN_FMAX - LN_FMIN)) * plotW;
}

/** Normalised X in [0, plotW] → frequency (Hz). Inverse of freqToX. */
export function xToFreq(x: number, plotW: number): number {
  const t = Math.min(Math.max(x, 0), plotW) / plotW;
  return Math.exp(LN_FMIN + t * (LN_FMAX - LN_FMIN));
}

/** Gain (dB) → Y in [0, plotH], y=0 at the TOP (max gain), like SVG. */
export function dbToY(db: number, plotH: number): number {
  const { gainMin, gainMax } = PEQ_RANGE;
  const clamped = Math.min(Math.max(db, gainMin), gainMax);
  return ((gainMax - clamped) / (gainMax - gainMin)) * plotH;
}

/** Y in [0, plotH] → gain (dB). Inverse of dbToY. */
export function yToDb(y: number, plotH: number): number {
  const { gainMin, gainMax } = PEQ_RANGE;
  const t = Math.min(Math.max(y, 0), plotH) / plotH;
  return gainMax - t * (gainMax - gainMin);
}

// --- curves ------------------------------------------------------------------

export interface CurvePoint {
  freq: number; // Hz (log-spaced)
  db: number; // summed / interpolated response
}

/** Log-spaced evaluation frequencies across the full [freqMin, freqMax] range. */
function logFreqs(nPoints: number): number[] {
  const n = Math.max(2, Math.floor(nPoints));
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out[i] = Math.exp(LN_FMIN + t * (LN_FMAX - LN_FMIN));
  }
  return out;
}

/**
 * Parametric response: sum of all VISIBLE bands (a–j) at each log-spaced freq.
 * Bands outside PEQ_LETTERS (k/l) are ignored even if present in the array.
 */
export function parametricCurve(bands: ParametricBand[], nPoints = 200): CurvePoint[] {
  const visible = new Set<string>(PEQ_LETTERS);
  const active = bands.filter((b) => visible.has(b.letter));
  return logFreqs(nPoints).map((freq) => {
    let db = 0;
    for (const band of active) db += bandResponseDb(band, freq);
    return { freq, db };
  });
}

/** One visible band's individual response curve, tagged with its letter. */
export interface BandCurve {
  letter: string;
  mode: number;
  points: CurvePoint[];
}

/**
 * Per-band responses: one curve per VISIBLE, CONTRIBUTING band, on the SAME
 * log-freq grid as `parametricCurve` (so a sub-curve and the summed curve line
 * up point-for-point). Off bands (mode -1 / unknown) and gain-driven bands
 * sitting at ~0 dB are omitted — they'd only draw a flat line on the baseline.
 * The gain-independent cutoff filters (LP/HP) are always kept, since they
 * shape the curve even at gain 0. Order follows PEQ_LETTERS (a→j), which the
 * component relies on to assign a stable per-letter colour.
 */
export function perBandCurves(bands: ParametricBand[], nPoints = 200): BandCurve[] {
  const order = new Map<string, number>(PEQ_LETTERS.map((l, i) => [l, i]));
  const freqs = logFreqs(nPoints);
  const out: BandCurve[] = [];
  for (const band of bands) {
    if (!order.has(band.letter)) continue; // k/l and anything unexpected
    const gainIndep = band.mode === MODE_LOW_PASS || band.mode === MODE_HIGH_PASS;
    const known =
      band.mode === MODE_LOW_SHELF ||
      band.mode === MODE_PEAK ||
      band.mode === MODE_HIGH_SHELF ||
      gainIndep;
    if (!known) continue; // Off / unused
    if (!gainIndep && Math.abs(band.gain) < 0.001) continue; // silent shelf/peak
    out.push({
      letter: band.letter,
      mode: band.mode,
      points: freqs.map((freq) => ({ freq, db: bandResponseDb(band, freq) })),
    });
  }
  out.sort((a, b) => (order.get(a.letter)! - order.get(b.letter)!));
  return out;
}

/**
 * Graphic response: a smooth monotone Catmull-Rom spline through the 10 fixed
 * ISO band centers in LOG-frequency space, gain-only (not a biquad sum). The
 * 10 control points are (bandCenterHz, gainDb); the curve is sampled at
 * nPoints log-spaced frequencies and interpolated in (lnFreq, dB) space.
 */
export function graphicCurve(bands: GraphicBand[], nPoints = 200): CurvePoint[] {
  // Control points in (lnFreq, gain) — centers come from GRAPHIC_BANDS order.
  const gainByParam = new Map<string, number>();
  for (const b of bands) gainByParam.set(b.param, b.gain);

  const centers = [31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const xs = centers.map((c) => Math.log(c));
  const ys = GRAPHIC_BANDS.map((b) => gainByParam.get(b.param) ?? 0);

  return logFreqs(nPoints).map((freq) => {
    const lx = Math.log(freq);
    return { freq, db: catmullRomAt(xs, ys, lx) };
  });
}

/**
 * Catmull-Rom interpolation of y at position x, given strictly-increasing xs.
 * Clamps to the endpoints outside [xs[0], xs[n-1]]. Uniform Catmull-Rom with
 * endpoint duplication for the first/last segments.
 */
function catmullRomAt(xs: number[], ys: number[], x: number): number {
  const n = xs.length;
  if (n === 0) return 0;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];

  // Find segment i such that xs[i] <= x < xs[i+1].
  let i = 0;
  while (i < n - 1 && xs[i + 1] <= x) i++;

  const p1 = ys[i];
  const p2 = ys[i + 1];
  const p0 = i > 0 ? ys[i - 1] : ys[i];
  const p3 = i + 2 < n ? ys[i + 2] : ys[i + 1];

  const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
  const t2 = t * t;
  const t3 = t2 * t;

  // Standard uniform Catmull-Rom basis (tension 0.5).
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}
