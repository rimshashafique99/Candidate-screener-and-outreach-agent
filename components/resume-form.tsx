"use client";

import { useRef, useState } from "react";
import { ScreeningResult } from "@/types/screening";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";

import type {
  TextItem,
  TextMarkedContent,
} from "pdfjs-dist/types/src/display/api";

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return "str" in item;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter(isTextItem)
      .map((item) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  return fullText.trim();
}

export function ResumeForm({
  jdId,
  jobDescription,
  onResult,
}: {
  jdId: string;
  jobDescription: string;
  onResult: (result: ScreeningResult) => void;
}) {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [resumeText, setResumeText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [screening, setScreening] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Single source of truth for handling a File, whether it came from
  // click-to-browse or drag-and-drop — no `any` cast needed either way.
  async function processFile(file: File) {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setFileName(file.name);
    setExtracting(true);
    try {
      const text = await extractTextFromPDF(file);
      if (!text) {
        alert(
          "Couldn't find any text in that PDF — it may be a scanned image. Try pasting the text instead.",
        );
      }
      setResumeText(text);
    } catch (err) {
      console.error(err);
      alert(
        "Failed to extract text from that PDF. Try pasting the text instead.",
      );
    } finally {
      setExtracting(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleScreen() {
    setError(null);
    if (!resumeText.trim()) {
      setError(
        "Add a candidate resume — paste text or upload a PDF — before screening.",
      );
      return;
    }
    setScreening(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdId, jobDescription, resumeText }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      onResult(data);
      setResumeText("");
      setFileName(null);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong screening this candidate. Please try again.",
      );
    } finally {
      setScreening(false);
    }
  }
  return (
    <Card className="border border-[#E4E0D6] shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="font-display text-lg font-medium">
          Screen a candidate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle — just switches the view below, nothing else */}
        <div className="inline-flex rounded-full border border-[#E4E0D6] p-1 bg-[#FBFAF8]">
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              mode === "paste"
                ? "bg-[#2F5D50] text-white"
                : "text-[#656B76] hover:text-[#1B1E23]"
            }`}
          >
            Paste text
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              mode === "upload"
                ? "bg-[#2F5D50] text-white"
                : "text-[#656B76] hover:text-[#1B1E23]"
            }`}
          >
            Upload PDF
          </button>
        </div>

        {mode === "paste" ? (
          <Textarea
            placeholder="Paste the candidate's resume text here..."
            className="min-h-[200px]"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        ) : (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                flex flex-col items-center justify-center gap-2
                rounded-lg border-2 border-dashed
                px-6 py-10 text-center cursor-pointer
                transition-colors
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {extracting ? (
                <>
                  <UploadCloud className="h-8 w-8 text-muted-foreground animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    Extracting text from PDF...
                  </p>
                </>
              ) : fileName ? (
                <>
                  <FileText className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {resumeText.length} characters extracted — click to replace
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload file</p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop a PDF here, or click to browse
                  </p>
                </>
              )}
            </div>

            {fileName && !extracting && (
              <button
                type="button"
                onClick={() => {
                  setResumeText("");
                  setFileName(null);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear file
              </button>
            )}

            {resumeText && !extracting && (
              <Textarea
                className="min-h-[160px]"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-[#FBEAE6] px-3 py-2 text-sm text-[#A3402F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleScreen}
          disabled={screening || extracting}
          className="bg-[#2F5D50] text-white hover:bg-[#264c41] px-5 py-2 rounded-md font-medium disabled:opacity-60"
        >
          {screening ? "Screening..." : "Screen candidate"}
        </Button>
      </CardContent>
    </Card>
  );
}
