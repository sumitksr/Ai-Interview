import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB, UserData } from "@/imports";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questions, answers, targetRole, experienceLevel, focus, resumeUrl } =
      await req.json();

    if (!questions || !answers || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions and answers are required" },
        { status: 400 }
      );
    }

    // Build the Q&A pairs for the prompt
    const qaPairs = questions.map((q, i) => ({
      question: q,
      answer: answers[i] || "(No answer provided)",
    }));

    const qaText = qaPairs
      .map(
        (qa, i) =>
          `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
      )
      .join("\n\n");

    const systemPrompt = `You are an expert senior technical interviewer and career coach with 15+ years of experience evaluating candidates for top tech companies. 
Your job is to analyze interview responses and provide detailed, constructive, and actionable feedback.
Always respond in valid JSON format only, with no markdown code blocks or extra text.`;

    const userPrompt = `You are evaluating a ${experienceLevel}-level candidate applying for a ${targetRole} position with a focus on ${focus}.

Here are their interview question and answer pairs:

${qaText}

Analyze each answer and provide a comprehensive assessment. Return a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "overallSummary": "<2-3 sentence overall assessment of the candidate>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
  "questionAnalysis": [
    {
      "question": "<the question>",
      "answer": "<the candidate's answer>",
      "score": <number 0-100>,
      "feedback": "<detailed specific feedback on this answer>",
      "mistake": "<key mistake or gap if any, or 'None' if the answer was strong>",
      "betterApproach": "<how they could have answered better>"
    }
  ],
  "hiringRecommendation": "<Strong Yes / Yes / Maybe / No>",
  "nextSteps": "<actionable advice for the candidate to improve>"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const rawAnalysis = completion.choices[0].message.content;
    const analysis = JSON.parse(rawAnalysis);

    // Save to database
    await connectDB();

    const questionsForDB = analysis.questionAnalysis.map((qa) => ({
      question: qa.question,
      answer: qa.answer,
      mistake: qa.mistake || "",
      feedback: qa.feedback || "",
    }));

    const userId = authUser.id;

    // Find or create UserData document
    let userData = await UserData.findOne({ user: userId });

    if (!userData) {
      userData = new UserData({ user: userId });
    }

    // Add new interview entry
    userData.interviewHistory.push({
      date: new Date(),
      score: analysis.overallScore,
      resume: resumeUrl || "",
      questions: questionsForDB,
    });

    // Recalculate stats
    userData.interviewsTaken = userData.interviewHistory.length;
    const totalScore = userData.interviewHistory.reduce(
      (sum, interview) => sum + (interview.score || 0),
      0
    );
    userData.averageScore = Math.round(
      totalScore / userData.interviewHistory.length
    );

    await userData.save();

    return NextResponse.json(
      {
        analysis,
        saved: true,
        message: "Interview analysis complete and saved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Interview Analysis Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
