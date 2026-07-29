export interface ScreeningResult {
  id: string;
  name: string | null;
  score: number;
  parsedSkills: string[];
  yearsExperience: number | null;
  reasoning: string[];
  outreachDraft: string | null;
}