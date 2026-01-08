import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLoginNotification = () => {
  const sendLoginNotification = useCallback(async (userId: string, userName: string) => {
    try {
      // Detect device
      const userAgent = navigator.userAgent;
      let device = 'Unknown Device';
      if (/Android/i.test(userAgent)) device = 'Android Device';
      else if (/iPhone|iPad|iPod/i.test(userAgent)) device = 'iOS Device';
      else if (/Windows/i.test(userAgent)) device = 'Windows PC';
      else if (/Macintosh/i.test(userAgent)) device = 'Mac';
      else if (/Linux/i.test(userAgent)) device = 'Linux PC';

      // Get approximate location from IP
      let location = 'Location unavailable';
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        const data = await response.json();
        if (data.city && data.country_name) {
          location = `${data.city}, ${data.country_name}`;
        }
      } catch {
        // Location unavailable
      }

      // Insert notification to admin_notifications table
      await supabase.from('admin_notifications').insert({
        title: 'User Login',
        message: `${userName} logged in from ${device} at ${location}. Time: ${new Date().toLocaleString()}`,
        type: 'login'
      });
    } catch (error) {
      // Silent fail - don't block login for notification errors
      if (import.meta.env.DEV) {
        console.error('Error sending login notification:', error);
      }
    }
  }, []);

  const sendSignupNotification = useCallback(async (userId: string, userName: string, email: string) => {
    try {
      // Detect device
      const userAgent = navigator.userAgent;
      let device = 'Unknown Device';
      if (/Android/i.test(userAgent)) device = 'Android Device';
      else if (/iPhone|iPad|iPod/i.test(userAgent)) device = 'iOS Device';
      else if (/Windows/i.test(userAgent)) device = 'Windows PC';
      else if (/Macintosh/i.test(userAgent)) device = 'Mac';
      else if (/Linux/i.test(userAgent)) device = 'Linux PC';

      // Get approximate location from IP
      let location = 'Location unavailable';
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        const data = await response.json();
        if (data.city && data.country_name) {
          location = `${data.city}, ${data.country_name}`;
        }
      } catch {
        // Location unavailable
      }

      // Insert notification to admin_notifications table
      await supabase.from('admin_notifications').insert({
        title: 'New User Signup',
        message: `${userName} (${email}) created an account from ${device} at ${location}. Time: ${new Date().toLocaleString()}`,
        type: 'signup'
      });
    } catch (error) {
      // Silent fail
      if (import.meta.env.DEV) {
        console.error('Error sending signup notification:', error);
      }
    }
  }, []);

  return { sendLoginNotification, sendSignupNotification };
};
