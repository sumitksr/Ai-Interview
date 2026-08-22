import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB, UserData } from "@/imports";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // ── Email verification gate ───────────────────────────────────────────────
    const { User } = await import("@/imports");
    const interviewUser = await User.findById(authUser.id).select("isVerified");
    if (!interviewUser?.isVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email before starting an interview.",
          emailNotVerified: true,
        },
        { status: 403 }
      );
    }

    const { targetRole, experienceLevel, focus, questionCount = "5" } = await req.json();

    if (!targetRole) {
      return NextResponse.json({ error: "targetRole is required" }, { status: 400 });
    }


    // Fetch the user's last interview that has a stored resume text
    const userData = await UserData.findOne({ user: authUser.id }).select("interviewHistory");

    if (!userData || !userData.interviewHistory || userData.interviewHistory.length === 0) {
      return NextResponse.json({ error: "No previous interview data found." }, { status: 404 });
    }

    // Find the most recent interview entry that has resumeText saved
    let previousResumeText = "";
    let previousResumeUrl = "";

    for (let i = userData.interviewHistory.length - 1; i >= 0; i--) {
      const entry = userData.interviewHistory[i];
      if (entry.resumeText && entry.resumeText.trim().length > 0) {
        previousResumeText = entry.resumeText;
        previousResumeUrl = entry.resume || "";
        break;
      }
    }

    if (!previousResumeText) {
      return NextResponse.json(
        { error: "No parsed resume text found in previous sessions. Please upload your resume again." },
        { status: 404 }
      );
    }

    // Generate fresh questions using the stored resume text
    const prompt = `
      You are an expert technical interviewer. Based on the following candidate context and resume, generate ${questionCount} highly tailored interview questions.
      
      Target Role: ${targetRole}
      Experience Level: ${experienceLevel}
      Focus Area: ${focus}
      
      Resume Content:
      ${previousResumeText.substring(0, 5000)}
      
      Provide the response STRICTLY as a JSON array of strings, where each string is an interview question. Do not include markdown formatting like \`\`\`json or \`\`\`.
      Example:
      [
        "Can you explain how you designed the XYZ system mentioned in your resume?",
        "What was your most challenging project?"
      ]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer. Respond ONLY with a valid JSON array of interview question strings — no markdown, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    // OpenAI json_object mode returns an object — extract the array
    const rawText = completion.choices[0].message.content.trim();
    let questions = [];

    try {
      const parsed = JSON.parse(rawText);
      questions = Array.isArray(parsed) ? parsed : (parsed.questions || Object.values(parsed)[0] || []);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", rawText);
      const match = rawText.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          questions = JSON.parse(match[0]);
        } catch (e2) {
          return NextResponse.json(
            { error: "Failed to parse questions from AI response." },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Failed to parse questions from AI response." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        questions,
        resumeUrl: previousResumeUrl,
        message: "Questions generated from your previous resume.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Use-Previous Resume API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
