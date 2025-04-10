/*
  # Update existing bulk SMS messages
  
  This migration retroactively updates existing messages that were sent via bulk SMS
  but don't have the is_bulk flag set because they were sent before the feature was implemented.
*/

-- First, find all bulk campaigns
WITH bulk_campaigns AS (
  SELECT id, name, phone_id, created_at 
  FROM bulk_campaigns
)

-- Update messages that are likely part of bulk campaigns
UPDATE messages
SET 
  is_bulk = TRUE,
  bulk_campaign_name = bc.name,
  bulk_campaign_id = bc.id
FROM bulk_campaigns bc
JOIN conversations c ON c.phone_id = bc.phone_id
WHERE 
  messages.conversation_id = c.id
  AND messages.sender = 'me'
  -- Only update messages sent around the same time as the bulk campaign
  AND messages.time BETWEEN 
    (SELECT MIN(bc.created_at) FROM bulk_campaigns bc) - INTERVAL '1 hour'
    AND (SELECT MAX(bc.created_at) FROM bulk_campaigns bc) + INTERVAL '1 hour';

-- Update conversations to show they have bulk messages
UPDATE conversations
SET 
  is_bulk = TRUE,
  bulk_campaign_name = (
    SELECT bulk_campaign_name 
    FROM messages 
    WHERE messages.conversation_id = conversations.id AND is_bulk = TRUE
    LIMIT 1
  )
WHERE id IN (
  SELECT DISTINCT conversation_id 
  FROM messages 
  WHERE is_bulk = TRUE
);

-- Output counts for verification
SELECT 'Bulk SMS messages updated: ' || COUNT(*)::text AS result FROM messages WHERE is_bulk = TRUE;
SELECT 'Conversations with bulk SMS: ' || COUNT(*)::text AS result FROM conversations WHERE is_bulk = TRUE; 