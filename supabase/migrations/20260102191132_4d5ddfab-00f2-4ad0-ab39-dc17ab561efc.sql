-- Add sector column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'primary';

-- Add is_deleted column for soft delete on messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  is_read BOOLEAN DEFAULT false,
  is_deleted_by_sender BOOLEAN DEFAULT false,
  is_deleted_by_receiver BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
CREATE POLICY "Users can view their own messages"
ON public.chat_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create missed calls table
CREATE TABLE IF NOT EXISTS public.missed_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'audio',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_seen BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.missed_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for missed calls
CREATE POLICY "Users can view their missed calls"
ON public.missed_calls
FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create missed calls"
ON public.missed_calls
FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their missed calls"
ON public.missed_calls
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missed_calls;