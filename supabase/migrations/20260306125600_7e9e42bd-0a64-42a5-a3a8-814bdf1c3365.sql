ALTER TABLE public.accounts 
  ALTER COLUMN current_devices TYPE text 
  USING array_to_string(current_devices, ', ');