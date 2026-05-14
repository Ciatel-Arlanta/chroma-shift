"use client";

import { converter, differenceEuclidean, formatHex, parse } from "culori";
import { parse as parseSvg } from "svgson";

import { clamp, round } from "@/lib/utils";
import type { ExtractedColor } from "./types";

const toOklch = converter("oklch");

type Sample = { l: number; a: number; b: number };
type SvgNode = {
  attributes: Record<string, string>;
  children?: SvgNode[];
};

function hexToOklch(hex: string) {
  const parsed = toOklch(hex);
  return {
    l: round(parsed?.l ?? 0),
    c: round(parsed?.c ?? 0),
    h: parsed?.h == null ? null : round(parsed.h, 2),
  };
}

function colorDistance(first: string, second: string) {
  return differenceEuclidean("lab")(first, second);
}

function mergeNearbyColors(
  items: Array<{ hex: string; population: number; usages?: Array<"fill" | "stroke"> }>,
  source: "raster" | "svg",
) {
  const merged: Array<{ hex: string; population: number; usages?: Set<"fill" | "stroke"> }> = [];

  for (const item of items.sort((a, b) => b.population - a.population)) {
    const existing = merged.find((entry) => colorDistance(entry.hex, item.hex) < 0.06);
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

function kMeans(samples: Sample[], clusterCount: number, iterations = 10) {
  const centroids = Array.from({ length: clusterCount }, (_, index) => {
    const ratio = index / Math.max(clusterCount - 1, 1);
    const source = samples[Math.floor(ratio * (samples.length - 1))];
    return { ...source };
  });

  let assignments = new Array(samples.length).fill(0);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    assignments = samples.map((sample) => {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      centroids.forEach((centroid, index) => {
        const distance =
          (sample.l - centroid.l) ** 2 +
          (sample.a - centroid.a) ** 2 +
          (sample.b - centroid.b) ** 2;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      return bestIndex;
    });

    const sums = Array.from({ length: clusterCount }, () => ({
      l: 0,
      a: 0,
      b: 0,
      count: 0,
    }));

    samples.forEach((sample, index) => {
      const bucket = sums[assignments[index]];
      bucket.l += sample.l;
      bucket.a += sample.a;
      bucket.b += sample.b;
      bucket.count += 1;
    });

    sums.forEach((bucket, index) => {
      if (!bucket.count) {
        return;
      }

      centroids[index] = {
        l: bucket.l / bucket.count,
        a: bucket.a / bucket.count,
        b: bucket.b / bucket.count,
      };
    });
  }

  return { centroids, assignments };
}

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

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const samples: Sample[] = [];

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3] / 255;
    if (alpha < 0.15) {
      continue;
    }
    samples.push(rgbToLabSample(data[index], data[index + 1], data[index + 2]));
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

  const clusterCount = clamp(Math.round(Math.sqrt(samples.length / 120)), 6, 12);
  const { centroids, assignments } = kMeans(samples, clusterCount);
  const counts = new Array(clusterCount).fill(0);
  assignments.forEach((assignment) => {
    counts[assignment] += 1;
  });

  const colors = centroids
    .map((centroid, index) => ({
      hex: sampleToHex(centroid),
      population: counts[index],
    }))
    .filter((entry) => entry.population > 0);

  return mergeNearbyColors(colors, "raster");
}

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
