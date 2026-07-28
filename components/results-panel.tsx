import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScreeningResult } from "@/types/screening";

export function ResultsPanel({ result }: { result: ScreeningResult | null }) {
  if (!result) return null;

  const scoreColor =
    result.score >= 75
      ? "bg-green-100 text-green-800"
      : result.score >= 50
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{result.name || "Candidate"}</CardTitle>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${scoreColor}`}
        >
          {result.score}/100
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Skills detected</p>
          <div className="flex flex-wrap gap-1">
            {(result.parsedSkills || []).map((skill: string) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {result.yearsExperience != null && (
          <p className="text-sm">
            <span className="font-medium">Years of experience: </span>
            {result.yearsExperience}
          </p>
        )}

        <Separator />

        <div>
          <p className="text-sm font-medium mb-1">Reasoning</p>
          <p className="text-sm text-muted-foreground">{result.reasoning}</p>
        </div>

        {result.outreachDraft && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-1">Outreach draft</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {result.outreachDraft}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
