import { google } from 'googleapis';
import { Contact } from '../models/Contact.js';
import { User } from '../models/User.js';

const getGmailClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

export const importFromGmail = async (req, res) => {
  try {
    const user = User.findById(req.userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'No valid access token' });
    }

    const gmail = getGmailClient(user.access_token);

    // Get messages (last 500 emails)
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 500,
      q: 'in:sent OR in:inbox'
    });

    const messages = response.data.messages || [];
    const contactsMap = new Map();

    // Process messages in batches
    for (const message of messages.slice(0, 100)) { // Limit to 100 for MVP
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Date']
        });

        const headers = msg.data.payload.headers;
        const fromHeader = headers.find(h => h.name === 'From');
        const toHeader = headers.find(h => h.name === 'To');
        const dateHeader = headers.find(h => h.name === 'Date');

        const emailRegex = /<(.+?)>|([^\s<>]+@[^\s<>]+)/;
        const processEmail = (header) => {
          if (!header) return null;
          const match = header.value.match(emailRegex);
          return match ? (match[1] || match[2]) : null;
        };

        const fromEmail = processEmail(fromHeader);
        const toEmail = processEmail(toHeader);
        const date = dateHeader ? new Date(dateHeader.value).getTime() / 1000 : null;

        // Add contacts (exclude self)
        [fromEmail, toEmail].forEach(email => {
          if (email && email !== user.email) {
            if (!contactsMap.has(email)) {
              contactsMap.set(email, {
                email,
                name: email.split('@')[0],
                lastDate: date,
                count: 1
              });
            } else {
              const contact = contactsMap.get(email);
              contact.count++;
              if (date && (!contact.lastDate || date > contact.lastDate)) {
                contact.lastDate = date;
              }
            }
          }
        });
      } catch (err) {
        console.error('Error processing message:', err.message);
      }
    }

    // Insert contacts into database
    let imported = 0;
    contactsMap.forEach(contact => {
      try {
        Contact.upsert(user.id, {
          name: contact.name,
          email: contact.email,
          last_contacted_at: contact.lastDate,
          interaction_count: contact.count
        });
        imported++;
      } catch (err) {
        console.error('Error inserting contact:', err.message);
      }
    });

    res.json({
      success: true,
      imported,
      total: contactsMap.size
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import contacts', details: error.message });
  }
};

export const getContacts = (req, res) => {
  try {
    const contacts = Contact.findByUserId(req.userId);
    
    // Calculate days since last contact
    const now = Math.floor(Date.now() / 1000);
    const contactsWithDays = contacts.map(c => ({
      ...c,
      daysSinceContact: c.last_contacted_at 
        ? Math.floor((now - c.last_contacted_at) / 86400)
        : null
    }));

    res.json({ contacts: contactsWithDays });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

export const getTop5 = (req, res) => {
  try {
    const top5 = Contact.getTop5(req.userId);
    const now = Math.floor(Date.now() / 1000);
    
    const top5WithDays = top5.map(c => ({
      ...c,
      daysSinceContact: c.last_contacted_at 
        ? Math.floor((now - c.last_contacted_at) / 86400)
        : null
    }));

    res.json({ contacts: top5WithDays });
  } catch (error) {
    console.error('Get top5 error:', error);
    res.status(500).json({ error: 'Failed to fetch top contacts' });
  }
};

export const addContact = (req, res) => {
  try {
    const { name, email, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    const contactId = Contact.create(req.userId, { name, email, notes });
    const contact = Contact.findById(contactId, req.userId);

    res.json({ success: true, contact });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Failed to add contact' });
  }
};