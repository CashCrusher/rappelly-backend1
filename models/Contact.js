import { supabase } from '../config/supabase.js';

export const Contact = {
  create: async (userId, contactData) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        user_id: userId,
        name: contactData.name,
        email: contactData.email,
        last_contacted_at: contactData.last_contacted_at || null,
        interaction_count: contactData.interaction_count || 0,
        priority: contactData.priority || 0,
        notes: contactData.notes || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  },

  upsert: async (userId, contactData) => {
    const { error } = await supabase
      .from('contacts')
      .upsert({
        user_id: userId,
        name: contactData.name,
        email: contactData.email,
        last_contacted_at: contactData.last_contacted_at || null,
        interaction_count: contactData.interaction_count || 0
      }, {
        onConflict: 'user_id,email'
      });
    
    if (error) throw error;
  },

  findByUserId: async (userId) => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_ignored', false)
      .order('last_contacted_at', { ascending: true });
    
    return data || [];
  },

  findById: async (contactId, userId) => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single();
    
    return data;
  },

  getTop5: async (userId) => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_ignored', false)
      .order('priority', { ascending: false })
      .order('last_contacted_at', { ascending: true, nullsFirst: false })
      .limit(5);
    
    return data || [];
  },

  updateLastContacted: async (contactId, userId) => {
    const now = Math.floor(Date.now() / 1000);
    const { error } = await supabase
      .from('contacts')
      .update({
        last_contacted_at: now,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  toggleIgnore: async (contactId, userId) => {
    const contact = await Contact.findById(contactId, userId);
    const { error } = await supabase
      .from('contacts')
      .update({
        is_ignored: !contact.is_ignored,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};