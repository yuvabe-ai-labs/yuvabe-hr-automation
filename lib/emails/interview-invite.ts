import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type InterviewInviteParams = {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  title: string;
  scheduledAt: string; // ISO 8601 UTC
  durationMinutes: number;
  timezone: string;
  interviewerName?: string;
  hmEmail?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
};

function formatDate(isoUtc: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(isoUtc));
  } catch {
    return isoUtc;
  }
}

function formatTime(isoUtc: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoUtc));
  } catch {
    return isoUtc;
  }
}

function tzAbbr(isoUtc: string, timezone: string): string {
  try {
    return (
      new Intl.DateTimeFormat("en", { timeZone: timezone, timeZoneName: "short" })
        .formatToParts(new Date(isoUtc))
        .find((p) => p.type === "timeZoneName")?.value ?? timezone
    );
  } catch {
    return timezone;
  }
}

const ROW = (label: string, value: string) =>
  `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;color:#1A1815;font-size:13px;width:130px;vertical-align:top;font-weight:700;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;font-size:14px;color:#1A1815;font-weight:700;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">${value}</td>
  </tr>`;

function buildDetailsCard(params: {
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  tz: string;
  interviewerName?: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
}): string {
  const { title, startDate, startTime, endTime, durationMinutes, tz, interviewerName, meetingLink, location, notes } = params;

  const interviewerRow = interviewerName ? ROW("Interviewer", interviewerName) : "";

  const modeRows = meetingLink
    ? ROW("Format", "Video Call") +
      ROW("Meeting Link", `<a href="${meetingLink}" style="color:#B8553A;word-break:break-all;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">${meetingLink}</a>`)
    : location
    ? ROW("Format", "In-Person") + ROW("Venue", location)
    : "";

  const notesSection = notes
    ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #F0EDE8;">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8A857B;margin:0 0 8px 0;font-weight:600;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">Preparation Notes</p>
        <p style="font-size:14px;color:#1A1815;margin:0;white-space:pre-line;line-height:1.7;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">${notes}</p>
      </div>`
    : "";

  return `
    <div style="background:#ffffff;border:1px solid #E5E0D5;border-radius:4px;padding:24px;">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#1A1815;margin:0 0 16px 0;font-weight:700;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">${title}</p>
      <table style="border-collapse:collapse;width:100%;">
        ${ROW("Date", startDate)}
        ${ROW("Time", `${startTime} – ${endTime} <span style="color:#8A857B;font-size:12px;">(${durationMinutes} min · ${tz})</span>`)}
        ${interviewerRow}
        ${modeRows}
      </table>
      ${notesSection}
    </div>`;
}

function emailShell(bodyContent: string): string {
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const logoUrl = `${appUrl}/assests/yuvabe.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0ece5;">
  <div style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;max-width:600px;margin:32px auto;">

    <!-- Header -->
    <div style="background:#ffffff;padding:20px 32px;border-radius:4px 4px 0 0;border-bottom:1px solid #E5E0D5;">
      <img src="${logoUrl}" alt="Yuvabe" height="40" style="display:block;object-fit:contain;" />
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;background:#FAF8F4;">
      ${bodyContent}
    </div>

  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Schedule
// ─────────────────────────────────────────────────────────────

export async function sendInterviewInvite(params: InterviewInviteParams): Promise<void> {
  const {
    candidateName, candidateEmail, jobTitle, title,
    scheduledAt, durationMinutes, timezone,
    interviewerName, hmEmail, location, meetingLink, notes,
  } = params;

  const senderEmail = process.env.SENDER_EMAIL;
  const hrEmail = process.env.HR_EMAIL;
  const ccList: string[] = [];
  if (hmEmail) ccList.push(hmEmail);
  if (hrEmail) ccList.push(hrEmail);

  const startDate = formatDate(scheduledAt, timezone);
  const startTime = formatTime(scheduledAt, timezone);
  const endIso = new Date(new Date(scheduledAt).getTime() + durationMinutes * 60_000).toISOString();
  const endTime = formatTime(endIso, timezone);
  const tz = tzAbbr(scheduledAt, timezone);

  const detailsCard = buildDetailsCard({ title, startDate, startTime, endTime, durationMinutes, tz, interviewerName, meetingLink, location, notes });

  const body = `
    <p style="font-size:16px;color:#1A1815;margin:0 0 6px 0;">Dear ${candidateName},</p>
    <p style="font-size:15px;color:#1A1815;line-height:1.7;margin:0 0 32px 0;">
      Thank you for your interest in the <strong>${jobTitle}</strong> role at Yuvabe. We are pleased to invite you for the next stage of our selection process. Please find the interview details below.
    </p>

    ${detailsCard}

    <p style="font-size:14px;color:#1A1815;margin:24px 0 0 0;">
      We look forward to speaking with you.
    </p>

    <p style="font-size:14px;color:#1A1815;margin:16px 0 0 0;">
      Thank you for your time and interest in joining Yuvabe.
    </p>

    <p style="font-size:14px;color:#1A1815;margin:20px 0 0 0;line-height:1.6;">
      Warm regards,<br/>
      <strong>Yuvabe HR Team</strong>
    </p>`;

  await resend.emails.send({
    from: `Yuvabe <${senderEmail}>`,
    to: candidateEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    subject: `Interview Invitation — ${jobTitle} (${title})`,
    html: emailShell(body),
  });
}

// ─────────────────────────────────────────────────────────────
// Reschedule
// ─────────────────────────────────────────────────────────────

export type InterviewRescheduleParams = InterviewInviteParams;

export async function sendInterviewReschedule(params: InterviewRescheduleParams): Promise<void> {
  const {
    candidateName, candidateEmail, jobTitle, title,
    scheduledAt, durationMinutes, timezone,
    interviewerName, hmEmail, location, meetingLink, notes,
  } = params;

  const senderEmail = process.env.SENDER_EMAIL;
  const hrEmail = process.env.HR_EMAIL;
  const ccList: string[] = [];
  if (hmEmail) ccList.push(hmEmail);
  if (hrEmail) ccList.push(hrEmail);

  const startDate = formatDate(scheduledAt, timezone);
  const startTime = formatTime(scheduledAt, timezone);
  const endIso = new Date(new Date(scheduledAt).getTime() + durationMinutes * 60_000).toISOString();
  const endTime = formatTime(endIso, timezone);
  const tz = tzAbbr(scheduledAt, timezone);

  const detailsCard = buildDetailsCard({ title, startDate, startTime, endTime, durationMinutes, tz, interviewerName, meetingLink, location, notes });

  const body = `
    <p style="font-size:16px;color:#1A1815;margin:0 0 6px 0;">Dear ${candidateName},</p>
    <p style="font-size:15px;color:#1A1815;line-height:1.7;margin:0 0 32px 0;">
      We sincerely apologise for the inconvenience, and wish to inform you that your interview for the <strong>${jobTitle}</strong> role at Yuvabe has been rescheduled. Please note the updated details below and disregard any previous interview confirmation.
    </p>

    ${detailsCard}

    <p style="font-size:14px;color:#1A1815;margin:24px 0 0 0;">
      We look forward to speaking with you.
    </p>

    <p style="font-size:14px;color:#1A1815;margin:16px 0 0 0;">
      Thank you for your understanding and continued patience.
    </p>

    <p style="font-size:14px;color:#1A1815;margin:20px 0 0 0;line-height:1.6;">
      Warm regards,<br/>
      <strong>Yuvabe HR Team</strong>
    </p>`;

  await resend.emails.send({
    from: `Yuvabe <${senderEmail}>`,
    to: candidateEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    subject: `Interview Rescheduled — ${jobTitle} (${title})`,
    html: emailShell(body),
  });
}

// ─────────────────────────────────────────────────────────────
// Cancellation
// ─────────────────────────────────────────────────────────────

export type InterviewCancellationParams = {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  title: string;
  hmEmail?: string;
};

export async function sendInterviewCancellation(params: InterviewCancellationParams): Promise<void> {
  const { candidateName, candidateEmail, jobTitle, title, hmEmail } = params;

  const senderEmail = process.env.SENDER_EMAIL;
  const hrEmail = process.env.HR_EMAIL;
  const ccList: string[] = [];
  if (hmEmail) ccList.push(hmEmail);
  if (hrEmail) ccList.push(hrEmail);

  const body = `
    <p style="font-size:16px;color:#1A1815;margin:0 0 6px 0;">Dear ${candidateName},</p>
    <p style="font-size:15px;color:#1A1815;line-height:1.7;margin:0 0 32px 0;">
      We sincerely apologise and regret to inform you that your scheduled interview for the <strong>${jobTitle}</strong> role at Yuvabe has been cancelled.
    </p>

    <div style="background:#ffffff;border:1px solid #E5E0D5;border-radius:4px;padding:24px;">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8A857B;margin:0 0 8px 0;font-weight:600;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">${title}</p>
      <p style="font-size:14px;color:#8A857B;margin:0;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">This interview has been cancelled.</p>
    </div>

    <p style="font-size:14px;color:#1A1815;line-height:1.7;margin:28px 0 0 0;">
      We sincerely apologise for any inconvenience this may have caused.
    </p>

    <p style="font-size:14px;color:#1A1815;line-height:1.7;margin:16px 0 0 0;">
      Our team will reach out to you shortly to discuss the next steps.
    </p>

    <p style="font-size:14px;color:#1A1815;margin:24px 0 0 0;">
      Thank you for your time and continued interest in Yuvabe.
    </p>

    <p style="font-size:14px;color:#1A1815;margin:20px 0 0 0;line-height:1.6;">
      Warm regards,<br/>
      <strong>Yuvabe HR Team</strong>
    </p>`;

  await resend.emails.send({
    from: `Yuvabe <${senderEmail}>`,
    to: candidateEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    subject: `Interview Cancellation — ${jobTitle} (${title})`,
    html: emailShell(body),
  });
}
