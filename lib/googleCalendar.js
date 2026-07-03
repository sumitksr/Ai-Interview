/**
 * lib/googleCalendar.js
 *
 * Server-side utility for creating Google Calendar events with Google Meet links.
 * Uses OAuth2 with a stored refresh token — no user interaction required at runtime.
 *
 * Required env vars:
 *   GOOGLE_CALENDAR_CLIENT_ID
 *   GOOGLE_CALENDAR_CLIENT_SECRET
 *   GOOGLE_CALENDAR_REFRESH_TOKEN
 *
 * Run scripts/get-google-token.mjs once to obtain the refresh token.
 */

import { google } from "googleapis";
import crypto from "crypto";

/**
 * Creates a Google Calendar event with a Google Meet link.
 *
 * @param {object} options
 * @param {string} options.summary         - Event title (e.g. "Interview: Student with Mentor")
 * @param {string} options.startISO        - Start datetime in ISO 8601 (e.g. "2026-07-05T10:00:00+05:30")
 * @param {string} options.endISO          - End datetime in ISO 8601
 * @param {string[]} [options.attendeeEmails] - Optional list of attendee email addresses
 * @param {string} [options.description]   - Optional event description
 *
 * @returns {Promise<{ meetLink: string, eventId: string }>}
 * @throws {Error} if the Calendar API call fails or no Meet link is returned
 */
export async function createGoogleMeetEvent({
  summary,
  startISO,
  endISO,
  attendeeEmails = [],
  description = "",
}) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Calendar credentials missing. Set GOOGLE_CALENDAR_CLIENT_ID, " +
        "GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN in .env"
    );
  }

  // Build OAuth2 client with stored refresh token
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Build attendees list (filter empty strings)
  const attendees = attendeeEmails
    .filter(Boolean)
    .map((email) => ({ email }));

  const event = {
    summary,
    description,
    start: { dateTime: startISO },
    end: { dateTime: endISO },
    attendees,
    // Request Google Meet link generation
    conferenceData: {
      createRequest: {
        // Must be unique per event creation attempt
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    // CRITICAL: must be 1 or conferenceData is ignored
    conferenceDataVersion: 1,
    sendUpdates: "none", // Don't send Google's own calendar invites (we handle emails)
  });

  const meetLink = response.data.hangoutLink;

  if (!meetLink) {
    throw new Error(
      "Google Calendar API did not return a Meet link. " +
        "Ensure the Calendar API is enabled and the account has Meet access."
    );
  }

  return {
    meetLink,
    eventId: response.data.id,
  };
}
