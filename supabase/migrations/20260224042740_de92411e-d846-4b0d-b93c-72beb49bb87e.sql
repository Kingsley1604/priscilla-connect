
-- Add chat message validation trigger for message length and filename length
CREATE OR REPLACE FUNCTION public.validate_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF LENGTH(NEW.content) > 10000 THEN
    RAISE EXCEPTION 'Message content too long (max 10000 characters)';
  END IF;
  
  IF NEW.file_name IS NOT NULL AND LENGTH(NEW.file_name) > 255 THEN
    RAISE EXCEPTION 'Filename too long (max 255 characters)';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_chat_message_trigger
BEFORE INSERT OR UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_chat_message();

CREATE TRIGGER validate_group_chat_message_trigger
BEFORE INSERT OR UPDATE ON public.chat_group_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_chat_message();
