import nodemailer from "nodemailer";

export async function sendWelcomeEmail(email, name) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;color:#cbd6e4;">
        <h2 style="color:#2dd4bf;margin-top:0;">Welcome to AI Interview Platform! 🚀</h2>
        <p>Hi ${name || "there"},</p>
        <p>We're thrilled to have you on board! You've successfully created an account and taken your first step toward mastering your interview skills.</p>
        
        <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#f4f7fb;margin-top:0;">What you can do next:</h3>
          <ul style="margin-bottom:0;padding-left:20px;">
            <li style="margin-bottom:8px;">Take practice interviews tailored to your role.</li>
            <li style="margin-bottom:8px;">Receive AI-driven feedback on clarity, structure, and depth.</li>
            <li>Track your scores and progress over time on your dashboard.</li>
          </ul>
        </div>
        
        <p>If you have any questions, encounter issues, or just want to share feedback, we're here to help.</p>
        
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #263246;font-size:14px;color:#97a6ba;">
          <strong>Support Contact:</strong> <a href="mailto:sumitksr4156@gmail.com" style="color:#2dd4bf;text-decoration:none;">sumitksr4156@gmail.com</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Interview Platform" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Welcome to AI Interview Platform! 🎉",
      html: htmlContent,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}
