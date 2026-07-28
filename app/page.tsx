"use client";

import { useState } from "react";
import { JDForm } from "@/components/jd-form";
import { ResumeForm } from "@/components/resume-form";
import { ResultsPanel } from "@/components/results-panel";
import { PipelineTable } from "@/components/pipeline-table";
import { ScreeningResult } from "@/types/screening";

export default function Home() {
  const [jdId, setJdId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [latestResult, setLatestResult] = useState<ScreeningResult | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  function handleJDSaved(id: string, jdText: string) {
    setJdId(id);
    setJobDescription(jdText);
  }

  function handleScreenResult(result: ScreeningResult) {
    setLatestResult(result);
    setRefreshKey((k) => k + 1); // triggers pipeline table refetch
  }

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-semibold">
        Candidate Screener &amp; Outreach Agent
      </h1>

      <JDForm onSaved={handleJDSaved} />

      {jdId && (
        <ResumeForm
          jdId={jdId}
          jobDescription={jobDescription}
          onResult={handleScreenResult}
        />
      )}

      {latestResult && <ResultsPanel result={latestResult} />}

      {jdId && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Pipeline</h2>
          <PipelineTable jdId={jdId} refreshKey={refreshKey} />
        </div>
      )}
    </main>
  );
}
