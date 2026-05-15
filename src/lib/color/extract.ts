"use client";

import { converter, differenceCiede2000, formatHex, parse } from "culori";
import { parse as parseSvg } from "svgson";

import { clamp, round } from "@/lib/utils";
import type { ExtractedColor } from "./types";

const toOklch = converter("oklch");
const ciede = differenceCiede2000();

type Sample = { l: number; a: number; b: number };
type SvgNode = {
  attributes: Record<string, string>;
  children?: SvgNode[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function hexToOklch(hex: string) {
  const parsed = toOklch(hex);
  return {
    l: round(parsed?.l ?? 0),
    c: round(parsed?.c ?? 0),
    h: parsed?.h == null ? null : round(parsed.h, 2),
  };
}

function colorDistance(first: string, second: string) {
  return ciede(first, second) ?? Infinity;
}

function rgbToLabSample(r: number, g: number, b: number): Sample {
  const parsed = parse(`rgb(${r} ${g} ${b})`);
  const labColor = parsed ? converter("lab")(parsed) : null;

  return {
    l: labColor?.l ?? 0,
    a: labColor?.a ?? 0,
    b: labColor?.b ?? 0,
  };
}

function sampleToHex(sample: Sample) {
  return (
    formatHex({
      mode: "lab",
      l: sample.l,
      a: sample.a,
      b: sample.b,
    }) ?? "#000000"
  );
}

/* ------------------------------------------------------------------ */
/*  Bilateral pre-filter – smooths shadows/gradients, keeps edges     */
/* ------------------------------------------------------------------ */

function bilateralFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius = 2,
  spatialSigma = 2.5,
  colorSigma = 28,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const spatialDenom = -1 / (2 * spatialSigma * spatialSigma);
  const colorDenom = -1 / (2 * colorSigma * colorSigma);

  // Precompute spatial weights for the kernel
  const kernelSize = radius * 2 + 1;
  const spatialWeights = new Float32Array(kernelSize * kernelSize);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      spatialWeights[(dy + radius) * kernelSize + (dx + radius)] =
        Math.exp((dx * dx + dy * dy) * spatialDenom);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const cR = data[idx];
      const cG = data[idx + 1];
      const cB = data[idx + 2];

      let rSum = 0, gSum = 0, bSum = 0, wSum = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const nIdx = (ny * width + nx) * 4;
          const dR = cR - data[nIdx];
          const dG = cG - data[nIdx + 1];
          const dB = cB - data[nIdx + 2];
          const colorDist2 = dR * dR + dG * dG + dB * dB;

          const sw = spatialWeights[(dy + radius) * kernelSize + (dx + radius)];
          const w = sw * Math.exp(colorDist2 * colorDenom);

          rSum += data[nIdx] * w;
          gSum += data[nIdx + 1] * w;
          bSum += data[nIdx + 2] * w;
          wSum += w;
        }
      }

      output[idx] = rSum / wSum;
      output[idx + 1] = gSum / wSum;
      output[idx + 2] = bSum / wSum;
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/* ------------------------------------------------------------------ */
/*  Weighted k-means – lightness is down-weighted so shadow variants  */
/*  of the same hue cluster together instead of fragmenting           */
/* ------------------------------------------------------------------ */

const LIGHTNESS_WEIGHT = 0.3;

function weightedDistance(a: Sample, b: Sample) {
  const dL = (a.l - b.l) * LIGHTNESS_WEIGHT;
  return dL * dL + (a.a - b.a) ** 2 + (a.b - b.b) ** 2;
}

function weightedKMeans(samples: Sample[], clusterCount: number, iterations = 14) {
  // k-means++ initialisation for better starting centroids
  const centroids: Sample[] = [{ ...samples[Math.floor(Math.random() * samples.length)] }];

  while (centroids.length < clusterCount) {
    const distances = samples.map((s) => {
      let minDist = Infinity;
      for (const c of centroids) {
        const d = weightedDistance(s, c);
        if (d < minDist) minDist = d;
      }
      return minDist;
    });
    const total = distances.reduce((s, d) => s + d, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < distances.length; i++) {
      rand -= distances[i];
      if (rand <= 0) {
        centroids.push({ ...samples[i] });
        break;
      }
    }
  }

  let assignments = new Array(samples.length).fill(0);

  for (let iteration = 0; iteration < iterations; iteration++) {
    // Assignment step
    assignments = samples.map((sample) => {
      let bestIndex = 0;
      let bestDist = Infinity;
      centroids.forEach((centroid, index) => {
        const dist = weightedDistance(sample, centroid);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = index;
        }
      });
      return bestIndex;
    });

    // Update step
    const sums = Array.from({ length: clusterCount }, () => ({
      l: 0, a: 0, b: 0, count: 0,
    }));

    samples.forEach((sample, index) => {
      const bucket = sums[assignments[index]];
      bucket.l += sample.l;
      bucket.a += sample.a;
      bucket.b += sample.b;
      bucket.count += 1;
    });

    sums.forEach((bucket, index) => {
      if (!bucket.count) return;
      centroids[index] = {
        l: bucket.l / bucket.count,
        a: bucket.a / bucket.count,
        b: bucket.b / bucket.count,
      };
    });
  }

  return { centroids, assignments };
}

/* ------------------------------------------------------------------ */
/*  Post-clustering: split any cluster whose lightness range is huge  */
/*  (e.g. a "dark-blue family" that covers both bg and card shadow)   */
/* ------------------------------------------------------------------ */

function splitWideClusters(
  centroids: Sample[],
  assignments: number[],
  samples: Sample[],
  maxTotal = 14,
) {
  const finalCentroids: Sample[] = [];
  const finalAssignments = new Array(samples.length).fill(0);
  const L_SPLIT_THRESHOLD = 28; // LAB lightness units

  for (let ci = 0; ci < centroids.length; ci++) {
    const members = samples
      .map((s, i) => ({ s, i }))
      .filter((_, idx) => assignments[idx] === ci);

    if (!members.length) continue;

    const lValues = members.map((m) => m.s.l);
    const lMin = Math.min(...lValues);
    const lMax = Math.max(...lValues);

    if (lMax - lMin > L_SPLIT_THRESHOLD && finalCentroids.length + 2 <= maxTotal) {
      // Split into light and dark halves by median
      const lMedian = lValues.sort((a, b) => a - b)[Math.floor(lValues.length / 2)];

      const darkMembers = members.filter((m) => m.s.l <= lMedian);
      const lightMembers = members.filter((m) => m.s.l > lMedian);

      const darkIdx = finalCentroids.length;
      const lightIdx = darkIdx + 1;

      finalCentroids.push(avgSample(darkMembers.map((m) => m.s)));
      finalCentroids.push(avgSample(lightMembers.map((m) => m.s)));

      darkMembers.forEach((m) => { finalAssignments[m.i] = darkIdx; });
      lightMembers.forEach((m) => { finalAssignments[m.i] = lightIdx; });
    } else {
      const idx = finalCentroids.length;
      finalCentroids.push(centroids[ci]);
      members.forEach((m) => { finalAssignments[m.i] = idx; });
    }
  }

  return { centroids: finalCentroids, assignments: finalAssignments };
}

function avgSample(samples: Sample[]): Sample {
  const n = samples.length || 1;
  return {
    l: samples.reduce((s, p) => s + p.l, 0) / n,
    a: samples.reduce((s, p) => s + p.a, 0) / n,
    b: samples.reduce((s, p) => s + p.b, 0) / n,
  };
}

/* ------------------------------------------------------------------ */
/*  Adaptive merge – uses CIEDE2000 with a threshold that scales      */
/*  based on the input image's lightness range                        */
/* ------------------------------------------------------------------ */

function mergeNearbyColors(
  items: Array<{ hex: string; population: number; usages?: Array<"fill" | "stroke"> }>,
  source: "raster" | "svg",
  mergeThreshold = 6,
) {
  const merged: Array<{ hex: string; population: number; usages?: Set<"fill" | "stroke"> }> = [];

  for (const item of items.sort((a, b) => b.population - a.population)) {
    const existing = merged.find((entry) => colorDistance(entry.hex, item.hex) < mergeThreshold);
    if (existing) {
      existing.population += item.population;
      item.usages?.forEach((usage) => existing.usages?.add(usage));
      continue;
    }

    merged.push({
      hex: item.hex,
      population: item.population,
      usages: new Set(item.usages),
    });
  }

  const total = merged.reduce((sum, item) => sum + item.population, 0) || 1;

  return merged
    .map<ExtractedColor>((item) => ({
      hex: item.hex,
      oklch: hexToOklch(item.hex),
      population: round(item.population / total, 4),
      source,
      usages: item.usages?.size ? Array.from(item.usages) : undefined,
    }))
    .sort((a, b) => b.population - a.population);
}

/* ------------------------------------------------------------------ */
/*  Image loading                                                     */
/* ------------------------------------------------------------------ */

async function loadImage(file: File) {
  const image = new Image();
  const url = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to decode image."));
      image.src = url;
    });

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ------------------------------------------------------------------ */
/*  Raster palette extraction – full improved pipeline                */
/* ------------------------------------------------------------------ */

export async function extractRasterPalette(file: File): Promise<ExtractedColor[]> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  const maxDimension = 280;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  canvas.width = Math.max(16, Math.floor(image.width * scale));
  canvas.height = Math.max(16, Math.floor(image.height * scale));

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const rawData = context.getImageData(0, 0, canvas.width, canvas.height);

  // Step 1: Bilateral pre-filter to smooth gradients while preserving edges
  const filtered = bilateralFilter(rawData.data, canvas.width, canvas.height, 2, 2.5, 28);

  // Step 2: Sample from the filtered image (every 4th pixel)
  const samples: Sample[] = [];

  for (let index = 0; index < filtered.length; index += 16) {
    const alpha = filtered[index + 3] / 255;
    if (alpha < 0.15) {
      continue;
    }
    samples.push(rgbToLabSample(filtered[index], filtered[index + 1], filtered[index + 2]));
  }

  if (!samples.length) {
    return [
      {
        hex: "#101828",
        oklch: hexToOklch("#101828"),
        population: 1,
        source: "raster",
      },
    ];
  }

  // Step 3: Weighted k-means (lightness down-weighted to merge shadow variants)
  const clusterCount = clamp(Math.round(Math.sqrt(samples.length / 100)), 5, 10);
  const { centroids: rawCentroids, assignments: rawAssignments } = weightedKMeans(
    samples,
    clusterCount,
  );

  // Step 4: Split clusters with very wide lightness ranges
  const { centroids, assignments } = splitWideClusters(
    rawCentroids,
    rawAssignments,
    samples,
  );

  const counts = new Array(centroids.length).fill(0);
  assignments.forEach((assignment) => {
    counts[assignment] += 1;
  });

  const colors = centroids
    .map((centroid, index) => ({
      hex: sampleToHex(centroid),
      population: counts[index],
    }))
    .filter((entry) => entry.population > 0);

  // Step 5: Adaptive merge threshold based on lightness range
  const lValues = samples.map((s) => s.l);
  const lightnessRange = Math.max(...lValues) - Math.min(...lValues);
  const mergeThreshold = lightnessRange > 65 ? 10 : lightnessRange > 40 ? 7 : 5;

  return mergeNearbyColors(colors, "raster", mergeThreshold);
}

/* ------------------------------------------------------------------ */
/*  SVG palette extraction (unchanged)                                */
/* ------------------------------------------------------------------ */

function collectSvgColors(node: SvgNode, collector: Array<{ hex: string; usage: "fill" | "stroke" }>) {
  const attributes = node.attributes ?? {};
  const styleEntries = (attributes.style ?? "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [key, value] = entry.split(":");
      return [key?.trim(), value?.trim()] as const;
    });

  const styleMap = new Map(styleEntries);

  for (const usage of ["fill", "stroke"] as const) {
    const value = attributes[usage] ?? styleMap.get(usage);
    if (!value || value === "none" || value.startsWith("url(") || value === "transparent") {
      continue;
    }

    const normalized = formatHex(value);
    if (normalized) {
      collector.push({ hex: normalized, usage });
    }
  }

  node.children?.forEach((child) => collectSvgColors(child, collector));
}

export async function extractSvgPalette(svgText: string): Promise<ExtractedColor[]> {
  const tree = (await parseSvg(svgText)) as SvgNode;
  const collected: Array<{ hex: string; usage: "fill" | "stroke" }> = [];
  collectSvgColors(tree, collected);

  if (!collected.length) {
    return [
      {
        hex: "#0f172a",
        oklch: hexToOklch("#0f172a"),
        population: 1,
        source: "svg",
      },
    ];
  }

  const counts = new Map<string, { population: number; usages: Set<"fill" | "stroke"> }>();
  collected.forEach(({ hex, usage }) => {
    const current = counts.get(hex) ?? { population: 0, usages: new Set<"fill" | "stroke">() };
    current.population += 1;
    current.usages.add(usage);
    counts.set(hex, current);
  });

  return mergeNearbyColors(
    Array.from(counts.entries()).map(([hex, value]) => ({
      hex,
      population: value.population,
      usages: Array.from(value.usages),
    })),
    "svg",
  );
}
