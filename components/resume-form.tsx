"use client";

import { useState } from "react";
import { ScreeningResult } from "@/types/screening";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResumeForm({
  jdId,
  jobDescription,
  onResult,
}: {
  jdId: string;
  jobDescription: string;
  onResult: (result: ScreeningResult) => void;
}) {
  const [resumeText, setResumeText] = useState("");
  const [screening, setScreening] = useState(false);

  async function handleScreen() {
    if (!resumeText.trim()) return;
    setScreening(true);
    try {
      const res = await fetch("/api/agent-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdId, jobDescription, resumeText }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        console.error(
          "/api/agent-mock returned error status:",
          res.status,
          text,
        );
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("/api/agent-mock returned non-JSON response:", text);
        throw new Error("Expected JSON response from /api/agent-mock");
      }
      const data = await res.json();
      onResult(data);
      setResumeText("");
    } catch (err) {
      console.error(err);
      alert(
        "Something went wrong screening this candidate. Check the console.",
      );
    } finally {
      setScreening(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screen a candidate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste the candidate's resume text here..."
          className="min-h-[200px]"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        />
        <Button onClick={handleScreen} disabled={screening}>
          {screening ? "Screening..." : "Screen candidate"}
        </Button>
      </CardContent>
    </Card>
  );
}
