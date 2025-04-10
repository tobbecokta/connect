-- Find messages with bulk_campaign_name but no bulk_campaign_id
CREATE OR REPLACE FUNCTION fix_campaign_messages() RETURNS VOID AS $$
DECLARE
    msg RECORD;
    campaign_id UUID;
BEGIN
    -- Loop through messages that have a campaign name but no campaign ID
    FOR msg IN 
        SELECT m.id, m.bulk_campaign_name 
        FROM messages m 
        WHERE m.is_bulk = true 
        AND m.bulk_campaign_name IS NOT NULL 
        AND m.bulk_campaign_id IS NULL
    LOOP
        -- Find the campaign with matching name
        SELECT id INTO campaign_id 
        FROM bulk_campaigns 
        WHERE name = msg.bulk_campaign_name
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- If found, update the message
        IF campaign_id IS NOT NULL THEN
            UPDATE messages 
            SET bulk_campaign_id = campaign_id
            WHERE id = msg.id;
            
            RAISE NOTICE 'Updated message % with campaign ID %', msg.id, campaign_id;
        END IF;
    END LOOP;
    
    -- Also ensure that messages with bulk_campaign_id also have is_bulk=true
    UPDATE messages
    SET is_bulk = true
    WHERE bulk_campaign_id IS NOT NULL
    AND is_bulk = false;
END;
$$ LANGUAGE plpgsql;

-- Run the fix
SELECT fix_campaign_messages();

-- Create a trigger to ensure future messages with campaign_id have is_bulk set to true
CREATE OR REPLACE FUNCTION ensure_bulk_flag() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bulk_campaign_id IS NOT NULL AND NEW.is_bulk IS FALSE THEN
        NEW.is_bulk := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_bulk_message_flag
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION ensure_bulk_flag(); 