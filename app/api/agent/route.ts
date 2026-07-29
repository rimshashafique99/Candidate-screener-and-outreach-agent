import { createDeepAgent } from "deepagents";
import { ChatAnthropic } from "@langchain/anthropic";
import { parseResume, scoreCandidate, saveToPipeline, submitResult } from "@/lib/tools";
import type { AIMessage, BaseMessage } from "@langchain/core/messages";

const recruitingAgent = createDeepAgent({
  model: new ChatAnthropic({
    model: "claude-haiku-4-5-20251001",
    temperature: 0,
  }),
  tools: [parseResume, scoreCandidate, saveToPipeline, submitResult],
  systemPrompt: `You are a recruiting screening assistant. Given a job description
and a candidate resume, you:

1. Call parse_resume to get deterministic signal on skills and years of experience,
   then refine that with your own reading of the full resume text.
2. Call score_candidate to get a keyword-overlap subscore, then combine it with your
   own judgment on seniority fit and career trajectory to produce a final 0-100 score.
   Express your reasoning as 7-8 specific bullet points — each one a specific, grounded
   observation referencing actual JD requirements or resume content. No generic praise,
   no restating the candidate's name, one clear point per bullet.
3. If the score is 60 or higher, write a short personalized outreach message
   (2-4 sentences) referencing specific matched skills. If below 60, leave
   outreachDraft null.
4. Call save_to_pipeline with the final fields.
5. Call submit_result exactly once, as your last action, with the complete
   finalized data (use the id returned from save_to_pipeline). This is required —
   the workflow is not complete until submit_result has been called.

Note career trajectory red flags neutrally, never dismissively. Be honest and
specific — this is a judgment tool, not a flattery generator.`,
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

  // Find the submit_result tool call anywhere in the run — not just the last message,
  // since the last message may just be a closing text summary after the tool call.
const submitCall = (result.messages as BaseMessage[])
  .flatMap((m) => (m as AIMessage).tool_calls ?? [])
  .find((tc) => tc.name === "submit_result");

  if (!submitCall) {
    console.error(
      "Agent finished without calling submit_result. Messages:",
      JSON.stringify(result.messages, null, 2)
    );
    return Response.json(
      { error: "Agent did not produce a structured result" },
      { status: 502 }
    );
  }

  // submitCall.args is already the Zod-validated object — safe to return directly.
  return Response.json(submitCall.args);
}