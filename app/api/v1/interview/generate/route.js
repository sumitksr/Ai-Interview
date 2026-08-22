import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB, UserData, cloudinary } from "@/imports";
import OpenAI from "openai";
import { Readable } from "stream";

const PDFParser = require("pdf2json");

function parsePdfBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
    });
    pdfParser.parseBuffer(buffer);
  });
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Email verification gate ───────────────────────────────────────────────
    await connectDB();
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

    const formData = await req.formData();
    const targetRole = formData.get("targetRole");
    const experienceLevel = formData.get("experienceLevel");
    const focus = formData.get("focus");
    const resumeText = formData.get("resumeText");
    const resumeFile = formData.get("resumeFile");

    let finalResumeText = resumeText || "";
    let resumeUrl = null;

    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());

      // Parse PDF
      try {
        finalResumeText = await parsePdfBuffer(buffer);
      } catch (parseError) {
        console.error("PDF Parsing Error:", parseError);
        return NextResponse.json({ error: "Failed to parse PDF file." }, { status: 400 });
      }

      // Upload to Cloudinary
      try {
        const originalName = resumeFile.name ? resumeFile.name.replace(/\.[^/.]+$/, "") : "resume";
        const publicId = `${originalName}_${Date.now()}`;

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              folder: "ai interview platform", 
              resource_type: "image",
              format: "pdf",
              public_id: publicId
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          Readable.from(buffer).pipe(uploadStream);
        });
        resumeUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        // Continue even if upload fails, we have the text
      }
    }

    if (!finalResumeText.trim()) {
      return NextResponse.json({ error: "No resume content provided." }, { status: 400 });
    }

    const questionCount = formData.get("questionCount") || "5";

    // Generate Questions with OpenAI
    const prompt = `
      You are an expert technical interviewer. Based on the following candidate context and resume, generate ${questionCount} highly tailored interview questions.
      
      Target Role: ${targetRole}
      Experience Level: ${experienceLevel}
      Focus Area: ${focus}
      
      Resume Content:
      ${finalResumeText.substring(0, 5000)} 
      Provide the response STRICTLY as a JSON array of strings, where each string is an interview question. Do not include markdown formatting like \`\`\`json or \`\`\`.
      Example:
      [
        "Can you explain how you designed the XYZ system mentioned in your resume?",
        "What was your most challenging project?"
      ]
    `;
    // Truncating to avoid token limits if too long
      

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

    // OpenAI json_object mode returns an object — wrap the array if needed
    const rawText = completion.choices[0].message.content.trim();
    let questions = [];

    try {
      const parsed = JSON.parse(rawText);
      // The model may return { "questions": [...] } or just [...]
      questions = Array.isArray(parsed) ? parsed : (parsed.questions || Object.values(parsed)[0] || []);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", rawText);
      const match = rawText.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          questions = JSON.parse(match[0]);
        } catch (e2) {
          return NextResponse.json({ error: "Failed to parse questions from AI response." }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: "Failed to parse questions from AI response." }, { status: 500 });
      }
    }

    await connectDB();
    
    const formattedQuestions = questions.map(q => ({
      question: q,
      answer: "",
      mistake: "",
      feedback: ""
    }));

    // Save the generated interview to the database (store both URL and text)
    await UserData.findOneAndUpdate(
      { user: authUser.id },
      { 
        $push: { 
          interviewHistory: { 
            resume: resumeUrl || "", 
            resumeText: finalResumeText,
            questions: formattedQuestions 
          } 
        } 
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ questions, resumeUrl }, { status: 200 });

  } catch (error) {
    console.error("Generate API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
