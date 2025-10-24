import { User } from '../models/User.js';

export const getSettings = (req, res) => {
  try {
    const user = User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      settings: {
        defaultTone: user.default_tone,
        relanceFrequency: user.relance_frequency
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = (req, res) => {
  try {
    const { defaultTone, relanceFrequency } = req.body;

    if (!defaultTone || !relanceFrequency) {
      return res.status(400).json({ error: 'Default tone and frequency required' });
    }

    const validTones = ['formal', 'pro', 'friendly'];
    const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];

    if (!validTones.includes(defaultTone)) {
      return res.status(400).json({ error: 'Invalid tone' });
    }

    if (!validFrequencies.includes(relanceFrequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }

    User.updateSettings(req.userId, {
      default_tone: defaultTone,
      relance_frequency: relanceFrequency
    });

    res.json({
      success: true,
      settings: {
        defaultTone,
        relanceFrequency
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const disconnectGmail = (req, res) => {
  try {
    // Clear tokens
    User.updateTokens(req.userId, null, null, null);

    res.json({
      success: true,
      message: 'Gmail disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
};