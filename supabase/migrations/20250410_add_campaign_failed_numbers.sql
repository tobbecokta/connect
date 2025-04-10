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