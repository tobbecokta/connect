-- Create a table to track recipients who have opted out of receiving messages
CREATE TABLE IF NOT EXISTS bulk_sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_number TEXT NOT NULL,
  sender_phone_id UUID NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'STOP_REQUEST', 'STOP_REPLY', 'MANUALLY_ADDED', 'COMPLIANCE', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure we don't have duplicate entries for the same recipient/sender combination
  UNIQUE(recipient_number, sender_phone_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS bulk_sms_opt_outs_recipient_idx ON bulk_sms_opt_outs(recipient_number);
CREATE INDEX IF NOT EXISTS bulk_sms_opt_outs_sender_idx ON bulk_sms_opt_outs(sender_phone_id);

-- Function to automatically add opt-out records when receiving a STOPP text
CREATE OR REPLACE FUNCTION process_stop_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an incoming message (from "them") that contains "STOPP" or "STOP"
  IF NEW.sender = 'them' AND (
     NEW.text ILIKE '%STOPP%' OR 
     NEW.text ILIKE '%STOP%'
  ) THEN
    -- Get the phone_id for this conversation
    DECLARE
      phone_id UUID;
    BEGIN
      SELECT conversations.phone_id INTO phone_id
      FROM conversations
      WHERE conversations.id = NEW.conversation_id;
      
      IF phone_id IS NOT NULL THEN
        -- Add an opt-out record
        INSERT INTO bulk_sms_opt_outs (
          recipient_number,
          sender_phone_id,
          reason
        )
        SELECT 
          contacts.phone_number,
          phone_id,
          'STOP_REPLY'
        FROM conversations
        JOIN contacts ON contacts.id = conversations.contact_id
        WHERE conversations.id = NEW.conversation_id
        ON CONFLICT (recipient_number, sender_phone_id) DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically process STOPP messages
CREATE TRIGGER process_stop_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION process_stop_message(); 