import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export const getAuthUrl = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ authUrl });
};

export const handleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }

  try {
    // Get tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Check if user exists
    let user = User.findByGoogleId(userInfo.id);

    const tokenExpiry = Math.floor(Date.now() / 1000) + (tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600);

    if (user) {
      // Update tokens
      User.updateTokens(user.id, tokens.access_token, tokens.refresh_token, tokenExpiry);
      user = User.findById(user.id);
    } else {
      // Create new user
      const userId = User.create({
        email: userInfo.email,
        name: userInfo.name,
        google_id: userInfo.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry
      });
      user = User.findById(userId);
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${jwtToken}`);
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
};

export const verifyToken = (req, res) => {
  const user = User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      defaultTone: user.default_tone,
      relanceFrequency: user.relance_frequency
    }
  });
};