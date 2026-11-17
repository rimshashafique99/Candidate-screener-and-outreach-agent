# Candidate Screener & Outreach Agent

A focused AI agent that helps a recruiter screen a candidate resume against a job description, get a scored and reasoned fit assessment, and generate a personalized outreach draft all in one workflow, backed by a real pipeline table.

Built for the Z360 Deep Agent Harness take-home challenge.

**Live demo:** https://candidate-screener-and-outreach-agent.vercel.app/


---

## The problem

Recruiters spend a lot of manual time reading resumes against a job description, deciding whether a candidate is worth a conversation, and then writing a first outreach message that doesn't read like a generic template. This agent narrows that down to one workflow and does it properly: paste a JD once, paste a resume, and get a structured, grounded screening decision plus a ready-to-send outreach draft with everything saved to a lightweight pipeline so it behaves like a real tool instead of a one-off chat exchange.

## What it does

1. **Enter a job description** once (title + description).
2. **Paste or upload a candidate resume.**
3. The agent:
   - Parses the resume into structured data (skills, years of experience, past roles).
   - Scores the candidate's fit against the JD (0–100) with specific, grounded reasoning not generic praise.
   - Notes gaps or red flags (e.g. unexplained gaps, short stints) neutrally, without disqualifying.
   - For strong matches, drafts a short, personalized outreach message referencing the candidate's actual matched skills.
   - Saves the candidate (score, reasoning, outreach draft, status) to the pipeline.
4. **Pipeline table** underneath shows every screened candidate — name, score, status read live from Supabase.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, Tailwind CSS, shadcn/ui — deployed on Vercel |
| Backend / DB | Supabase (Postgres) |
| Agent harness | `deepagents` (TypeScript, built on LangGraph.js) |
| LLM | Anthropic API — Claude Haiku |

### Why TypeScript `deepagents` instead of Python

The Python `deepagents` package is the more established version, but the TypeScript port exposes the same `createDeepAgent()` API shape and is actively maintained. Using it keeps the entire product frontend, API route, and agent in a single Next.js app with a single Vercel deployment, instead of standing up a separate Python agent server. The tradeoff is a smaller ecosystem/community around the TS package, not reduced capability.

## Agent design (the harness)

**Domain knowledge (system prompt):**
- Skills overlap between JD requirements and candidate experience
- Seniority / years-of-experience fit judged by relevance, not just a number
- Career trajectory flags (gaps, short stints) noted neutrally, never disqualifying on their own
- Reasoning must cite specifics from the actual JD and resume, not generic praise

**Custom tools (4):**

| Tool | Purpose |
|---|---|
| `parse_resume` | Extracts structured candidate data — skills, years of experience, past roles from raw resume text |
| `score_candidate` | Scores fit (0–100) against the JD with written reasoning |
| `draft_outreach` | Generates a personalized outreach message referencing specific matched skills |
| `save_to_pipeline` | Persists the candidate record (score, reasoning, outreach draft, status) to Supabase |

The tool calling loop enforces structure and persistence; the agent's own reasoning does the actual judgment work (parsing, scoring rationale, message drafting).

## Database schema

```sql
create table job_descriptions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  created_at timestamp with time zone default now()
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  jd_id uuid references job_descriptions(id),
  name text,
  raw_resume text not null,
  parsed_skills jsonb,
  years_experience numeric,
  score numeric,
  reasoning text,
  outreach_draft text,
  status text default 'new', -- new | screened | contacted
  created_at timestamp with time zone default now()
);
```

## Running locally

```bash
git clone <this-repo-url>
cd <repo>
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Run the Supabase schema above in the SQL editor of your Supabase project, then:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment

Deployed on Vercel. Environment variables (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are set in the Vercel project settings, matching `.env.local`.

## Known limitations / scope cuts

Kept intentionally out of scope for a weekend build:
- No authentication or multi-tenant support (single-user, demo-grade)
- Single-resume flow only, no bulk upload
- No editable/regenerable outreach drafts after the fact
- No drag-and-drop pipeline stage changes (status is set programmatically)


