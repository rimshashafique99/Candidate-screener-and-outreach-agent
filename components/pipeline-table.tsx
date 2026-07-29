"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";

function tierClass(score: number) {
  if (score >= 75) return "tier-high";
  if (score >= 50) return "tier-mid";
  return "tier-low";
}

function MiniRing({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return (
      <div className="h-6 w-6 shrink-0 rounded-full border border-dashed border-[hsl(var(--border))]" />
    );
  }

  const tier = tierClass(score);
  return (
    <div
      className={`${tier} relative h-6 w-6 shrink-0 rounded-full`}
      style={{
        background: `conic-gradient(var(--ring-color) ${score}%, var(--ring-bg) 0)`,
      }}
    >
      <div className="absolute inset-0.5 rounded-full bg-white" />
    </div>
  );
}

export function PipelineTable({
  jdId,
  refreshKey,
}: {
  jdId: string;
  refreshKey: number;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchCandidates() {
      setLoading(true);
      const { data, error } = await supabaseBrowser
        .from("candidates")
        .select("*")
        .eq("jd_id", jdId)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) console.error(error);
        setCandidates((data as Candidate[]) || []);
        setLoading(false);
      }
    }
    fetchCandidates();
    return () => {
      cancelled = true;
    };
  }, [jdId, refreshKey]);

  if (loading)
    return <p className="text-sm text-muted-foreground">Loading pipeline...</p>;

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No candidates screened yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-[hsl(var(--border))]">
          <TableHead className="font-display text-xs uppercase tracking-wide">
            Candidate
          </TableHead>
          <TableHead className="font-display text-xs uppercase tracking-wide">
            Score
          </TableHead>
          <TableHead className="font-display text-xs uppercase tracking-wide">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((c) => (
          <TableRow key={c.id} className="border-[hsl(var(--border))]">
            <TableCell>{c.name || "Unknown"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <MiniRing score={c.score} />
                <span className="font-mono text-sm">{c.score}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-[11px]">
                {c.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
