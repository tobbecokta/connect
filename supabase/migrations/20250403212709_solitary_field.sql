/*
  # Create phone numbers table

  1. New Tables
    - `phone_numbers`
      - `id` (uuid, primary key)
      - `number` (text, unique) - E.164 format phone number
      - `device` (text) - device name for display
      - `is_default` (boolean) - whether this is the default phone number
      - `created_at` (timestamp)
      - `user_id` (uuid) - reference to the auth user
  2. Security
    - Enable RLS on `phone_numbers` table
    - Add policy for authenticated users to manage their own phone numbers
*/

CREATE TABLE IF NOT EXISTS phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  device text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS phone_numbers_number_idx ON phone_numbers(number);

ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own phone numbers"
  ON phone_numbers
  USING (auth.uid() = user_id);