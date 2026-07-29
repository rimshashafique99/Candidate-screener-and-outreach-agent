import "dotenv/config";
import { parseResume, scoreCandidate } from "../lib/tools.ts";

const resume = "Jane Doe. 5+ years of experience. Skills: React, Node.js, PostgreSQL, AWS.";
const jd = "Looking for a React and Node.js engineer with AWS experience.";

const parsed = await parseResume.invoke({ resumeText: resume });
console.log("Parsed:", parsed);

const scored = await scoreCandidate.invoke({
  candidateSkills: JSON.parse(parsed).skillsDetected,
  jobDescription: jd,
});
console.log("Scored:", scored);

const weakResume = "John Smith. 2 years of experience. Skills: Python, Django, PostgreSQL.";
const parsed2 = await parseResume.invoke({ resumeText: weakResume });
console.log("Parsed (weak):", parsed2);

const scored2 = await scoreCandidate.invoke({
  candidateSkills: JSON.parse(parsed2).skillsDetected,
  jobDescription: jd, // same React/Node/AWS JD
});
console.log("Scored (weak):", scored2);