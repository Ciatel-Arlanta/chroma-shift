"use client";

import { differenceEuclidean, formatHex } from "culori";
import chroma from "chroma-js";

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

const compare = differenceEuclidean("lab");

function pickRole(hex: string, assignments: SemanticAssignment[]) {
  let bestRole: SemanticRole = "background";
  let bestDistance = Number.POSITIVE_INFINITY;

  assignments.forEach((assignment) => {
    const distance = compare(hex, assignment.color);
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
    const mapping = new Map<string, [number, number, number]>();
    const perPixelCache = new Map<number, [number, number, number]>();

    extractedColors.forEach((color) => {
      mapping.set(color.hex, chroma(remapColor(color.hex, assignments, tokens)).rgb() as [number, number, number]);
    });

    for (let index = 0; index < imageData.data.length; index += 4) {
      const alpha = imageData.data[index + 3];
      if (alpha < 16) {
        continue;
      }

      const red = imageData.data[index];
      const green = imageData.data[index + 1];
      const blue = imageData.data[index + 2];
      const key = packRgb(red, green, blue);
      const cachedReplacement = perPixelCache.get(key);

      if (cachedReplacement) {
        imageData.data[index] = cachedReplacement[0];
        imageData.data[index + 1] = cachedReplacement[1];
        imageData.data[index + 2] = cachedReplacement[2];
        continue;
      }

      const source = chroma(red, green, blue).hex();
      let nearest = extractedColors[0]?.hex ?? source;
      let distance = Number.POSITIVE_INFINITY;

      extractedColors.forEach((color) => {
        const current = compare(source, color.hex);
        if (current < distance) {
          distance = current;
          nearest = color.hex;
        }
      });

      const replacement = mapping.get(nearest);
      if (!replacement) {
        continue;
      }

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
