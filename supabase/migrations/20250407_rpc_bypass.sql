-- Create RPC function to bypass RLS when inserting messages
CREATE OR REPLACE FUNCTION insert_message_bypass_rls(
  p_conversation_id UUID,
  p_sender TEXT,
  p_text TEXT,
  p_time TIMESTAMPTZ DEFAULT now(),
  p_external_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert message directly with security_definer to bypass RLS
  INSERT INTO messages (
    conversation_id,
    sender,
    text,
    time,
    external_id
  ) VALUES (
    p_conversation_id,
    p_sender,
    p_text,
    p_time,
    p_external_id
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 