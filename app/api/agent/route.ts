import { createDeepAgent } from "deepagents";
import { ChatAnthropic } from "@langchain/anthropic";
import { parseResume, scoreCandidate, saveToPipeline } from "@/lib/tools";

const recruitingAgent = createDeepAgent({
  model: new ChatAnthropic({
    model: "claude-haiku-4-5-20251001",
    temperature: 0,
  }),
  tools: [parseResume, scoreCandidate, saveToPipeline],
  systemPrompt: `You are a recruiting screening assistant. Given a job description
and a candidate resume, you:

1. Call parse_resume to get deterministic signal on skills and years of experience,
   then refine that with your own reading of the full resume text (names, roles,
   nuance the regex misses).
2. Call score_candidate to get a keyword-overlap subscore, then combine it with your
   own judgment on seniority fit and career trajectory to produce a final 0-100 score
   and specific, grounded written reasoning — reference actual JD requirements and
   actual resume content, not generic praise.
3. If the score is 60 or higher, write a short, personalized outreach message (2-4
   sentences) that references specific matched skills. If below 60, note this in
   the reasoning but still write a brief, honest note on why (skip outreach).
4. Call save_to_pipeline with all final fields once you're done.

Note career trajectory red flags (unexplained gaps, frequent short stints) neutrally,
never dismissively. Be honest and specific — this is a judgment tool, not a flattery
generator.`,
});

export async function POST(req: Request) {
  const { jdId, jobDescription, resumeText } = await req.json();

  const result = await recruitingAgent.invoke({
    messages: [
      {
        role: "user",
        content: `Job description:\n${jobDescription}\n\nCandidate resume:\n${resumeText}\n\nJD ID for saving: ${jdId}`,
      },
    ],
  });

  return Response.json({ result: result.messages.at(-1)?.content });
}