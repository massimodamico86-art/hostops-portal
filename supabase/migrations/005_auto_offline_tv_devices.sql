-- Auto-update TV device online status based on last_seen timestamp
-- A device is considered offline if last_seen is older than 5 minutes

-- Create a function to update offline devices
CREATE OR REPLACE FUNCTION public.update_tv_device_status()
RETURNS void AS $$
BEGIN
  -- Mark devices as offline if they haven't been seen in 5 minutes
  UPDATE public.tv_devices
  SET is_online = false
  WHERE is_online = true
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function that TVs can call to ping their status
CREATE OR REPLACE FUNCTION public.ping_tv_device(p_otp TEXT)
RETURNS void AS $$
BEGIN
  -- Update last_seen and set online status
  UPDATE public.tv_devices
  SET last_seen = NOW(),
      is_online = true
  WHERE otp_code = p_otp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_tv_device_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ping_tv_device(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ping_tv_device(TEXT) TO anon;
