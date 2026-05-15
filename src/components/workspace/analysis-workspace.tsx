"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, WandSparkles } from "lucide-react";
import * as React from "react";

import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel";
import { ExportPanel } from "@/components/export/export-panel";
import { PaletteInspector } from "@/components/palette/palette-inspector";
import { BeforeAfterPreview } from "@/components/preview/before-after-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { CustomPaletteInput } from "@/components/workspace/custom-palette-input";
import { ThemePresetRail } from "@/components/workspace/theme-preset-rail";
import { scoreThemeAccessibility } from "@/lib/color/accessibility";
import { extractRasterPalette, extractSvgPalette } from "@/lib/color/extract";
import { remapRasterPreview, remapSvg } from "@/lib/color/remap";
import { inferSemanticRoles } from "@/lib/color/semantic";
import { generateThemeTokens } from "@/lib/color/themes";
import type {
  CustomPalette,
  GeneratedTheme,
  SourceKind,
  ThemeAnalysisResult,
  ThemePreset,
} from "@/lib/color/types";
import { buildGlobalCss } from "@/lib/export/css";
import { buildTailwindSnippet, buildThemeJson } from "@/lib/export/payloads";

const SAMPLE_DASHBOARD_SVG = `<svg width="1440" height="900" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1440" height="900" fill="#F5F7FB"/><rect x="32" y="32" width="1376" height="836" rx="36" fill="#FFFFFF"/><rect x="72" y="80" width="248" height="740" rx="28" fill="#0F172A"/><rect x="104" y="132" width="184" height="14" rx="7" fill="#E2E8F0"/><rect x="104" y="182" width="152" height="52" rx="18" fill="#14B8A6"/><rect x="104" y="258" width="152" height="52" rx="18" fill="#1E293B"/><rect x="104" y="334" width="152" height="52" rx="18" fill="#1E293B"/><rect x="360" y="80" width="1008" height="92" rx="28" fill="#F8FAFC"/><rect x="392" y="114" width="300" height="18" rx="9" fill="#0F172A"/><rect x="1170" y="108" width="166" height="36" rx="18" fill="#0F172A"/><rect x="1178" y="116" width="82" height="20" rx="10" fill="#F8FAFC"/><rect x="360" y="204" width="480" height="260" rx="30" fill="#F8FAFC"/><rect x="392" y="242" width="140" height="16" rx="8" fill="#334155"/><rect x="392" y="278" width="84" height="72" rx="20" fill="#14B8A6"/><rect x="496" y="290" width="152" height="14" rx="7" fill="#0F172A"/><rect x="496" y="318" width="208" height="12" rx="6" fill="#94A3B8"/><rect x="496" y="346" width="182" height="12" rx="6" fill="#CBD5E1"/><rect x="880" y="204" width="488" height="260" rx="30" fill="#F8FAFC"/><rect x="912" y="242" width="140" height="16" rx="8" fill="#334155"/><rect x="912" y="286" width="424" height="112" rx="24" fill="#0F172A"/><rect x="936" y="314" width="160" height="16" rx="8" fill="#F8FAFC"/><rect x="936" y="346" width="236" height="14" rx="7" fill="#CBD5E1"/><rect x="360" y="500" width="1008" height="320" rx="32" fill="#F8FAFC"/><rect x="392" y="542" width="212" height="16" rx="8" fill="#334155"/><rect x="392" y="590" width="944" height="56" rx="20" fill="#E2E8F0"/><rect x="392" y="670" width="944" height="56" rx="20" fill="#E2E8F0"/><rect x="1182" y="534" width="154" height="40" rx="20" fill="#8B5CF6"/><rect x="1204" y="548" width="100" height="12" rx="6" fill="#F8FAFC"/></svg>`;

type SourceState =
  | {
      kind: SourceKind;
      name: string;
      file?: File;
      originalUrl?: string;
      originalSvgText?: string;
    }
  | null;

async function createSamplePngFile() {
  const blob = new Blob([SAMPLE_DASHBOARD_SVG], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to prepare sample image."));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    context.drawImage(image, 0, 0);
    const blobResult = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blobResult) {
      throw new Error("Unable to build sample image.");
    }

    return new File([blobResult], "sample-dashboard.png", { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AnalysisWorkspace() {
  const [source, setSource] = React.useState<SourceState>(null);
  const [analysis, setAnalysis] = React.useState<ThemeAnalysisResult | null>(null);
  const [generatedTheme, setGeneratedTheme] = React.useState<GeneratedTheme | null>(null);
  const [activePreset, setActivePreset] = React.useState<ThemePreset>("dark");
  const [customPalette, setCustomPalette] = React.useState<CustomPalette | null>(null);
  const [mode, setMode] = React.useState<"split" | "original" | "remapped">("split");
  const [isBusy, setIsBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const applyPreset = React.useCallback(
    async (
      nextPreset: ThemePreset,
      analysisResult: ThemeAnalysisResult,
      currentSource: SourceState,
      palette?: CustomPalette | null,
    ) => {
      if (!currentSource) {
        return;
      }

      const tokens = generateThemeTokens(
        analysisResult.semanticAssignments,
        nextPreset,
        palette ?? undefined,
      );
      const accessibilityReport = scoreThemeAccessibility(
        tokens,
        analysisResult.semanticAssignments,
        analysisResult.originalAccessibilityScore,
      );

      const nextTheme: GeneratedTheme = {
        preset: nextPreset,
        tokens,
        accessibilityScore: accessibilityReport.score,
        improvementSummary: accessibilityReport.summary,
        accessibilityReport,
      };

      if (currentSource.kind === "svg" && currentSource.originalSvgText) {
        nextTheme.transformedSvgText = await remapSvg(
          currentSource.originalSvgText,
          analysisResult.semanticAssignments,
          tokens,
        );
      }

      if (currentSource.kind === "raster" && currentSource.file) {
        nextTheme.transformedPreviewUrl = await remapRasterPreview(
          currentSource.file,
          analysisResult.extractedColors,
          analysisResult.semanticAssignments,
          tokens,
        );
      }

      setGeneratedTheme(nextTheme);
    },
    [],
  );

  const handlePresetSelect = React.useCallback(
    async (nextPreset: ThemePreset) => {
      setActivePreset(nextPreset);
      if (!analysis || !source) {
        return;
      }
      setIsBusy(true);
      try {
        await applyPreset(nextPreset, analysis, source, nextPreset === "custom" ? customPalette : null);
      } finally {
        setIsBusy(false);
      }
    },
    [analysis, applyPreset, source, customPalette],
  );

  const handleCustomPaletteApply = React.useCallback(
    async (palette: CustomPalette) => {
      setCustomPalette(palette);
      setActivePreset("custom");
      if (!analysis || !source) {
        return;
      }
      setIsBusy(true);
      try {
        await applyPreset("custom", analysis, source, palette);
      } finally {
        setIsBusy(false);
      }
    },
    [analysis, applyPreset, source],
  );

  async function analyzeSource(nextSource: SourceState) {
    if (!nextSource) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const extractedColors =
        nextSource.kind === "svg" && nextSource.originalSvgText
          ? await extractSvgPalette(nextSource.originalSvgText)
          : nextSource.file
            ? await extractRasterPalette(nextSource.file)
            : [];

      const semanticAssignments = inferSemanticRoles(extractedColors);
      const originalTokens = generateThemeTokens(semanticAssignments, "modern-saas");
      const originalAccessibility = scoreThemeAccessibility(originalTokens, semanticAssignments);

      const nextAnalysis: ThemeAnalysisResult = {
        sourceKind: nextSource.kind,
        extractedColors,
        semanticAssignments,
        originalAccessibilityScore: originalAccessibility.score,
      };

      setAnalysis(nextAnalysis);
      await applyPreset(activePreset, nextAnalysis, nextSource);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Analysis failed.");
      setAnalysis(null);
      setGeneratedTheme(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFileSelect(file: File) {
    if (file.type === "invalid/type") {
      setError("Unsupported file type. Please upload PNG, JPG, WebP, or SVG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please keep uploads under 10 MB for smooth in-browser analysis.");
      return;
    }

    const nextSource: SourceState =
      file.type === "image/svg+xml"
        ? {
            kind: "svg",
            name: file.name,
            originalSvgText: await file.text(),
          }
        : {
            kind: "raster",
            name: file.name,
            file,
            originalUrl: URL.createObjectURL(file),
          };

    if (source?.originalUrl) {
      URL.revokeObjectURL(source.originalUrl);
    }

    setSource(nextSource);
    await analyzeSource(nextSource);
  }

  async function handleTrySample() {
    const sampleFile = await createSamplePngFile();
    await handleFileSelect(sampleFile);
  }

  React.useEffect(() => {
    return () => {
      if (source?.originalUrl) {
        URL.revokeObjectURL(source.originalUrl);
      }
    };
  }, [source]);

  const cssExport = generatedTheme ? buildGlobalCss(generatedTheme.tokens, generatedTheme.preset) : "";
  const jsonExport =
    generatedTheme && analysis ? buildThemeJson(analysis, generatedTheme, source?.name ?? "upload") : "";
  const tailwindExport =
    generatedTheme && analysis ? buildTailwindSnippet(generatedTheme, analysis.semanticAssignments) : "";

  function downloadGeneratedAsset() {
    if (!generatedTheme || !source) {
      return;
    }

    const sourceName = source.name.replace(/\.[^/.]+$/, "");

    if (generatedTheme.transformedSvgText) {
      const blob = new Blob([generatedTheme.transformedSvgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sourceName}-${generatedTheme.preset}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (generatedTheme.transformedPreviewUrl) {
      const link = document.createElement("a");
      link.href = generatedTheme.transformedPreviewUrl;
      link.download = `${sourceName}-${generatedTheme.preset}.png`;
      link.click();
    }
  }

  return (
    <section id="workspace" className="px-6 pb-20 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6">
        <UploadDropzone
          onFileSelect={(file) => void handleFileSelect(file)}
          onTrySample={() => void handleTrySample()}
          currentFileName={source?.name}
          error={error}
          isBusy={isBusy}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          <div className="space-y-6">
            <BeforeAfterPreview
              originalUrl={source?.originalUrl}
              transformedUrl={generatedTheme?.transformedPreviewUrl}
              originalSvg={source?.originalSvgText}
              transformedSvg={generatedTheme?.transformedSvgText}
              mode={mode}
              onModeChange={setMode}
              onDownload={generatedTheme ? downloadGeneratedAsset : undefined}
              downloadLabel={
                generatedTheme
                  ? generatedTheme.transformedSvgText
                    ? "Download SVG"
                    : "Download PNG"
                  : undefined
              }
            />

            <AnimatePresence mode="wait">
              {generatedTheme ? (
                <motion.div
                  key={generatedTheme.preset}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="grid gap-6 lg:grid-cols-2"
                >
                  <AccessibilityPanel report={generatedTheme.accessibilityReport} />
                  <ExportPanel
                    cssValue={cssExport}
                    jsonValue={jsonExport}
                    tailwindValue={tailwindExport}
                    theme={generatedTheme}
                    sourceName={(source?.name ?? "upload").replace(/\.[^/.]+$/, "")}
                  />
                </motion.div>
              ) : (
                <Card className="grid min-h-56 place-items-center p-8 text-center text-[var(--text-muted)]">
                  <div className="max-w-md">
                    <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--accent-strong)]">
                      {isBusy ? <LoaderCircle className="size-5 animate-spin" /> : <WandSparkles className="size-5" />}
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">Ready to remap</h3>
                    <p className="text-sm leading-6">
                      Upload a real product UI to extract palette structure, apply semantic theme presets, and export global.css tokens.
                    </p>
                  </div>
                </Card>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <ThemePresetRail activePreset={activePreset} onSelect={(preset) => void handlePresetSelect(preset)} />
            <CustomPaletteInput
              onApply={(palette) => void handleCustomPaletteApply(palette)}
              isActive={activePreset === "custom"}
            />
            {analysis ? (
              <PaletteInspector
                colors={analysis.extractedColors}
                assignments={analysis.semanticAssignments}
              />
            ) : (
              <Card className="p-5 text-sm leading-6 text-[var(--text-muted)]">
                Semantic roles and palette clusters will appear here after analysis.
              </Card>
            )}
            {/* <Card className="p-5">
              <div className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Why this feels intelligent</div>
              <ul className="space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                <li>Largest low-chroma regions are treated as backgrounds and surfaces.</li>
                <li>High-contrast small clusters are promoted into text and border candidates.</li>
                <li>High-chroma colors are preserved as accent roles across all presets.</li>
                <li>Accessibility mode repairs contrast instead of preserving broken source choices.</li>
              </ul>
              <div className="mt-4">
                <Button variant="ghost" className="px-0 text-[var(--accent-strong)]">
                  Deterministic, browser-side, and API-free
                </Button>
              </div>
            </Card> */}
          </div>
        </div>
      </div>
    </section>
  );
}
