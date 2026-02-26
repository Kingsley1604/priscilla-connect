import { useNetworkDetector } from "@/hooks/useNetworkDetector";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

interface NetworkStatusIndicatorProps {
  onStatusChange?: (isOnline: boolean) => void;
}

const NetworkStatusIndicator = ({ onStatusChange }: NetworkStatusIndicatorProps) => {
  const { isOnline, wasOffline } = useNetworkDetector();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    onStatusChange?.(isOnline);
  }, [isOnline, onStatusChange]);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestored) return null;

  return (
    <div className={`fixed top-2 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-600 text-white' 
        : 'bg-destructive text-destructive-foreground animate-pulse'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          Connection restored
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Network issue detected
        </>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
