/*
  # Create messages table

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid) - reference to conversations table
      - `sender` (text) - 'me' or 'them'
      - `text` (text) - message content
      - `time` (timestamp) - message time
      - `status` (text) - 'sent', 'delivered', 'read', 'failed'
      - `is_automated` (boolean) - whether message was sent automatically
      - `api_source` (text) - source of automated message
      - `external_id` (text) - ID from 46elks API
      - `created_at` (timestamp)
      - `user_id` (uuid) - reference to the auth user
  2. Security
    - Enable RLS on `messages` table
    - Add policy for authenticated users to manage their own messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('me', 'them')),
  text text NOT NULL,
  time timestamptz DEFAULT now(),
  status text CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  is_automated boolean DEFAULT false,
  api_source text,
  external_id text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_external_id_idx ON messages(external_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own messages"
  ON messages
  USING (auth.uid() = user_id);