import { useState, useEffect, useCallback, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: number | null;
}

export const useNetworkDetector = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    wasOffline: false,
    offlineSince: null,
  });
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
      // Ping Supabase health endpoint to verify real connectivity
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`https://fctarpegeatdizeuzzyb.supabase.co/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdGFycGVnZWF0ZGl6ZXV6enliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTUwNTgsImV4cCI6MjA2ODQzMTA1OH0.uLx4ezEifb790eY3VqLuUyGTi6js3MTRio0yXZCvsI0' }
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      const reallyOnline = await checkConnectivity();
      if (reallyOnline) {
        setStatus(prev => ({ isOnline: true, wasOffline: true, offlineSince: null }));
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({
        isOnline: false,
        wasOffline: prev.wasOffline,
        offlineSince: prev.offlineSince || Date.now(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check every 10 seconds
    pingIntervalRef.current = setInterval(async () => {
      const online = await checkConnectivity();
      setStatus(prev => {
        if (online && !prev.isOnline) {
          return { isOnline: true, wasOffline: true, offlineSince: null };
        }
        if (!online && prev.isOnline) {
          return { isOnline: false, wasOffline: prev.wasOffline, offlineSince: Date.now() };
        }
        return prev;
      });
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [checkConnectivity]);

  const getOfflineDuration = useCallback(() => {
    if (!status.offlineSince) return 0;
    return Math.floor((Date.now() - status.offlineSince) / 1000);
  }, [status.offlineSince]);

  return { ...status, getOfflineDuration };
};
