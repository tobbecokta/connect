-- Create a table to track bulk SMS opt-outs
CREATE TABLE IF NOT EXISTS bulk_sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_number TEXT NOT NULL,
  sender_phone_id UUID NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add a unique constraint to prevent duplicate opt-outs for the same number/phone combination
  UNIQUE(recipient_number, sender_phone_id)
);

-- Create an index for faster lookups by recipient number
CREATE INDEX IF NOT EXISTS bulk_sms_opt_outs_recipient_idx ON bulk_sms_opt_outs(recipient_number);

-- Create an index for faster lookups by sender phone ID
CREATE INDEX IF NOT EXISTS bulk_sms_opt_outs_sender_idx ON bulk_sms_opt_outs(sender_phone_id);

-- Add a trigger to automatically process STOPP messages
CREATE OR REPLACE FUNCTION process_stopp_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an incoming message with STOPP/STOP
  IF NEW.sender = 'them' AND 
     (NEW.text ILIKE '%STOPP%' OR NEW.text ILIKE '%STOP%') THEN
    
    -- Get the conversation details to find the phone_id
    DECLARE
      phone_id UUID;
    BEGIN
      SELECT c.phone_id INTO phone_id
      FROM conversations c
      WHERE c.id = NEW.conversation_id;
      
      IF FOUND THEN
        -- Insert an opt-out record
        INSERT INTO bulk_sms_opt_outs (recipient_number, sender_phone_id, reason)
        SELECT co.phone_number, phone_id, 'STOP_MESSAGE'
        FROM conversations c
        JOIN contacts co ON c.contact_id = co.id
        WHERE c.id = NEW.conversation_id
        ON CONFLICT (recipient_number, sender_phone_id) DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the messages table
DROP TRIGGER IF EXISTS check_stopp_messages ON messages;
CREATE TRIGGER check_stopp_messages
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION process_stopp_messages();

-- Add a function to find recipients who've replied to a campaign
CREATE OR REPLACE FUNCTION get_campaign_replies(campaign_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  contact_phone_number TEXT,
  phone_id UUID,
  has_opted_out BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH campaign_messages AS (
    -- Get all messages from this campaign
    SELECT 
      m.conversation_id,
      m.created_at as campaign_sent_time
    FROM messages m
    WHERE m.bulk_campaign_id = campaign_id
  ),
  replies AS (
    -- Find replies to those messages
    SELECT 
      cm.conversation_id,
      COUNT(*) > 0 AS has_replies,
      bool_or(m.text ILIKE '%STOPP%' OR m.text ILIKE '%STOP%') AS has_opt_out
    FROM campaign_messages cm
    JOIN messages m ON m.conversation_id = cm.conversation_id
    WHERE 
      m.sender = 'them' AND 
      m.created_at > cm.campaign_sent_time
    GROUP BY cm.conversation_id
  )
  SELECT 
    r.conversation_id,
    c.phone_number AS contact_phone_number,
    con.phone_id,
    r.has_opt_out AS has_opted_out
  FROM replies r
  JOIN conversations con ON r.conversation_id = con.id
  JOIN contacts c ON con.contact_id = c.id
  WHERE r.has_replies = true;
END;
$$ LANGUAGE plpgsql; 