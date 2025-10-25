import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Vérifier si c'est un token Supabase (commence par "eyJ")
    if (token.startsWith('eyJ')) {
      // Décoder le token sans vérification (Supabase le vérifie déjà)
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.sub) {
        return res.status(403).json({ error: 'Invalid Supabase token' });
      }

      // Chercher ou créer l'utilisateur
      let user = await User.findByEmail(decoded.email);
      
      if (!user) {
        // Créer l'utilisateur Supabase dans notre DB
        const userId = await User.create({
          email: decoded.email,
          name: decoded.user_metadata?.name || decoded.email.split('@')[0],
          google_id: null,
          access_token: token,
          refresh_token: null,
          token_expiry: decoded.exp
        });
        user = await User.findById(userId);
      }

      req.userId = user.id;
      req.userEmail = decoded.email;
      next();
    } else {
      // Token JWT classique (Google OAuth)
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid token' });
        }
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Token verification failed' });
  }
};