-- Create a table to track campaign replies
CREATE TABLE IF NOT EXISTS campaign_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES bulk_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  first_reply_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  was_opted_out BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure we don't have duplicate entries for the same campaign/contact
  UNIQUE(campaign_id, contact_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS campaign_replies_campaign_id_idx ON campaign_replies(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_replies_contact_id_idx ON campaign_replies(contact_id);
CREATE INDEX IF NOT EXISTS campaign_replies_conversation_id_idx ON campaign_replies(conversation_id);

-- Function to check if a contact has replied to a campaign
CREATE OR REPLACE FUNCTION has_replied_to_campaign(campaign_uuid UUID, contact_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  reply_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM campaign_replies
    WHERE campaign_id = campaign_uuid
    AND contact_id = contact_uuid
  ) INTO reply_exists;
  
  RETURN reply_exists;
END;
$$ LANGUAGE plpgsql;

-- Update the message sender constraint to allow 'system' messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_check;
ALTER TABLE messages ADD CONSTRAINT messages_sender_check CHECK (sender IN ('me', 'them', 'system')); 