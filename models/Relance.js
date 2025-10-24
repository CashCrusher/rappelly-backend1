import { supabase } from '../config/supabase.js';

export const Relance = {
  create: async (relanceData) => {
    const { data, error } = await supabase
      .from('relances')
      .insert([{
        user_id: relanceData.user_id,
        contact_id: relanceData.contact_id,
        message: relanceData.message,
        tone: relanceData.tone,
        sent_at: relanceData.sent_at || Math.floor(Date.now() / 1000),
        status: relanceData.status || 'sent'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  },

  findByUserId: async (userId, limit = 50) => {
    const { data } = await supabase
      .from('relances')
      .select(`
        *,
        contacts (name, email)
      `)
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);
    
    return data || [];
  }
};