"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JDForm({
  onSaved,
}: {
  onSaved: (jdId: string, jdText: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim() || !description.trim()) return;
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
        console.error("/api/jd returned error status:", res.status, text);
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("/api/jd returned non-JSON response:", text);
        throw new Error("Expected JSON response from /api/jd");
      }
      const data = await res.json();
      setSavedId(data.id);
      onSaved(data.id, description);
    } catch (err) {
      console.error(err);
      alert("Couldn't save the job description. Check the console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job description</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jd-title">Role title</Label>
          <Input
            id="jd-title"
            placeholder="e.g. Senior Frontend Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!!savedId}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jd-desc">Full description</Label>
          <Textarea
            id="jd-desc"
            placeholder="Paste the job description here..."
            className="min-h-40"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!!savedId}
          />
        </div>
        {savedId ? (
          <p className="text-sm text-muted-foreground">
            Saved. You can screen candidates against this role below.
          </p>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save job description"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
