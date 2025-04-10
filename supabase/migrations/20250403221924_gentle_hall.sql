/*
  # Remove auth dependencies

  1. Changes
    - Drop all tables and recreate them without auth.users references
    - Remove RLS policies that use auth.uid()
    - Recreate triggers and functions
*/

-- First drop all existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS bulk_campaigns;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS phone_numbers;

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_conversation_on_message CASCADE;

-- Recreate tables without auth references

-- Phone Numbers
CREATE TABLE IF NOT EXISTS phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  device text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone_number text NOT NULL,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_phone_number_idx ON contacts(phone_number);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  phone_id uuid REFERENCES phone_numbers(id) ON DELETE SET NULL,
  last_message text,
  last_message_time timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_contact_id_idx ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS conversations_phone_id_idx ON conversations(phone_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('me', 'them')),
  text text NOT NULL,
  time timestamptz DEFAULT now(),
  status text CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  is_automated boolean DEFAULT false,
  api_source text,
  external_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_external_id_idx ON messages(external_id);

-- Bulk Campaigns
CREATE TABLE IF NOT EXISTS bulk_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template text NOT NULL,
  recipient_count integer DEFAULT 0,
  status text CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  phone_id uuid REFERENCES phone_numbers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS bulk_campaigns_phone_id_idx ON bulk_campaigns(phone_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_contacts
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_timestamp_conversations
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Function to update conversation last_message and last_message_time
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.text,
    last_message_time = NEW.time,
    -- Increment unread_count only if the message is from 'them'
    unread_count = CASE WHEN NEW.sender = 'them' THEN unread_count + 1 ELSE unread_count END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation
CREATE TRIGGER update_conversation_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- Insert a default phone number for the application
INSERT INTO phone_numbers (number, device, is_default)
VALUES ('+46766866251', 'Default Device', true);