import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB, UserData } from "@/imports";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetRole, experienceLevel, focus, questionCount = "5" } = await req.json();

    if (!targetRole) {
      return NextResponse.json({ error: "targetRole is required" }, { status: 400 });
    }

    await connectDB();

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const responseText = response.text.trim();
    let questions = [];

    try {
      questions = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", responseText);
      const match = responseText.match(/\[[\s\S]*?\]/);
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
