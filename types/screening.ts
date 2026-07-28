export interface ScreeningResult {
  name?: string | null;
  score: number;
  parsedSkills?: string[] | null;
  yearsExperience?: number | null;
  reasoning?: string | null;
  outreachDraft?: string | null;
}
