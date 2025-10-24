import cron from 'node-cron';
import { google } from 'googleapis';
import { ScheduledSend } from '../models/ScheduledSend.js';
import { Contact } from '../models/Contact.js';
import { Relance } from '../models/Relance.js';

const createEmailMessage = (to, subject, body) => {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ].join('\r\n');

  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const sendScheduledEmail = async (scheduled) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ 
      access_token: scheduled.access_token,
      refresh_token: scheduled.refresh_token
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const encodedMessage = createEmailMessage(
      scheduled.contact_email,
      'Reprise de contact',
      scheduled.message
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    // Update scheduled send status
    ScheduledSend.updateStatus(scheduled.id, 'sent');

    // Update contact last contacted
    Contact.updateLastContacted(scheduled.contact_id, scheduled.user_id);

    // Save to relance history
    Relance.create({
      user_id: scheduled.user_id,
      contact_id: scheduled.contact_id,
      message: scheduled.message,
      tone: scheduled.tone,
      status: 'sent'
    });

    console.log(`✅ Sent scheduled email to ${scheduled.contact_email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send scheduled email:`, error.message);
    ScheduledSend.updateStatus(scheduled.id, 'failed');
    return false;
  }
};

export const startCronJobs = () => {
  // Check for scheduled emails every minute
  cron.schedule('* * * * *', async () => {
    const now = Math.floor(Date.now() / 1000);
    const pending = ScheduledSend.findPendingBefore(now);

    if (pending.length > 0) {
      console.log(`📧 Processing ${pending.length} scheduled email(s)...`);

      for (const scheduled of pending) {
        await sendScheduledEmail(scheduled);
      }
    }
  });

  console.log('⏰ Cron jobs started - checking for scheduled emails every minute');
};