"use client";

import { useMemo, type CSSProperties } from "react";
import {
  parametricCurve,
  perBandCurves,
  graphicCurve,
  freqToX,
  dbToY,
  type CurvePoint,
  type BandCurve,
} from "@/lib/wiim/eq-response";
import { PEQ_RANGE, PEQ_LETTERS, bandColor } from "@/lib/wiim/eq-constants";
import type { ParametricBand, GraphicBand, PeqChannel } from "@/lib/wiim/types";

/**
 * SHOWA RE-SKIN: EQ response-curve visualization (Round 41; per-band colour
 * Round 42).
 *
 * A read-only SVG magnitude plot driven by the same band state the Eq card
 * already holds — no new fetch, no new SWR key. Curve math lives in
 * `src/lib/wiim/eq-response.ts` (a straight port of ozbenh/rustywiim's RBJ
 * biquad `band_response`); this component is presentation only.
 *
 * Modes:
 *  • parametric — sums the visible bands (a–j) into one rust response curve,
 *    with each contributing band's INDIVIDUAL response ghosted behind it in a
 *    per-band colour, and a colour-matched centre dot per band. In L/R channel
 *    mode BOTH channels are drawn (inactive dimmed to a single rust line;
 *    active gets the full colour treatment), since the card holds both
 *    `bands.left` and `bands.right` at render time.
 *  • graphic — a Catmull-Rom spline through the 10 fixed ISO gains (not a
 *    biquad sum); no per-band decomposition.
 *
 * Draggable nodes are explicitly deferred (Round 40 plan) — the curve is
 * driven entirely by the sliders below it; the band-centre dots are static
 * markers, not handles.
 *
 * Desktop-only: fixed viewBox, no responsive sizing (matches the rest of the
 * dashboard). Colours are faceplate-harmonised, NOT rustywiim's dark theme:
 * recessed --static plot area, low-opacity faceplate grid, rust --primary sum
 * line, and the BAND_COLORS ramp below for per-band lines/dots.
 */

// Plot geometry (SVG user units; the element scales via viewBox + w-full).
const PLOT_W = 560;
const PLOT_H = 150;
const MARGIN = { top: 10, right: 8, bottom: 18, left: 26 } as const;
const INNER_W = PLOT_W - MARGIN.left - MARGIN.right;
const INNER_H = PLOT_H - MARGIN.top - MARGIN.bottom;

// Grid: log-freq verticals + linear-dB horizontals. Values chosen to match the
// tick vocabulary used elsewhere in the card.
const FREQ_LINES: { hz: number; label: string }[] = [
  { hz: 20, label: "20" },
  { hz: 50, label: "50" },
  { hz: 100, label: "100" },
  { hz: 200, label: "200" },
  { hz: 500, label: "500" },
  { hz: 1000, label: "1k" },
  { hz: 2000, label: "2k" },
  { hz: 5000, label: "5k" },
  { hz: 10000, label: "10k" },
  { hz: 20000, label: "20k" },
];
const DB_LINES = [12, 6, 0, -6, -12];

const N_POINTS = 200;

/** Recessed plot-area recipe — identical groove treatment to the EQ faders. */
const PLOT_RECESS: CSSProperties = {
  background: "hsl(30 10% 4%)",
  boxShadow:
    "inset 0 1px 2px hsl(0 0% 0% / 0.95), inset 0 0 0 1px hsl(0 0% 0% / 0.7), inset 0 -1px 0 hsl(var(--faceplate) / 0.06)",
};

/** Build an SVG path `d` for a curve, in inner-plot coordinates. */
function curvePath(points: CurvePoint[]): string {
  let d = "";
  for (let i = 0; i < points.length; i++) {
    const x = MARGIN.left + freqToX(points[i].freq, INNER_W);
    const y = MARGIN.top + dbToY(points[i].db, INNER_H);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d.trim();
}

/** Build a filled-area path (curve down to the 0 dB baseline and back). */
function areaPath(points: CurvePoint[]): string {
  if (points.length === 0) return "";
  const baseY = MARGIN.top + dbToY(0, INNER_H);
  const x0 = MARGIN.left + freqToX(points[0].freq, INNER_W);
  const xN = MARGIN.left + freqToX(points[points.length - 1].freq, INNER_W);
  return `${curvePath(points)} L ${xN.toFixed(2)} ${baseY.toFixed(2)} L ${x0.toFixed(2)} ${baseY.toFixed(2)} Z`;
}

interface Dot {
  x: number;
  y: number;
  key: string;
  color: string;
}

/** Band-centre marker dots (parametric only) — static this round, one per
 *  contributing band, colour-matched to its per-band line. */
function bandDots(bands: ParametricBand[]): Dot[] {
  const visible = new Set<string>(PEQ_LETTERS);
  return bands
    .filter((b) => visible.has(b.letter) && b.mode !== -1)
    .map((b) => {
      // Dot sits at the band's own centre freq, at its own gain (0 for the
      // gain-independent LP/HP modes, which have no meaningful gain).
      const isPass = b.mode === 3 || b.mode === 5;
      const gain = isPass ? 0 : b.gain;
      return {
        key: b.letter,
        color: bandColor(b.letter),
        x: MARGIN.left + freqToX(b.frequency, INNER_W),
        y: MARGIN.top + dbToY(gain, INNER_H),
      };
    });
}

interface SubCurve {
  letter: string;
  color: string;
  d: string;
}

interface ChannelCurve {
  key: string;
  points: CurvePoint[];
  subCurves: SubCurve[];
  dots: Dot[];
  active: boolean;
}

export function EqResponseCurve({
  mode,
  parametricBands,
  graphicBands,
  activeChannel,
}: {
  mode: "parametric" | "graphic";
  /** Per-channel parametric bands. Stereo → only `stereo`; L/R → left + right. */
  parametricBands?: Partial<Record<PeqChannel, ParametricBand[]>>;
  graphicBands?: GraphicBand[];
  /** Which channel is currently being edited (drives dim/highlight in L/R). */
  activeChannel?: PeqChannel;
}) {
  const channels = useMemo<ChannelCurve[]>(() => {
    if (mode === "graphic") {
      const pts = graphicCurve(graphicBands ?? [], N_POINTS);
      return [{ key: "graphic", points: pts, subCurves: [], dots: [], active: true }];
    }
    const pb = parametricBands ?? {};
    const out: ChannelCurve[] = [];

    // Only the ACTIVE channel gets the full per-band decomposition (sub-curves
    // + colour dots). A dimmed inactive L/R channel draws just its rust sum
    // line — layering ten ghost curves under a 35%-opacity channel would be
    // visual soup.
    const decompose = (bands: ParametricBand[]): { subCurves: SubCurve[]; dots: Dot[] } => ({
      subCurves: perBandCurves(bands, N_POINTS).map((bc: BandCurve) => ({
        letter: bc.letter,
        color: bandColor(bc.letter),
        d: curvePath(bc.points),
      })),
      dots: bandDots(bands),
    });

    if (pb.stereo) {
      out.push({
        key: "stereo",
        points: parametricCurve(pb.stereo, N_POINTS),
        ...decompose(pb.stereo),
        active: true,
      });
    } else {
      for (const ch of ["left", "right"] as const) {
        const bands = pb[ch];
        if (!bands) continue;
        const isActive = activeChannel === ch;
        out.push({
          key: ch,
          points: parametricCurve(bands, N_POINTS),
          ...(isActive ? decompose(bands) : { subCurves: [], dots: [] }),
          active: isActive,
        });
      }
    }
    return out;
  }, [mode, parametricBands, graphicBands, activeChannel]);

  return (
    <div className="rounded-[var(--radius)] p-1" style={PLOT_RECESS}>
      <svg
        viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="EQ response curve"
      >
        {/* dB grid lines + left-margin labels */}
        {DB_LINES.map((db) => {
          const y = MARGIN.top + dbToY(db, INNER_H);
          const isZero = db === 0;
          return (
            <g key={`db-${db}`}>
              <line
                x1={MARGIN.left}
                x2={PLOT_W - MARGIN.right}
                y1={y}
                y2={y}
                stroke={`hsl(var(--faceplate) / ${isZero ? 0.28 : 0.12})`}
                strokeWidth={isZero ? 1 : 0.75}
              />
              <text
                x={MARGIN.left - 5}
                y={y + 3}
                textAnchor="end"
                fontSize={8}
                fontFamily="var(--font-mono, monospace)"
                fill="hsl(var(--faceplate) / 0.5)"
              >
                {db > 0 ? `+${db}` : db}
              </text>
            </g>
          );
        })}

        {/* frequency grid lines + bottom labels */}
        {FREQ_LINES.map((f) => {
          const x = MARGIN.left + freqToX(f.hz, INNER_W);
          return (
            <g key={`f-${f.hz}`}>
              <line
                x1={x}
                x2={x}
                y1={MARGIN.top}
                y2={PLOT_H - MARGIN.bottom}
                stroke="hsl(var(--faceplate) / 0.1)"
                strokeWidth={0.75}
              />
              <text
                x={x}
                y={PLOT_H - MARGIN.bottom + 11}
                textAnchor="middle"
                fontSize={8}
                fontFamily="var(--font-mono, monospace)"
                fill="hsl(var(--faceplate) / 0.5)"
              >
                {f.label}
              </text>
            </g>
          );
        })}

        {/* curves — inactive channels first (underneath), active on top */}
        {channels
          .slice()
          .sort((a, b) => Number(a.active) - Number(b.active))
          .map((ch) => (
            <g key={ch.key} opacity={ch.active ? 1 : 0.35}>
              {/* summed-response area fill */}
              <path d={areaPath(ch.points)} fill="hsl(var(--primary) / 0.1)" stroke="none" />

              {/* per-band ghost curves, drawn behind the sum line */}
              {ch.subCurves.map((sc) => (
                <path
                  key={sc.letter}
                  d={sc.d}
                  fill="none"
                  stroke={sc.color}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {/* summed response line (rust), on top of the ghosts */}
              <path
                d={curvePath(ch.points)}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={ch.active ? 1.75 : 1.25}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* colour-matched band-centre dots */}
              {ch.dots.map((d) => (
                <circle
                  key={d.key}
                  cx={d.x}
                  cy={d.y}
                  r={2.5}
                  fill={d.color}
                  stroke="hsl(30 10% 4%)"
                  strokeWidth={1}
                />
              ))}
            </g>
          ))}
      </svg>
    </div>
  );
}
