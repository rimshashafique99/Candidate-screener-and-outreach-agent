import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScreeningResult } from "@/types/screening";

function tierClass(score: number) {
  if (score >= 75) return "tier-high";
  if (score >= 50) return "tier-mid";
  return "tier-low";
}

function ScoreRing({ score }: { score: number }) {
  const tier = tierClass(score);
  return (
    <div
      className={`${tier} relative h-16 w-16 shrink-0 rounded-full`}
      style={{
        background: `conic-gradient(var(--ring-color) ${score}%, var(--ring-bg) 0)`,
      }}
    >
      <div className="absolute inset-0.75 flex items-center justify-center rounded-full bg-white">
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: "var(--ring-color)" }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

export function ResultsPanel({ result }: { result: ScreeningResult | null }) {
  if (!result) return null;

  return (
    <Card className="border-[hsl(var(--border))]">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <ScoreRing score={result.score} />
        <div>
          <CardTitle className="font-display text-xl font-medium">
            {result.name || "Candidate"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {result.yearsExperience != null
              ? `${result.yearsExperience} yr${result.yearsExperience === 1 ? "" : "s"} experience`
              : "Experience not specified"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-md font-medium uppercase tracking-wide text-muted-foreground">
            Skills detected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(result.parsedSkills || []).map((skill: string) => (
              <Badge
                key={skill}
                variant="secondary"
                className="rounded-full border border-[#E4E0D6] bg-white px-3 py-2 font-mono text-[14px] font-normal"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-md font-medium uppercase tracking-wide text-muted-foreground">
            Reasoning
          </p>
          <ul className="space-y-1.5">
            {result.reasoning.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {result.outreachDraft && (
          <>
            <Separator />
            <div>
              <p className="mb-2 text-md font-medium uppercase tracking-wide text-muted-foreground">
                Outreach draft
              </p>
              <p className="whitespace-pre-wrap rounded-md bg-[hsl(var(--primary)/0.06)] p-3 text-sm text-foreground/90">
                {result.outreachDraft}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
