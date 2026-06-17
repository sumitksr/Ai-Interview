import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectDB, UserData, cloudinary } from "@/imports";
import { GoogleGenAI } from "@google/genai";
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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Generate Questions with OpenAI
    const prompt = `
      You are an expert technical interviewer. Based on the following candidate context and resume, generate 5 highly tailored interview questions.
      
      Target Role: ${targetRole}
      Experience Level: ${experienceLevel}
      Focus Area: ${focus}
      
      Resume Content:
      ${finalResumeText.substring(0, 5000)} // Truncating to avoid token limits if too long
      
      Provide the response STRICTLY as a JSON array of strings, where each string is an interview question. Do not include markdown formatting like \`\`\`json or \`\`\`.
      Example:
      [
        "Can you explain how you designed the XYZ system mentioned in your resume?",
        "What was your most challenging project?"
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const responseText = response.text.trim();
    let questions = [];
    
    try {
      questions = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", responseText);
      // Attempt a fallback regex if JSON.parse fails (e.g. if AI includes markdown)
      const match = responseText.match(/\[([\s\S]*?)\]/);
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
