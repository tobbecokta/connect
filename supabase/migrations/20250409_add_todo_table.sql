-- Add Todo table and related functions
-- This migration adds support for Todo items associated with conversations

-- Create the todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS todos_conversation_id_idx ON public.todos(conversation_id);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON public.todos(completed);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON public.todos(due_date);

-- Add RLS policies
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Allow read access to todos
CREATE POLICY "Allow read access to todos" ON public.todos
  FOR SELECT USING (true);

-- Allow insert access to todos
CREATE POLICY "Allow insert access to todos" ON public.todos
  FOR INSERT WITH CHECK (true);

-- Allow update access to todos
CREATE POLICY "Allow update access to todos" ON public.todos
  FOR UPDATE USING (true);

-- Allow delete access to todos
CREATE POLICY "Allow delete access to todos" ON public.todos
  FOR DELETE USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add function to get todos for a conversation
CREATE OR REPLACE FUNCTION public.get_conversation_todos(p_conversation_id UUID)
RETURNS SETOF public.todos AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.todos
  WHERE conversation_id = p_conversation_id
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql; 