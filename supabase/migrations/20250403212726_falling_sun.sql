/*
  # Create bulk campaigns table

  1. New Tables
    - `bulk_campaigns`
      - `id` (uuid, primary key)
      - `name` (text) - campaign name
      - `template` (text) - message template
      - `recipient_count` (integer) - number of recipients
      - `status` (text) - 'draft', 'sending', 'sent', 'failed'
      - `created_at` (timestamp)
      - `sent_at` (timestamp)
      - `phone_id` (uuid) - reference to phone_numbers table
      - `user_id` (uuid) - reference to the auth user
  2. Security
    - Enable RLS on `bulk_campaigns` table
    - Add policy for authenticated users to manage their own campaigns
*/

CREATE TABLE IF NOT EXISTS bulk_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template text NOT NULL,
  recipient_count integer DEFAULT 0,
  status text CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  phone_id uuid REFERENCES phone_numbers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS bulk_campaigns_phone_id_idx ON bulk_campaigns(phone_id);
CREATE INDEX IF NOT EXISTS bulk_campaigns_user_id_idx ON bulk_campaigns(user_id);

ALTER TABLE bulk_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bulk campaigns"
  ON bulk_campaigns
  USING (auth.uid() = user_id);