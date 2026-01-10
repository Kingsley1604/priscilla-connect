import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLoginNotification = () => {
  // Helper to send email notification via edge function
  const sendEmailNotification = async (type: 'login' | 'signup' | 'order', subject: string, message: string, details?: Record<string, string>) => {
    try {
      await supabase.functions.invoke('send-email-notification', {
        body: {
          type,
          recipientType: 'super_admin',
          subject,
          message,
          details
        }
      });
    } catch {
      // Silent fail - email is optional enhancement
    }
  };

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

      // Task I: Send email notification for login
      await sendEmailNotification('login', 'User Login Detected', `${userName} has logged in to Priscilla Connect`, {
        'User Name': userName,
        'Device': device,
        'Browser': browser,
        'Location': location,
        'IP Address': ipAddress,
        'Login Time': new Date().toLocaleString()
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

      // Task I: Send email notification for signup
      await sendEmailNotification('signup', 'New User Signup', `${userName} has created an account on Priscilla Connect`, {
        'User Name': userName,
        'Email': email,
        'Device': device,
        'Browser': browser,
        'Location': location,
        'IP Address': ipAddress,
        'Signup Time': new Date().toLocaleString()
      });
    } catch (error) {
      // Silent fail
      if (import.meta.env.DEV) {
        console.error('Error sending signup notification:', error);
      }
    }
  }, []);

  // Task J: Send order notification (for admins)
  const sendOrderNotification = useCallback(async (orderId: string, customerName: string, totalAmount: number, itemCount: number) => {
    try {
      const message = `${customerName} placed an order (${itemCount} items) for ₦${totalAmount.toLocaleString()}`;
      
      // Insert to admin_notifications
      await supabase.from('admin_notifications').insert({
        title: '🛒 New Store Order',
        message: message,
        type: 'order',
        related_order_id: orderId
      });

      // Send email notification
      await sendEmailNotification('order', 'New Store Order Placed', message, {
        'Customer': customerName,
        'Order ID': orderId.slice(0, 8) + '...',
        'Items': itemCount.toString(),
        'Total Amount': `₦${totalAmount.toLocaleString()}`,
        'Order Time': new Date().toLocaleString()
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error sending order notification:', error);
      }
    }
  }, []);

  return { sendLoginNotification, sendSignupNotification, sendOrderNotification };
};
