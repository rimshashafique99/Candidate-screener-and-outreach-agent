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
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{c.name || "Unknown"}</TableCell>
            <TableCell>{c.score}</TableCell>
            <TableCell>
              <Badge variant="outline">{c.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
