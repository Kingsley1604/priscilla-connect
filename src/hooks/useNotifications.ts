import { useCallback } from 'react';

interface NotificationData {
  type: 'login' | 'content_alert' | 'signup';
  message: string;
  userId?: string;
  username?: string;
  device?: string;
  location?: string;
  severity?: 'low' | 'medium' | 'high';
}

export const useNotifications = () => {
  const sendAdminNotification = useCallback((data: NotificationData) => {
    const notification = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
      severity: data.severity || 'medium',
      ...data
    };

    // Dispatch custom event for admin notification system
    window.dispatchEvent(new CustomEvent('admin-notification', { detail: notification }));
  }, []);

  const detectDevice = useCallback(() => {
    const userAgent = navigator.userAgent;
    let device = 'Unknown Device';
    
    if (/Android/i.test(userAgent)) {
      device = 'Android Device';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      device = 'iOS Device';
    } else if (/Windows/i.test(userAgent)) {
      device = 'Windows PC';
    } else if (/Macintosh/i.test(userAgent)) {
      device = 'Mac';
    } else if (/Linux/i.test(userAgent)) {
      device = 'Linux PC';
    }
    
    return device;
  }, []);

  const detectLocation = useCallback(async (): Promise<string> => {
    try {
      // Request geolocation permission
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false
        });
      });

      // For demo purposes, we'll use a mock location service
      // In production, you'd use a proper geolocation API
      const { latitude, longitude } = position.coords;
      return `Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`;
    } catch (error) {
      // If geolocation fails, try to get approximate location from IP
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return `${data.city}, ${data.country_name}`;
      } catch {
        return 'Location unavailable';
      }
    }
  }, []);

  const monitorContent = useCallback((content: string, userId: string, username: string) => {
    const inappropriateKeywords = [
      // Insults
      'stupid', 'idiot', 'dumb', 'loser', 'freak', 'ugly', 'fat', 'retard',
      // Bullying
      'kill yourself', 'nobody likes you', 'you suck', 'worthless', 'pathetic',
      // Sexual content
      'sex', 'sexy', 'porn', 'naked', 'nude', 'breast', 'penis', 'vagina',
      // Fraud
      'scam', 'steal', 'hack', 'password', 'credit card', 'social security'
    ];

    const foundKeywords = inappropriateKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      sendAdminNotification({
        type: 'content_alert',
        message: `User ${username} (${userId}) used inappropriate language: "${foundKeywords.join(', ')}"`,
        userId,
        username,
        severity: 'high'
      });
    }
  }, [sendAdminNotification]);

  return {
    sendAdminNotification,
    detectDevice,
    detectLocation,
    monitorContent
  };
};