import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Tool 1: parseResume — real regex-based extraction, LLM refines the rest ---
export const parseResume = tool(
  async ({ resumeText }) => {
    // crude years-of-experience heuristic: look for patterns like "5+ years", "3 years"
    const yearsMatch = resumeText.match(/(\d+)\+?\s*(?:years|yrs)/i);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : null;

    // crude skill extraction: pull capitalized tech-sounding tokens and common skill words
    const skillCandidates = resumeText.match(
      /\b(React|Node\.?js|Next\.?js|TypeScript|JavaScript|Python|SQL|Postgres|AWS|Docker|Kubernetes|GraphQL|REST|Java|Go|Ruby|C\+\+|Vue|Angular|Tailwind|MongoDB|Redis|CI\/CD|Git)\b/gi
    );
    const skills = [...new Set((skillCandidates || []).map(s => s.trim()))];

    return JSON.stringify({
      yearsExperienceDetected: years,
      skillsDetected: skills,
      note: "These are heuristic extractions — the agent should still read the full resume text for context and nuance the LLM heuristics miss.",
    });
  },
  {
    name: "parse_resume",
    description:
      "Runs deterministic extraction on raw resume text: detects years-of-experience mentions and known technical skill keywords. Use this as a starting signal, then refine with your own reading of the resume.",
    schema: z.object({
      resumeText: z.string().describe("The raw resume text to parse"),
    }),
  }
);

// --- Tool 2: scoreCandidate — deterministic keyword overlap as a grounding signal ---
export const scoreCandidate = tool(
  async ({ candidateSkills, jobDescription }) => {
    const jdLower = jobDescription.toLowerCase();
    const matched = candidateSkills.filter(skill => jdLower.includes(skill.toLowerCase()));
    const overlapRatio = candidateSkills.length > 0 ? matched.length / candidateSkills.length : 0;
    const keywordSubscore = Math.round(overlapRatio * 100);

    return JSON.stringify({
      matchedSkills: matched,
      unmatchedSkills: candidateSkills.filter(s => !matched.includes(s)),
      keywordOverlapSubscore: keywordSubscore,
      note: "This is a mechanical keyword-overlap score only. Combine with your own judgment on seniority fit, trajectory, and relevance to produce the final 0-100 score and written reasoning.",
    });
  },
  {
    name: "score_candidate",
    description:
      "Computes a deterministic keyword-overlap subscore between candidate skills and the job description. This grounds your final score in something checkable — use it as one input alongside your own reasoning about seniority and trajectory fit.",
    schema: z.object({
      candidateSkills: z.array(z.string()),
      jobDescription: z.string(),
    }),
  }
);

// --- Tool 3: saveToPipeline — the one tool that MUST be a tool (real DB write) ---
export const saveToPipeline = tool(
  async ({ jdId, name, rawResume, parsedSkills, yearsExperience, score, reasoning, outreachDraft }) => {
    const { data, error } = await supabase
      .from("candidates")
      .insert({
        jd_id: jdId,
        name,
        raw_resume: rawResume,
        parsed_skills: parsedSkills,
        years_experience: yearsExperience,
        score,
        reasoning,
        outreach_draft: outreachDraft,
        status: "screened",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return JSON.stringify(data);
  },
  {
    name: "save_to_pipeline",
    description:
      "Saves a fully screened candidate — name, parsed skills, years of experience, score, reasoning, and outreach draft — into the Supabase pipeline table. Call this once you have all fields ready.",
    schema: z.object({
      jdId: z.string(),
      name: z.string(),
      rawResume: z.string(),
      parsedSkills: z.array(z.string()),
      yearsExperience: z.number().nullable(),
      score: z.number(),
      reasoning: z.string(),
      outreachDraft: z.string(),
    }),
  }
);