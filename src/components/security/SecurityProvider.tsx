import { useEffect } from 'react';

interface SecurityProviderProps {
  children: React.ReactNode;
}

const SecurityProvider = ({ children }: SecurityProviderProps) => {
  useEffect(() => {
    // Content Security Policy (CSP) headers - would be better implemented at server level
    const setSecurityHeaders = () => {
      // Remove any existing meta tags for CSP
      const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (existingCSP) {
        existingCSP.remove();
      }

      // Add CSP meta tag (for development - in production, set via HTTP headers)
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for React development
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow inline styles and Google Fonts
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://images.unsplash.com https:", // Allow Unsplash images
        "connect-src 'self' https:",
        "frame-ancestors 'none'", // Prevent clickjacking
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      
      document.head.appendChild(cspMeta);

      // Add X-Frame-Options meta tag
      const frameOptionsMeta = document.createElement('meta');
      frameOptionsMeta.httpEquiv = 'X-Frame-Options';
      frameOptionsMeta.content = 'DENY';
      document.head.appendChild(frameOptionsMeta);

      // Add X-Content-Type-Options meta tag
      const contentTypeMeta = document.createElement('meta');
      contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
      contentTypeMeta.content = 'nosniff';
      document.head.appendChild(contentTypeMeta);

      // Add Referrer Policy meta tag
      const referrerMeta = document.createElement('meta');
      referrerMeta.name = 'referrer';
      referrerMeta.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(referrerMeta);

      // Add Permissions Policy meta tag
      const permissionsMeta = document.createElement('meta');
      permissionsMeta.httpEquiv = 'Permissions-Policy';
      permissionsMeta.content = 'camera=(), microphone=(), geolocation=(), payment=()';
      document.head.appendChild(permissionsMeta);
    };

    // Prevent right-click context menu in production (optional security measure)
    const handleContextMenu = (e: MouseEvent) => {
      if (import.meta.env.PROD) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent F12, Ctrl+Shift+I, Ctrl+U in production (optional)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (import.meta.env.PROD) {
        // F12
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+Shift+I (Dev Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
          e.preventDefault();
          return false;
        }
      }
    };

    // Apply security measures
    setSecurityHeaders();
    
    // Add event listeners (only in production)
    if (import.meta.env.PROD) {
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup
    return () => {
      if (import.meta.env.PROD) {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  // Console warning for production
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        '%cPriscilla Connect - Secure School Management System',
        'color: #1e40af; font-size: 24px; font-weight: bold;'
      );
      console.log(
        '%cUnauthorized access is prohibited. All activities are logged.',
        'color: #dc2626; font-size: 14px; font-weight: bold;'
      );
    }
  }, []);

  return <>{children}</>;
};

export default SecurityProvider;