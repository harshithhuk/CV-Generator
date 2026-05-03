export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { jobDescription, skills, experience, tone, yourName, targetCompany } = req.body;

  if (!jobDescription || !skills) {
    return res.status(400).json({ error: "Job description and skills are required." });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured. Add ANTHROPIC_API_KEY in Vercel Environment Variables." });
  }

  const prompt = `You are an expert career coach and professional writer specialising in tailored cover letters that pass ATS systems and impress hiring managers.

Write a compelling, personalised cover letter based on the information below.

CANDIDATE NAME: ${yourName || "the candidate"}
TARGET COMPANY: ${targetCompany || "the company"}
TONE: ${tone || "Professional yet personable"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE SKILLS & EXPERIENCE:
${skills}

ADDITIONAL EXPERIENCE/CONTEXT:
${experience || "Not provided"}

REQUIREMENTS:
- Start with a strong, attention-grabbing opening (NOT "I am writing to apply for...")
- Mirror keywords and phrases directly from the job description naturally
- Highlight 2-3 specific, quantifiable achievements that match the role
- Show genuine enthusiasm for the company and role specifically
- End with a confident, action-oriented closing
- Keep it to 3-4 paragraphs, under 400 words
- Make it sound human, warm and authentic — not robotic
- Use the tone specified: ${tone || "Professional yet personable"}

Return ONLY the cover letter text. No subject line, no date, no address headers. Just the letter body starting from the greeting.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const letter = data.content?.[0]?.text || "";

    return res.status(200).json({ letter });
  } catch (err) {
    return res.status(500).json({ error: "Generation failed: " + err.message });
  }
}
