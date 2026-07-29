"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function JDForm({
  onSaved,
}: {
  onSaved: (jdId: string, jdText: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);

    if (!title.trim() && !description.trim()) {
      setError("Add a role title and the job description before saving.");
      return;
    }
    if (!title.trim()) {
      setError("Role title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Paste the full job description before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      if (!contentType.includes("application/json")) {
        throw new Error("Expected JSON response from /api/jd");
      }
      const data = await res.json();
      setSavedId(data.id);
      onSaved(data.id, description);
    } catch (err) {
      console.error(err);
      setError("Couldn't save the job description. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border border-[#E4E0D6] shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="font-display text-lg font-medium">
          Job description
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="jd-title">Role title</Label>
          <Input
            id="jd-title"
            placeholder="e.g. Senior Frontend Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!!savedId}
            className="border-[#E4E0D6]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jd-desc">Full description</Label>
          <Textarea
            id="jd-desc"
            placeholder="Paste the job description here..."
            className="min-h-40 border-[#E4E0D6]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!!savedId}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-[#FBEAE6] px-3 py-2 text-sm text-[#A3402F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedId ? (
          <div className="flex items-center gap-2 rounded-md bg-[#E4F1E9] px-3 py-2 text-sm text-[#2F6B4F]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Saved. You can screen candidates against this role below.</span>
          </div>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#2F5D50] text-white hover:bg-[#264c41] px-5 py-2 rounded-md font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save job description"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}