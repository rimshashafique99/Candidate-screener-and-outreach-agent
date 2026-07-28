import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function extractSkills(text: string) {
  const candidates = [
    "react",
    "typescript",
    "node",
    "graphql",
    "aws",
    "docker",
    "python",
  ];
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const s of candidates) if (lower.includes(s)) found.add(s);
  return Array.from(found).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export async function POST(req: Request) {
  try {
    const { jdId, jobDescription, resumeText } = await req.json();

    // Simple heuristic mock scoring
    const skills = extractSkills(resumeText + " " + jobDescription);
    const score = Math.min(
      100,
      Math.max(
        20,
        Math.round(skills.length * 25 + (resumeText.length > 1000 ? 10 : 0)),
      ),
    );
    const yearsExperience = resumeText.match(/\b(\d+)\+?\s+years?\b/i)?.[1]
      ? parseInt(resumeText.match(/\b(\d+)\+?\s+years?\b/i)![1], 10)
      : null;

    const result = {
      id: `cand_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      name:
        resumeText
          .split("\n")
          .find((l: string) => l.trim().length > 0)
          ?.slice(0, 60) || null,
      score,
      parsedSkills: skills,
      yearsExperience,
      reasoning: `Matched skills: ${skills.join(", ")}.`,
      outreachDraft:
        score >= 60
          ? `Hi — I liked your experience with ${skills.slice(0, 3).join(", ")}...`
          : null,
    } as const;

    // Save to candidates pipeline if table exists
    try {
      await supabase.from("candidates").insert({
        id: result.id,
        jd_id: jdId,
        name: result.name,
        score: result.score,
        status: score >= 60 ? "selected" : "rejected",
      });
    } catch (e) {
      console.warn("Could not save candidate to pipeline", e);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
