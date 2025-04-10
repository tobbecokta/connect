/*
  # Add bulk SMS fields to messages table

  This migration adds:
  - is_bulk: to flag messages sent via the bulk SMS feature
  - bulk_campaign_id: foreign key to the bulk_campaigns table
  - bulk_campaign_name: denormalized name of the campaign for easier queries
*/

-- Add columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_bulk BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS bulk_campaign_id UUID REFERENCES bulk_campaigns(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS bulk_campaign_name TEXT;

-- Create index on bulk_campaign_id
CREATE INDEX IF NOT EXISTS messages_bulk_campaign_id_idx ON messages(bulk_campaign_id);

-- Update database functions to handle bulk SMS
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.text,
    last_message_time = NEW.time,
    -- Increment unread_count only if the message is from 'them'
    unread_count = CASE WHEN NEW.sender = 'them' THEN unread_count + 1 ELSE unread_count END,
    -- Add bulk SMS flags
    is_bulk = COALESCE(NEW.is_bulk, FALSE),
    bulk_campaign_name = NEW.bulk_campaign_name
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add columns to conversations table to track bulk SMS
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_bulk BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS bulk_campaign_name TEXT; 