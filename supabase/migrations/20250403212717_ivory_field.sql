/*
  # Create conversations table

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `contact_id` (uuid) - reference to contacts table
      - `phone_id` (uuid) - reference to phone_numbers table
      - `last_message` (text) - last message in conversation
      - `last_message_time` (timestamp) - time of last message
      - `unread_count` (integer) - number of unread messages
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid) - reference to the auth user
  2. Security
    - Enable RLS on `conversations` table
    - Add policy for authenticated users to manage their own conversations
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  phone_id uuid REFERENCES phone_numbers(id) ON DELETE SET NULL,
  last_message text,
  last_message_time timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS conversations_contact_id_idx ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS conversations_phone_id_idx ON conversations(phone_id);
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
  ON conversations
  USING (auth.uid() = user_id);