import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// SQL pour créer les tables (à exécuter dans Supabase SQL Editor)
export const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry BIGINT,
  default_tone TEXT DEFAULT 'pro',
  relance_frequency TEXT DEFAULT 'weekly',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  last_contacted_at BIGINT,
  interaction_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  is_ignored BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Relances table
CREATE TABLE IF NOT EXISTS relances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  tone TEXT,
  sent_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
  status TEXT DEFAULT 'sent'
);

-- Scheduled sends table
CREATE TABLE IF NOT EXISTS scheduled_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  tone TEXT,
  send_at BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
`;

console.log('✅ Supabase client initialized');