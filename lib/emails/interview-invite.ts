import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY ?? "");

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
      month: "2-digit",
      day: "2-digit",
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

export async function sendInterviewInvite(
  params: InterviewInviteParams,
): Promise<void> {
  const {
    candidateName,
    candidateEmail,
    jobTitle,
    title,
    scheduledAt,
    durationMinutes,
    timezone,
    interviewerName,
    hmEmail,
    location,
    meetingLink,
    notes,
  } = params;

  const hrEmail = process.env.HR_EMAIL;
  const senderEmail = process.env.SENDER_EMAIL;

  const startDate = formatDate(scheduledAt, timezone);
  const startTime = formatTime(scheduledAt, timezone);
  const endIso = new Date(
    new Date(scheduledAt).getTime() + durationMinutes * 60_000,
  ).toISOString();
  const endTime = formatTime(endIso, timezone);

  const ccList: string[] = [];
  if (hmEmail) ccList.push(hmEmail);
  if (hrEmail) ccList.push(hrEmail);

  const interviewerLine = interviewerName
    ? `<tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Interviewer</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${interviewerName}</td></tr>`
    : "";

  const modeLine = meetingLink
    ? `<tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Mode</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">Remote</td></tr><tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Meeting link</td><td style="padding: 6px 0; font-size: 14px;"><a href="${meetingLink}" style="color: #B8553A;">${meetingLink}</a></td></tr>`
    : location
    ? `<tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Mode</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">In-person</td></tr><tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Venue</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${location}</td></tr>`
    : "";

  const notesSection = notes
    ? `
      <div style="margin-top: 28px;">
        <p style="font-size: 15px; font-weight: 600; color: #1A1815; margin: 0 0 10px 0;">What to bring / prepare</p>
        <p style="font-size: 14px; color: #1A1815; margin: 0; white-space: pre-line; line-height: 1.7;">${notes}</p>
      </div>`
    : "";

  const html = `
    <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; color: #1A1815; background: #FAF8F4; padding: 40px 32px;">

      <p style="font-size: 16px; margin: 0 0 6px 0;">Hi ${candidateName},</p>
      <p style="font-size: 15px; color: #1A1815; margin: 0 0 28px 0;">
        Congratulations, you have been shortlisted for the next round of interviews.
      </p>

      <hr style="border: none; border-top: 1px solid #E5E0D5; margin: 0 0 24px 0;" />

      <p style="font-size: 15px; font-weight: 600; color: #1A1815; margin: 0 0 14px 0;">${title}</p>

      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Date</td>
          <td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${startDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #8A857B; font-size: 13px;">Time</td>
          <td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${startTime} to ${endTime}</td>
        </tr>
        ${interviewerLine}
        ${modeLine}
      </table>

      ${notesSection}

      <hr style="border: none; border-top: 1px solid #E5E0D5; margin: 32px 0 20px 0;" />

      <p style="color: #8A857B; font-size: 12px; margin: 0;">
        This is an automated message from Yuvabe People regarding your application for <strong>${jobTitle}</strong>.
        If you have questions, reply to this email.
      </p>
    </div>
  `;

  await getResend().emails.send({
    from: `Yuvabe HR <${senderEmail}>`,
    to: candidateEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    subject: `Interview Invitation: ${title} — ${jobTitle}`,
    html,
  });
}

export type InterviewCancellationParams = {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  title: string;
  hmEmail?: string;
};

export async function sendInterviewCancellation(
  params: InterviewCancellationParams,
): Promise<void> {
  const { candidateName, candidateEmail, jobTitle, title, hmEmail } = params;
  const hrEmail = process.env.HR_EMAIL;
  const senderEmail = process.env.SENDER_EMAIL;
  const ccList: string[] = [];
  if (hmEmail) ccList.push(hmEmail);
  if (hrEmail) ccList.push(hrEmail);

  const html = `
    <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; color: #1A1815; background: #FAF8F4; padding: 40px 32px;">
      <p style="font-size: 16px; margin: 0 0 6px 0;">Hi ${candidateName},</p>
      <p style="font-size: 15px; color: #1A1815; margin: 0 0 28px 0;">
        We regret to inform you that your interview at Yuvabe has been cancelled.
      </p>
      <hr style="border: none; border-top: 1px solid #E5E0D5; margin: 0 0 24px 0;" />
      <p style="font-size: 15px; font-weight: 600; color: #1A1815; margin: 0 0 6px 0;">${title}</p>
      <p style="font-size: 14px; color: #8A857B; margin: 0 0 28px 0;">This interview has been cancelled.</p>
      <hr style="border: none; border-top: 1px solid #E5E0D5; margin: 0 0 20px 0;" />
      <p style="color: #8A857B; font-size: 12px; margin: 0;">
        This is an automated message from Yuvabe People regarding your application for <strong>${jobTitle}</strong>.
        If you have questions, reply to this email.
      </p>
    </div>
  `;

  await getResend().emails.send({
    from: `Yuvabe HR <${senderEmail}>`,
    to: candidateEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    subject: `Interview Cancelled: ${title} — ${jobTitle}`,
    html,
  });
}

export type InterviewRescheduleParams = InterviewInviteParams;

export async function sendInterviewReschedule(
  params: InterviewRescheduleParams,
): Promise<void> {
  const {
    candidateName, candidateEmail, jobTitle, title,
    scheduledAt, durationMinutes, timezone,
    interviewerName, hmEmail, location, meetingLink, notes,
  } = params;

  const hrEmail = process.env.HR_EMAIL;
  const senderEmail = process.env.SENDER_EMAIL;
  const ccList: string[] = [];
  if (hmEmail) ccList.push(hmEmail);
  if (hrEmail) ccList.push(hrEmail);

  const startDate = formatDate(scheduledAt, timezone);
  const startTime = formatTime(scheduledAt, timezone);
  const endIso = new Date(new Date(scheduledAt).getTime() + durationMinutes * 60_000).toISOString();
  const endTime = formatTime(endIso, timezone);

  const interviewerLine = interviewerName
    ? `<tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Interviewer</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${interviewerName}</td></tr>`
    : "";
  const modeLine = meetingLink
    ? `<tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Mode</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">Remote</td></tr><tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Meeting link</td><td style="padding: 6px 0; font-size: 14px;"><a href="${meetingLink}" style="color: #B8553A;">${meetingLink}</a></td></tr>`
    : location
    ? `<tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Mode</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">In-person</td></tr><tr><td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Venue</td><td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${location}</td></tr>`
    : "";
  const notesSection = notes
    ? `<div style="margin-top: 28px;"><p style="font-size: 15px; font-weight: 600; color: #1A1815; margin: 0 0 10px 0;">What to bring / prepare</p><p style="font-size: 14px; color: #1A1815; margin: 0; white-space: pre-line; line-height: 1.7;">${notes}</p></div>`
    : "";

  const html = `
    <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; color: #1A1815; background: #FAF8F4; padding: 40px 32px;">
      <p style="font-size: 16px; margin: 0 0 6px 0;">Hi ${candidateName},</p>
      <p style="font-size: 15px; color: #1A1815; margin: 0 0 28px 0;">
        Your interview at Yuvabe has been rescheduled. Please find the updated details below.
      </p>
      <hr style="border: none; border-top: 1px solid #E5E0D5; margin: 0 0 24px 0;" />
      <p style="font-size: 15px; font-weight: 600; color: #1A1815; margin: 0 0 14px 0;">${title}</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 6px 0; color: #8A857B; font-size: 13px; width: 120px;">Date</td>
          <td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${startDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #8A857B; font-size: 13px;">Time</td>
          <td style="padding: 6px 0; font-size: 14px; color: #1A1815;">${startTime} to ${endTime}</td>
        </tr>
        ${interviewerLine}${modeLine}
      </table>
      ${notesSection}
      <hr style="border: none; border-top: 1px solid #E5E0D5; margin: 32px 0 20px 0;" />
      <p style="color: #8A857B; font-size: 12px; margin: 0;">
        This is an automated message from Yuvabe People regarding your application for <strong>${jobTitle}</strong>.
        If you have questions, reply to this email.
      </p>
    </div>
  `;

  await getResend().emails.send({
    from: `Yuvabe HR <${senderEmail}>`,
    to: candidateEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    subject: `Interview Rescheduled: ${title} — ${jobTitle}`,
    html,
  });
}
