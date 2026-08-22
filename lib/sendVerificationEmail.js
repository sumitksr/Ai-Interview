import nodemailer from "nodemailer";

/**
 * Send an email-verification link to the given address.
 *
 * @param {string} email   Recipient address
 * @param {string} name    Display name (used in greeting)
 * @param {string} token   The verification token (UUID stored in DB)
 */
export async function sendVerificationEmail(email, name, token) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/v1/user/login/verifymail/${token}`;

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
      <h2 style="color:#2dd4bf;margin-top:0;">Verify Your Email ✉️</h2>
      <p>Hi ${name || "there"},</p>
      <p>Thanks for signing up on <strong>AI Interview Platform</strong>! Please verify your email address by clicking the button below. This link is valid for <strong>3 days</strong>.</p>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}" 
           style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2dd4bf,#6366f1);color:#fff;font-weight:700;font-size:16px;text-decoration:none;border-radius:12px;">
          Verify My Email
        </a>
      </div>

      <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:16px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#97a6ba;">Or copy and paste this link into your browser:</p>
        <p style="margin:0;word-break:break-all;font-size:13px;color:#2dd4bf;">${verifyUrl}</p>
      </div>

      <p style="font-size:13px;color:#97a6ba;">If you didn't create an account on AI Interview Platform, you can safely ignore this email.</p>
      
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #263246;font-size:14px;color:#97a6ba;">
        <strong>Support Contact:</strong> <a href="mailto:sumitksr4156@gmail.com" style="color:#2dd4bf;text-decoration:none;">sumitksr4156@gmail.com</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"AI Interview Platform" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Verify your email — AI Interview Platform",
    html: htmlContent,
  });

  console.log(`Verification email sent to ${email}`);
}
