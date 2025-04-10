/*
  # Create contacts table

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text) - contact name
      - `phone_number` (text) - E.164 format phone number
      - `avatar` (text) - URL to avatar image
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid) - reference to the auth user
  2. Security
    - Enable RLS on `contacts` table
    - Add policy for authenticated users to manage their own contacts
*/

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone_number text NOT NULL,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS contacts_phone_number_idx ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contacts"
  ON contacts
  USING (auth.uid() = user_id);