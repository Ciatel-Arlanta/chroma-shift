"use client";

import { converter, differenceCiede2000, formatHex } from "culori";
import chroma from "chroma-js";

import { clamp } from "@/lib/utils";
import type { ExtractedColor, SemanticAssignment, SemanticRole, ThemeTokens } from "./types";

const roleToToken: Record<SemanticRole, keyof ThemeTokens> = {
  background: "background",
  surface: "card",
  surfaceMuted: "secondary",
  textPrimary: "foreground",
  textSecondary: "mutedForeground",
  accent: "accent",
  accentStrong: "primary",
  border: "border",
};

const compare = differenceCiede2000();
const toOklch = converter("oklch");
const toRgb = converter("rgb");

/* ------------------------------------------------------------------ */
/*  Role / token resolution                                           */
/* ------------------------------------------------------------------ */

function pickRole(hex: string, assignments: SemanticAssignment[]) {
  let bestRole: SemanticRole = "background";
  let bestDistance = Number.POSITIVE_INFINITY;

  assignments.forEach((assignment) => {
    const distance = compare(hex, assignment.color) ?? Infinity;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestRole = assignment.role;
    }
  });

  return bestRole;
}

function remapColor(hex: string, assignments: SemanticAssignment[], tokens: ThemeTokens) {
  const role = pickRole(hex, assignments);
  const token = roleToToken[role];
  return formatHex(tokens[token]) ?? token;
}

function packRgb(r: number, g: number, b: number) {
  return (r << 16) | (g << 8) | b;
}

/* ------------------------------------------------------------------ */
/*  Precomputed OKLCH lookup for centroids and targets                */
/* ------------------------------------------------------------------ */

interface OklchTuple {
  l: number;
  c: number;
  h: number;
}

function safeOklch(hex: string): OklchTuple {
  const parsed = toOklch(hex);
  return {
    l: parsed?.l ?? 0,
    c: parsed?.c ?? 0,
    h: parsed?.h ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Lightness-relative remap – preserves shadows, gradients, depth    */
/*                                                                    */
/*  Instead of flat-replacing pixel → token, we compute:              */
/*    target.L + (pixel.L - centroid.L) × dampen                      */
/*  This keeps the lightness structure of the original image          */
/* ------------------------------------------------------------------ */

const L_DAMPEN = 0.82;
const C_DAMPEN = 0.45;

function remapPixelOklch(
  pixelOklch: OklchTuple,
  centroidOklch: OklchTuple,
  targetOklch: OklchTuple,
): [number, number, number] {
  const remappedL = clamp(targetOklch.l + (pixelOklch.l - centroidOklch.l) * L_DAMPEN, 0, 1);
  const remappedC = clamp(targetOklch.c + (pixelOklch.c - centroidOklch.c) * C_DAMPEN, 0, 0.37);
  const remappedH = targetOklch.h;

  const rgb = toRgb({ mode: "oklch", l: remappedL, c: remappedC, h: remappedH });

  return [
    Math.round(clamp((rgb?.r ?? 0) * 255, 0, 255)),
    Math.round(clamp((rgb?.g ?? 0) * 255, 0, 255)),
    Math.round(clamp((rgb?.b ?? 0) * 255, 0, 255)),
  ];
}

/* ------------------------------------------------------------------ */
/*  Raster preview remapping                                          */
/* ------------------------------------------------------------------ */

export async function remapRasterPreview(
  file: File,
  extractedColors: ExtractedColor[],
  assignments: SemanticAssignment[],
  tokens: ThemeTokens,
) {
  const image = new Image();
  const sourceUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to render uploaded image."));
      image.src = sourceUrl;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Canvas is unavailable in this browser.");
    }

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Precompute: centroid hex → { targetRgb, centroidOklch, targetOklch }
    const centroidOklchMap = new Map<string, OklchTuple>();
    const targetOklchMap = new Map<string, OklchTuple>();
    const flatMapping = new Map<string, [number, number, number]>();

    extractedColors.forEach((color) => {
      const targetHex = remapColor(color.hex, assignments, tokens);
      flatMapping.set(color.hex, chroma(targetHex).rgb() as [number, number, number]);
      centroidOklchMap.set(color.hex, safeOklch(color.hex));
      targetOklchMap.set(color.hex, safeOklch(targetHex));
    });

    // Precompute centroid OKLCH as arrays for fast iteration
    const centroidHexes = extractedColors.map((c) => c.hex);
    const centroidOklchs = centroidHexes.map((h) => centroidOklchMap.get(h)!);
    const targetOklchs = centroidHexes.map((h) => targetOklchMap.get(h)!);

    // Per-pixel cache keyed by packed RGB → final [r, g, b]
    const perPixelCache = new Map<number, [number, number, number]>();

    for (let index = 0; index < imageData.data.length; index += 4) {
      const alpha = imageData.data[index + 3];
      if (alpha < 16) {
        continue;
      }

      const red = imageData.data[index];
      const green = imageData.data[index + 1];
      const blue = imageData.data[index + 2];
      const key = packRgb(red, green, blue);
      const cached = perPixelCache.get(key);

      if (cached) {
        imageData.data[index] = cached[0];
        imageData.data[index + 1] = cached[1];
        imageData.data[index + 2] = cached[2];
        continue;
      }

      // Find nearest centroid using CIEDE2000
      const source = chroma(red, green, blue).hex();
      let nearestIdx = 0;
      let bestDist = Infinity;

      for (let ci = 0; ci < centroidHexes.length; ci++) {
        const d = compare(source, centroidHexes[ci]) ?? Infinity;
        if (d < bestDist) {
          bestDist = d;
          nearestIdx = ci;
        }
      }

      // Lightness-relative remap
      const pixelOklch = safeOklch(source);
      const replacement = remapPixelOklch(
        pixelOklch,
        centroidOklchs[nearestIdx],
        targetOklchs[nearestIdx],
      );

      perPixelCache.set(key, replacement);
      imageData.data[index] = replacement[0];
      imageData.data[index + 1] = replacement[1];
      imageData.data[index + 2] = replacement[2];
    }

    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

/* ------------------------------------------------------------------ */
/*  SVG remapping (unchanged – SVGs don't have shadow artifacts)      */
/* ------------------------------------------------------------------ */

function updateStyle(style: string, assignments: SemanticAssignment[], tokens: ThemeTokens) {
  return style
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [property, value] = entry.split(":").map((part) => part.trim());
      if (!property || !value || !["fill", "stroke", "color"].includes(property)) {
        return entry;
      }
      if (value === "none" || value.startsWith("url(") || value === "transparent") {
        return entry;
      }
      const normalized = formatHex(value);
      if (!normalized) {
        return entry;
      }
      return `${property}: ${remapColor(normalized, assignments, tokens)}`;
    })
    .join("; ");
}

export async function remapSvg(svgText: string, assignments: SemanticAssignment[], tokens: ThemeTokens) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(svgText, "image/svg+xml");
  const elements = Array.from(documentNode.querySelectorAll("*"));

  elements.forEach((element) => {
    for (const property of ["fill", "stroke", "color"] as const) {
      const value = element.getAttribute(property);
      if (!value || value === "none" || value.startsWith("url(") || value === "transparent") {
        continue;
      }
      const normalized = formatHex(value);
      if (normalized) {
        element.setAttribute(property, remapColor(normalized, assignments, tokens));
      }
    }

    const style = element.getAttribute("style");
    if (style) {
      element.setAttribute("style", updateStyle(style, assignments, tokens));
    }
  });

  return new XMLSerializer().serializeToString(documentNode);
}
