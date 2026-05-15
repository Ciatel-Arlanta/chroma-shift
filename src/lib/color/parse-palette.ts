"use client";

import { formatHex, parse } from "culori";

/**
 * Parses pasted palette text from any format (CSV, hex list, JSON array,
 * JSON object, extended array, XML, space-separated, etc.) and returns
 * an array of normalised hex strings.
 *
 * Supported formats (all from coolors.co and similar tools):
 *  - CSV:              f9e7e7,ded6d6,d2cbcb,ada0a6,7d938a
 *  - With #:           #f9e7e7, #ded6d6, #d2cbcb, #ada0a6, #7d938a
 *  - JSON Array:       ["f9e7e7","ded6d6",...]
 *  - JSON Object:      {"Name":"f9e7e7",...}
 *  - Extended Array:   [{"hex":"f9e7e7",...},...]
 *  - XML:              <color hex="f9e7e7" />
 *  - URL:              coolors.co/f9e7e7-ded6d6-d2cbcb
 */

const HEX_PATTERN = /(?:#?)([0-9a-f]{3,8})\b/gi;

function isValidHex(hex: string): boolean {
  const normalised = hex.startsWith("#") ? hex : `#${hex}`;
  return formatHex(normalised) !== undefined;
}

function normalise(raw: string): string {
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  return formatHex(hex) ?? hex.toLowerCase();
}

function dedupe(colors: string[]): string[] {
  const seen = new Set<string>();
  return colors.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Strategy: try structured formats first, fall back to regex scrape */
/* ------------------------------------------------------------------ */

function tryJson(text: string): string[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed);

    // JSON array of strings: ["f9e7e7", ...]
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed
        .map((s: string) => s.trim())
        .filter((s: string) => /^#?[0-9a-f]{3,8}$/i.test(s))
        .map(normalise);
    }

    // Extended array: [{"hex":"f9e7e7",...}, ...]
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && parsed[0].hex) {
      return parsed
        .map((item: { hex?: string }) => item.hex ?? "")
        .filter((s: string) => /^#?[0-9a-f]{3,8}$/i.test(s))
        .map(normalise);
    }

    // JSON object: {"Name":"f9e7e7",...}
    if (!Array.isArray(parsed) && typeof parsed === "object") {
      const values = Object.values(parsed) as string[];
      const hexValues = values
        .filter((s) => typeof s === "string" && /^#?[0-9a-f]{3,8}$/i.test(s.trim()))
        .map((s) => normalise(s.trim()));
      if (hexValues.length >= 2) return hexValues;
    }
  } catch {
    // not valid JSON — fall through
  }

  return null;
}

function tryXml(text: string): string[] | null {
  if (!text.includes("<color") && !text.includes("<palette")) return null;

  const matches: string[] = [];
  const attrPattern = /hex\s*=\s*"([0-9a-fA-F]{3,8})"/gi;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(text)) !== null) {
    matches.push(normalise(match[1]));
  }

  return matches.length >= 2 ? matches : null;
}

function tryCoolorsUrl(text: string): string[] | null {
  const trimmed = text.trim();
  // coolors.co/f9e7e7-ded6d6-d2cbcb-ada0a6-7d938a
  const urlMatch = trimmed.match(/coolors\.co\/([0-9a-f]{6}(?:-[0-9a-f]{6})+)/i);
  if (urlMatch) {
    return urlMatch[1].split("-").map(normalise);
  }
  // Also match raw dash-separated hex (6-char blocks only)
  const dashMatch = trimmed.match(/^([0-9a-f]{6})(-[0-9a-f]{6}){2,}$/i);
  if (dashMatch) {
    return trimmed.split("-").map(normalise);
  }
  return null;
}

function regexScrape(text: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = HEX_PATTERN.exec(text)) !== null) {
    const candidate = match[1];
    if (candidate.length === 3 || candidate.length === 6 || candidate.length === 8) {
      const hex = normalise(candidate);
      if (isValidHex(candidate)) {
        matches.push(hex);
      }
    }
  }
  return matches;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface ParsedPalette {
  colors: string[]; // normalised hex strings
  format: string;   // detected format label for UI feedback
}

export function parsePaletteInput(text: string): ParsedPalette | null {
  if (!text || text.trim().length < 3) return null;

  // Try structured formats first
  const jsonResult = tryJson(text);
  if (jsonResult && jsonResult.length >= 2) {
    return { colors: dedupe(jsonResult), format: "JSON" };
  }

  const xmlResult = tryXml(text);
  if (xmlResult && xmlResult.length >= 2) {
    return { colors: dedupe(xmlResult), format: "XML" };
  }

  const urlResult = tryCoolorsUrl(text);
  if (urlResult && urlResult.length >= 2) {
    return { colors: dedupe(urlResult), format: "URL" };
  }

  // Fall back to regex scrape (handles CSV, hex-with-#, space-separated, etc.)
  const scraped = regexScrape(text);
  if (scraped.length >= 2) {
    return { colors: dedupe(scraped), format: "Hex" };
  }

  return null;
}
