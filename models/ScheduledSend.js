import { supabase } from '../config/supabase.js';

export const ScheduledSend = {
  create: async (data) => {
    const { data: result, error } = await supabase
      .from('scheduled_sends')
      .insert([{
        user_id: data.user_id,
        contact_id: data.contact_id,
        message: data.message,
        tone: data.tone,
        send_at: data.send_at,
        status: data.status || 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result.id;
  },

  findPendingBefore: async (timestamp) => {
    const { data } = await supabase
      .from('scheduled_sends')
      .select(`
        *,
        users (access_token, refresh_token),
        contacts (email, name)
      `)
      .eq('status', 'pending')
      .lte('send_at', timestamp);
    
    return data || [];
  },

  updateStatus: async (id, status) => {
    const { error } = await supabase
      .from('scheduled_sends')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
  },

  findByUserId: async (userId) => {
    const { data } = await supabase
      .from('scheduled_sends')
      .select(`
        *,
        contacts (name, email)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('send_at', { ascending: true });
    
    return data || [];
  },

  delete: async (id, userId) => {
    const { error } = await supabase
      .from('scheduled_sends')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};