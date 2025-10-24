import { google } from 'googleapis';
import { Contact } from '../models/Contact.js';
import { Relance } from '../models/Relance.js';
import { ScheduledSend } from '../models/ScheduledSend.js';
import { User } from '../models/User.js';

const TEMPLATES = {
  formal: (contactName, daysSinceContact) => {
    const templates = [
      `Madame, Monsieur ${contactName},

J'espère que ce message vous trouve en bonne santé. Je me permets de revenir vers vous ${daysSinceContact ? `suite à notre dernier échange d'il y a ${daysSinceContact} jours` : 'pour maintenir notre lien professionnel'}.

Seriez-vous disponible pour un échange téléphonique ou une réunion dans les prochains jours ? Je serais ravi de discuter de nos projets communs et d'explorer de nouvelles opportunités de collaboration.

Dans l'attente de votre retour, je vous prie d'agréer mes salutations distinguées.`,
      
      `Bonjour ${contactName},

J'espère que vous allez bien. ${daysSinceContact ? `Voilà ${daysSinceContact} jours que nous ne nous sommes pas parlés` : 'Je tenais à reprendre contact avec vous'} et je souhaiterais faire un point sur nos échanges.

Auriez-vous un moment cette semaine pour une conversation téléphonique ? Je suis convaincu que nous pourrions identifier de nouvelles synergies.

Je reste à votre disposition.
Cordialement`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  },

  pro: (contactName, daysSinceContact) => {
    const templates = [
      `Salut ${contactName} !

Comment vas-tu ? ${daysSinceContact ? `Cela fait ${daysSinceContact} jours qu'on ne s'est pas parlés` : 'Je pense à toi'} et je me disais qu'on devrait se faire un point bientôt.

Tu serais dispo pour un café ou un appel cette semaine ? J'aimerais bien prendre de tes nouvelles et voir comment avancent tes projets.

À très vite !`,

      `Hey ${contactName},

J'espère que tout roule pour toi ! ${daysSinceContact ? `Ça fait un moment (${daysSinceContact} jours)` : 'Je voulais reprendre contact'} et je me suis dit qu'un petit rattrapage s'imposait.

On pourrait se caler un call rapide cette semaine ? Ça serait cool de discuter de ce qu'on fait en ce moment.

Dis-moi ce qui t'arrange !`,

      `Coucou ${contactName},

Comment tu vas ? ${daysSinceContact ? `On ne s'est pas parlé depuis ${daysSinceContact} jours` : 'Je pense à toi'} et je trouve qu'il serait temps de faire un point ensemble.

Tu as 15-20 minutes dans ta semaine pour qu'on se prenne un café virtuel ou physique ? J'aimerais bien savoir où tu en es dans tes projets.

Hâte de te lire !`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  },

  friendly: (contactName, daysSinceContact) => {
    const templates = [
      `Salut ${contactName} ! 😊

Comment tu vas ? ${daysSinceContact ? `Ça fait ${daysSinceContact} jours qu'on s'est pas parlés, c'est fou` : 'Je pense à toi'} ! Il faut absolument qu'on se voit ou qu'on se fasse un appel bientôt.

Tu serais dispo pour un café, un déjeuner ou juste un appel cette semaine ? J'ai trop envie de prendre de tes nouvelles et de savoir comment tu vas.

Dis-moi quand t'es libre ! 🙌`,

      `Hey ${contactName} ! 👋

Alors, quoi de neuf ? ${daysSinceContact ? `Ça fait un bail (${daysSinceContact} jours !)` : 'Ça fait trop longtemps'} qu'on a pas discuté et franchement ça me manque !

On se cale un truc cette semaine ? Café, bière, appel, ce que tu veux ! J'ai plein de trucs à te raconter et j'ai envie de savoir comment tu vas.

Envoie-moi tes dispos ! 😄`,

      `Coucou ${contactName} ! 💙

J'espère que tout va super bien pour toi ! ${daysSinceContact ? `Ça fait ${daysSinceContact} jours` : 'Ça fait un moment'} et je me dis qu'il est temps qu'on se rattrape.

T'es chaud pour un déj', un café ou même juste un call ? Je veux tout savoir sur ce que tu deviens !

Hâte de te voir/parler ! ✨`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
};

const getGmailClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

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

export const generateTemplate = async (req, res) => {
  try {
    const { contactId, tone } = req.body;
    if (!contactId || !tone) {
      return res.status(400).json({ error: 'Contact ID and tone required' });
    }

    const contact = await Contact.findById(contactId, req.userId);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const now = Math.floor(Date.now() / 1000);
    const daysSinceContact = contact.last_contacted_at 
      ? Math.floor((now - contact.last_contacted_at) / 86400)
      : null;

    const templateFunc = TEMPLATES[tone] || TEMPLATES.pro;
    const message = templateFunc(contact.name, daysSinceContact);

    res.json({
      message,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        daysSinceContact
      }
    });
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

export const sendEmail = async (req, res) => {
  try {
    const { contactId, message, tone } = req.body;
    if (!contactId || !message) {
      return res.status(400).json({ error: 'Contact ID and message required' });
    }

    const user = await User.findById(req.userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'No valid access token' });
    }

    const contact = await Contact.findById(contactId, req.userId);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const gmail = getGmailClient(user.access_token);
    const encodedMessage = createEmailMessage(contact.email, 'Reprise de contact', message);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    await Contact.updateLastContacted(contactId, req.userId);
    await Relance.create({
      user_id: req.userId,
      contact_id: contactId,
      message,
      tone: tone || 'pro',
      status: 'sent'
    });

    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      contact: { id: contact.id, name: contact.name, email: contact.email }
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};

export const scheduleEmail = async (req, res) => {
  try {
    const { contactId, message, tone, sendAt } = req.body;
    if (!contactId || !message || !sendAt) {
      return res.status(400).json({ error: 'Contact ID, message, and send time required' });
    }

    const contact = await Contact.findById(contactId, req.userId);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const sendTimestamp = new Date(sendAt).getTime() / 1000;
    if (sendTimestamp <= Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ error: 'Send time must be in the future' });
    }

    const scheduledId = await ScheduledSend.create({
      user_id: req.userId,
      contact_id: contactId,
      message,
      tone: tone || 'pro',
      send_at: sendTimestamp,
      status: 'pending'
    });

    res.json({
      success: true,
      scheduled: {
        id: scheduledId,
        sendAt: sendAt,
        contact: { name: contact.name, email: contact.email }
      }
    });
  } catch (error) {
    console.error('Schedule email error:', error);
    res.status(500).json({ error: 'Failed to schedule email' });
  }
};

export const getScheduledSends = async (req, res) => {
  try {
    const scheduled = await ScheduledSend.findByUserId(req.userId);
    res.json({ scheduled });
  } catch (error) {
    console.error('Get scheduled sends error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled sends' });
  }
};

export const deleteScheduledSend = async (req, res) => {
  try {
    const { id } = req.params;
    await ScheduledSend.delete(id, req.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete scheduled send error:', error);
    res.status(500).json({ error: 'Failed to delete scheduled send' });
  }
};

export const getRelanceHistory = async (req, res) => {
  try {
    const history = await Relance.findByUserId(req.userId, 50);
    res.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};