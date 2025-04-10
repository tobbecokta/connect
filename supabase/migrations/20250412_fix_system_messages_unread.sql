-- Fix issue with unread message counters for automated messages
-- This prevents automated notification messages from automatically increasing the unread count

-- Create a function that will handle message insertion
CREATE OR REPLACE FUNCTION handle_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run this for automated messages
  IF NEW.is_automated = TRUE THEN
    -- Do not update the unread count for automated messages
    -- by immediately setting it back to its previous value
    UPDATE conversations
    SET last_message = NEW.text,
        last_message_time = NEW.time,
        -- Get the current unread count directly from the table
        unread_count = (SELECT unread_count FROM conversations WHERE id = NEW.conversation_id)
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS fix_unread_count_for_automated_messages ON messages;
CREATE TRIGGER fix_unread_count_for_automated_messages
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.is_automated = TRUE)
EXECUTE FUNCTION handle_message_insert();

-- Add a comment explaining this fix
COMMENT ON TRIGGER fix_unread_count_for_automated_messages ON messages IS 
'Prevents automated messages from incrementing the unread count, fixing the bug where system notifications cause incorrect unread counts.'; 