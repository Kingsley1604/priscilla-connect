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

      // Get browser info
      let browser = 'Unknown Browser';
      if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
      else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
      else if (/Edg/i.test(userAgent)) browser = 'Edge';
      else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera';

      // Get IP and location info
      let location = 'Location unavailable';
      let ipAddress = 'IP unavailable';
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        const data = await response.json();
        if (data.ip) ipAddress = data.ip;
        if (data.city && data.country_name) {
          location = `${data.city}, ${data.region || ''}, ${data.country_name}`.replace(', ,', ',');
        }
      } catch {
        // Location/IP unavailable - continue anyway
      }

      // Insert notification to admin_notifications table for super admin
      const message = `${userName} logged in.\n📱 Device: ${device}\n🌐 Browser: ${browser}\n📍 Location: ${location}\n🔗 IP: ${ipAddress}\n⏰ Time: ${new Date().toLocaleString()}`;
      
      await supabase.from('admin_notifications').insert({
        title: '🔐 User Login',
        message: message,
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

      // Get browser info
      let browser = 'Unknown Browser';
      if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
      else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
      else if (/Edg/i.test(userAgent)) browser = 'Edge';
      else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera';

      // Get IP and location info
      let location = 'Location unavailable';
      let ipAddress = 'IP unavailable';
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        const data = await response.json();
        if (data.ip) ipAddress = data.ip;
        if (data.city && data.country_name) {
          location = `${data.city}, ${data.region || ''}, ${data.country_name}`.replace(', ,', ',');
        }
      } catch {
        // Location/IP unavailable
      }

      // Insert notification to admin_notifications table for super admin
      const message = `${userName} (${email}) created an account.\n📱 Device: ${device}\n🌐 Browser: ${browser}\n📍 Location: ${location}\n🔗 IP: ${ipAddress}\n⏰ Time: ${new Date().toLocaleString()}`;
      
      await supabase.from('admin_notifications').insert({
        title: '🆕 New User Signup',
        message: message,
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
