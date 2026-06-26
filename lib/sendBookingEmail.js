import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

/**
 * Sends a booking confirmation email to the student.
 */
export async function sendBookingConfirmationToStudent({
  studentEmail,
  studentName,
  teacherName,
  day,
  startTime,
  endTime,
  meetingLink,
}) {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;color:#cbd6e4;">
        <h2 style="color:#2dd4bf;margin-top:0;">Mentor Session Booked! 🎉</h2>
        <p>Hi ${studentName || "there"},</p>
        <p>Your mentoring session has been successfully booked. Here are the details:</p>

        <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#f4f7fb;margin-top:0;">Session Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#97a6ba;width:120px;">Mentor</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${teacherName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Day</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${day}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Time</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${startTime} – ${endTime}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Meeting Link</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;"><a href="${meetingLink}" style="color:#2dd4bf;text-decoration:underline;">Join Meeting</a></td>
            </tr>
          </table>
        </div>

        <p>You can join your session using the meeting link provided above. Prepare your questions and give it your best!</p>

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #263246;font-size:14px;color:#97a6ba;">
          <strong>Support:</strong> <a href="mailto:sumitksr4156@gmail.com" style="color:#2dd4bf;text-decoration:none;">sumitksr4156@gmail.com</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Interview Platform" <${process.env.MAIL_USER}>`,
      to: studentEmail,
      subject: `✅ Session Booked with ${teacherName}`,
      html,
    });

    console.log(`Booking confirmation sent to student: ${studentEmail}`);
  } catch (error) {
    console.error("Error sending student booking email:", error);
  }
}

/**
 * Sends a booking notification email to the teacher.
 */
export async function sendBookingNotificationToTeacher({
  teacherEmail,
  teacherName,
  studentName,
  studentEmail,
  day,
  startTime,
  endTime,
  meetingLink,
}) {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;color:#cbd6e4;">
        <h2 style="color:#2dd4bf;margin-top:0;">New Session Booking 📅</h2>
        <p>Hi ${teacherName || "there"},</p>
        <p>A student has booked a mentoring session with you. Here are the details:</p>

        <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#f4f7fb;margin-top:0;">Session Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#97a6ba;width:120px;">Student</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Student Email</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Day</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${day}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Time</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${startTime} – ${endTime}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Meeting Link</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;"><a href="${meetingLink}" style="color:#2dd4bf;text-decoration:underline;">Join Meeting</a></td>
            </tr>
          </table>
        </div>

        <p>You can join the session using the meeting link provided above.</p>

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #263246;font-size:14px;color:#97a6ba;">
          <strong>Support:</strong> <a href="mailto:sumitksr4156@gmail.com" style="color:#2dd4bf;text-decoration:none;">sumitksr4156@gmail.com</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Interview Platform" <${process.env.MAIL_USER}>`,
      to: teacherEmail,
      subject: `📅 New Booking from ${studentName}`,
      html,
    });

    console.log(`Booking notification sent to teacher: ${teacherEmail}`);
  } catch (error) {
    console.error("Error sending teacher booking email:", error);
  }
}

/**
 * Sends a meeting reschedule notification email to the student
 * when the mentor changes the meeting start/end time.
 */
export async function sendMeetingRescheduleEmail({
  studentEmail,
  studentName,
  teacherName,
  day,
  oldStartTime,
  oldEndTime,
  newStartTime,
  newEndTime,
  meetingLink,
}) {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;color:#cbd6e4;">
        <h2 style="color:#f59e0b;margin-top:0;">⏰ Meeting Time Updated</h2>
        <p>Hi ${studentName || "there"},</p>
        <p>Your mentor <strong style="color:#f4f7fb;">${teacherName}</strong> has updated the meeting time for your upcoming session.</p>

        <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#f4f7fb;margin-top:0;">Updated Session Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#97a6ba;width:140px;">Date</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${day}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Previous Time</td>
              <td style="padding:8px 0;color:#ef4444;font-weight:600;text-decoration:line-through;">${oldStartTime} – ${oldEndTime}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">New Time</td>
              <td style="padding:8px 0;color:#2dd4bf;font-weight:700;font-size:16px;">${newStartTime} – ${newEndTime}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Meeting Link</td>
              <td style="padding:8px 0;"><a href="${meetingLink}" style="color:#2dd4bf;text-decoration:underline;font-weight:600;">Join Meeting</a></td>
            </tr>
          </table>
        </div>

        <div style="background:#1a1200;border:1px solid #78350f;border-radius:10px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#fbbf24;font-size:14px;">
            ⚠️ <strong>Note:</strong> The meeting link will only be active <strong>30 minutes before</strong> the new start time and will expire <strong>1 hour after</strong> the session ends.
          </p>
        </div>

        <p>Please update your calendar accordingly. If you have any questions, reach out to our support team.</p>

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #263246;font-size:14px;color:#97a6ba;">
          <strong>Support:</strong> <a href="mailto:sumitksr4156@gmail.com" style="color:#2dd4bf;text-decoration:none;">sumitksr4156@gmail.com</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Interview Platform" <${process.env.MAIL_USER}>`,
      to: studentEmail,
      subject: `⏰ Meeting Time Changed — ${teacherName} updated your session`,
      html,
    });

    console.log(`Reschedule notification sent to student: ${studentEmail}`);
  } catch (error) {
    console.error("Error sending reschedule email:", error);
  }
}
