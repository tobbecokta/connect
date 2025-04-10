-- Create a table to track SMS delivery status
CREATE TABLE IF NOT EXISTS sms_delivery_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  external_id TEXT, -- The SMS provider's ID (e.g., 46elks message ID)
  recipient_number TEXT NOT NULL,
  campaign_id UUID REFERENCES bulk_campaigns(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- 'pending', 'sent', 'delivered', 'failed', 'retry_failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_status_change TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add indexes for faster lookups
  CONSTRAINT unique_external_id UNIQUE (external_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS sms_delivery_status_message_id_idx ON sms_delivery_status(message_id);
CREATE INDEX IF NOT EXISTS sms_delivery_status_campaign_id_idx ON sms_delivery_status(campaign_id);
CREATE INDEX IF NOT EXISTS sms_delivery_status_recipient_idx ON sms_delivery_status(recipient_number);
CREATE INDEX IF NOT EXISTS sms_delivery_status_status_idx ON sms_delivery_status(status);

-- Create a table to track permanently failed numbers for campaigns
CREATE TABLE IF NOT EXISTS campaign_failed_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES bulk_campaigns(id) ON DELETE CASCADE,
  recipient_number TEXT NOT NULL,
  reason TEXT NOT NULL, -- 'delivery_failed', 'unsubscribed', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure we don't have duplicate entries for the same campaign/number
  UNIQUE(campaign_id, recipient_number)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS campaign_failed_numbers_campaign_id_idx ON campaign_failed_numbers(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_failed_numbers_recipient_idx ON campaign_failed_numbers(recipient_number);

-- Function to record a delivery status change
CREATE OR REPLACE FUNCTION update_message_delivery_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run for status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- If a message fails permanently (after retry), record it in campaign_failed_numbers
  IF NEW.status = 'retry_failed' AND NEW.campaign_id IS NOT NULL THEN
    INSERT INTO campaign_failed_numbers (campaign_id, recipient_number, reason)
    VALUES (NEW.campaign_id, NEW.recipient_number, 'delivery_failed')
    ON CONFLICT (campaign_id, recipient_number) DO NOTHING;
  END IF;

  -- Update the message status in the messages table
  IF NEW.message_id IS NOT NULL THEN
    -- Map our internal status to message status
    DECLARE
      message_status TEXT;
    BEGIN
      CASE NEW.status
        WHEN 'sent' THEN message_status := 'sent';
        WHEN 'delivered' THEN message_status := 'delivered';
        WHEN 'pending' THEN message_status := 'sent';
        WHEN 'failed' THEN message_status := 'failed';
        WHEN 'retry_failed' THEN message_status := 'failed';
        ELSE message_status := 'failed';
      END CASE;
      
      UPDATE messages
      SET status = message_status
      WHERE id = NEW.message_id;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update message status when delivery status changes
CREATE TRIGGER update_message_on_delivery_status_change
AFTER UPDATE ON sms_delivery_status
FOR EACH ROW
EXECUTE FUNCTION update_message_delivery_status();

-- Function to get failed numbers for a campaign
CREATE OR REPLACE FUNCTION get_campaign_failed_numbers(campaign_uuid UUID)
RETURNS TABLE (
  recipient_number TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cfn.recipient_number,
    cfn.reason,
    cfn.created_at
  FROM campaign_failed_numbers cfn
  WHERE cfn.campaign_id = campaign_uuid
  ORDER BY cfn.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get campaign delivery stats
CREATE OR REPLACE FUNCTION get_campaign_delivery_stats(campaign_uuid UUID)
RETURNS TABLE (
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sds.status,
    COUNT(sds.id)::BIGINT
  FROM sms_delivery_status sds
  WHERE sds.campaign_id = campaign_uuid
  GROUP BY sds.status
  ORDER BY sds.status;
END;
$$ LANGUAGE plpgsql; 