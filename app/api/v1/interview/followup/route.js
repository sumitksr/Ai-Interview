import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mainQuestion, answer, targetRole, experienceLevel, followUpHistory = [] } =
      await req.json();

    if (!mainQuestion || !answer) {
      return NextResponse.json(
        { error: "mainQuestion and answer are required" },
        { status: 400 }
      );
    }

    // Build the prior follow-up chain (if any)
    const historyText =
      followUpHistory.length > 0
        ? followUpHistory
            .map(
              (h, i) =>
                `Follow-up ${i + 1}: ${h.question}\nCandidate: ${h.answer}`
            )
            .join("\n\n")
        : "";

    const prompt = `You are a senior ${targetRole} interviewer evaluating a ${experienceLevel}-level candidate.

Original question: ${mainQuestion}
Candidate's answer: ${answer}
${historyText ? `\nPrior follow-ups in this thread:\n${historyText}` : ""}

Based on the candidate's answer${historyText ? " and the follow-up thread so far" : ""}, generate ONE sharp, specific follow-up question that:
- Probes deeper into a specific claim, gap, or interesting point in their answer
- Is not repetitive of any previous follow-up
- Cannot be answered with a simple yes/no
- Is concise (1–2 sentences max)

Return ONLY the follow-up question text, no preamble, no quotes.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical interviewer. Return only the follow-up question text — no extra text, no formatting.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const followUpQuestion = completion.choices[0].message.content.trim();

    return NextResponse.json({ followUpQuestion }, { status: 200 });
  } catch (error) {
    console.error("Follow-up API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
