import { supabase } from '../config/supabase.js';

export const User = {
  create: async (userData) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        name: userData.name,
        google_id: userData.google_id,
        access_token: userData.access_token,
        refresh_token: userData.refresh_token,
        token_expiry: userData.token_expiry
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  },

  findByEmail: async (email) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    return data;
  },

  findByGoogleId: async (googleId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();
    return data;
  },

  findById: async (id) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  },

  updateTokens: async (userId, accessToken, refreshToken, tokenExpiry) => {
    const { error } = await supabase
      .from('users')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  updateSettings: async (userId, settings) => {
    const { error } = await supabase
      .from('users')
      .update({
        default_tone: settings.default_tone,
        relance_frequency: settings.relance_frequency,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  }
};