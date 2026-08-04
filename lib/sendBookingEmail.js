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
 * Builds a Google Calendar "Add to Calendar" URL.
 * @param {object} opts
 * @param {string} opts.title       - Event title
 * @param {string} opts.startISO    - ISO 8601 start datetime (e.g. "2026-06-21T10:00:00+05:30")
 * @param {string} opts.endISO      - ISO 8601 end datetime
 * @param {string} [opts.details]   - Event description
 * @param {string} [opts.location]  - Location or meeting link
 * @returns {string} Google Calendar URL
 */
function buildGoogleCalendarUrl({ title, startISO, endISO, details = "", location = "" }) {
  // Google Calendar expects dates in UTC: YYYYMMDDTHHmmssZ
  const toGCalDate = (iso) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGCalDate(startISO)}/${toGCalDate(endISO)}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
  startISO,
  endISO,
}) {
  try {
    const transporter = createTransporter();

    // Build Google Calendar link if ISO times are provided
    const calendarUrl =
      startISO && endISO
        ? buildGoogleCalendarUrl({
            title: `Mentor Session with ${teacherName}`,
            startISO,
            endISO,
            details: `Your mentoring session on the Ace AI Interview Platform.\nMeeting Link: ${meetingLink}`,
            location: meetingLink,
          })
        : null;

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

        ${calendarUrl ? `
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${calendarUrl}" target="_blank"
             style="display:inline-block;background:#2dd4bf;color:#0a0f1c;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
            📅 Add to Google Calendar
          </a>
        </div>
        ` : ""}

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
  startISO,
  endISO,
}) {
  try {
    const transporter = createTransporter();

    // Build Google Calendar link if ISO times are provided
    const calendarUrl =
      startISO && endISO
        ? buildGoogleCalendarUrl({
            title: `Session with ${studentName}`,
            startISO,
            endISO,
            details: `Mentoring session booked via Ace AI Interview Platform.\nStudent: ${studentName} (${studentEmail})\nMeeting Link: ${meetingLink}`,
            location: meetingLink,
          })
        : null;

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

        ${calendarUrl ? `
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${calendarUrl}" target="_blank"
             style="display:inline-block;background:#2dd4bf;color:#0a0f1c;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
            📅 Add to Google Calendar
          </a>
        </div>
        ` : ""}

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
 * Sends an alert email to the admin when Google Meet link creation fails
 * after all retry attempts, so the admin can manually fix it.
 */
export async function sendAdminMeetFailureAlert({
  bookingId,
  bookid,
  studentName,
  studentEmail,
  teacherName,
  scheduledDate,
  startTime,
  endTime,
  errorMessage,
}) {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #7f1d1d;color:#cbd6e4;">
        <h2 style="color:#ef4444;margin-top:0;">🚨 Google Meet Link Creation Failed</h2>
        <p>All <strong>3 retry attempts</strong> to create a Google Meet link have failed after a confirmed payment. <strong>Manual action required.</strong></p>

        <div style="background:#1a0a0a;border:1px solid #7f1d1d;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#f4f7fb;margin-top:0;">Booking Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#97a6ba;width:140px;">Booking ID</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${bookingId}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Short ID</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${bookid}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Student</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${studentName} (${studentEmail})</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Mentor</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${teacherName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Date</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${scheduledDate}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Time</td>
              <td style="padding:8px 0;color:#f4f7fb;font-weight:600;">${startTime} – ${endTime}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Error</td>
              <td style="padding:8px 0;color:#ef4444;font-family:monospace;font-size:13px;">${errorMessage}</td>
            </tr>
          </table>
        </div>

        <div style="background:#1c1200;border:1px solid #92400e;border-radius:10px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#fbbf24;font-size:14px;">
            ⚠️ <strong>Action Required:</strong> Please manually create a Google Meet link for this booking
            and update the <code style="background:#0a0f1c;padding:2px 6px;border-radius:4px;">meetingLink</code>
            field in the database for booking ID <strong>${bookingId}</strong>.
          </p>
        </div>

        <p style="color:#97a6ba;font-size:13px;">This alert was auto-generated by the Ace AI Interview Platform booking system.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Ace AI System Alert" <${process.env.MAIL_USER}>`,
      to: "sumitksr4156@gmail.com",
      subject: `🚨 ACTION REQUIRED: Meet Link Failed for Booking ${bookid}`,
      html,
    });

    console.log(`[Admin Alert] Meet failure email sent for booking ${bookid}`);
  } catch (error) {
    console.error("Error sending admin alert email:", error);
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
  oldDay,
  newDay,
  oldStartTime,
  oldEndTime,
  newStartTime,
  newEndTime,
  meetingLink,
  startISO,
  endISO,
}) {
  try {
    const transporter = createTransporter();

    // Build Google Calendar link for the updated session time
    const calendarUrl =
      startISO && endISO
        ? buildGoogleCalendarUrl({
            title: `Mentor Session with ${teacherName} (Rescheduled)`,
            startISO,
            endISO,
            details: `Your rescheduled mentoring session on the Ace AI Interview Platform.\nMentor: ${teacherName}\nMeeting Link: ${meetingLink}`,
            location: meetingLink,
          })
        : null;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0f1c;padding:32px;border-radius:16px;border:1px solid #263246;color:#cbd6e4;">
        <h2 style="color:#f59e0b;margin-top:0;">⏰ Meeting Time Updated</h2>
        <p>Hi ${studentName || "there"},</p>
        <p>Your mentor <strong style="color:#f4f7fb;">${teacherName}</strong> has updated the meeting time for your upcoming session.</p>

        <div style="background:#172033;border:1px solid #263246;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#f4f7fb;margin-top:0;">Updated Session Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">Previous Time</td>
              <td style="padding:8px 0;color:#ef4444;font-weight:600;text-decoration:line-through;">${oldDay ? oldDay + ', ' : ''}${oldStartTime} – ${oldEndTime}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#97a6ba;">New Time</td>
              <td style="padding:8px 0;color:#2dd4bf;font-weight:700;font-size:16px;">${newDay ? newDay + ', ' : ''}${newStartTime} – ${newEndTime}</td>
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

        ${calendarUrl ? `
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${calendarUrl}" target="_blank"
             style="display:inline-block;background:#f59e0b;color:#0a0f1c;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
            📅 Add Updated Time to Google Calendar
          </a>
        </div>
        ` : ""}

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
