/**
 * Security utilities for Priscilla Connect
 * Implements input validation, XSS protection, and data sanitization
 */

// Input validation utilities
export const validateInput = {
  // Validate email format
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Validate student/teacher ID format
  schoolId: (id: string): boolean => {
    const idRegex = /^[A-Z0-9]{6,12}$/;
    return idRegex.test(id);
  },

  // Validate name fields (no special characters except hyphens and apostrophes)
  name: (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
    return nameRegex.test(name);
  },

  // Validate role
  role: (role: string): boolean => {
    return ['student', 'teacher', 'admin'].includes(role);
  },

  // Validate phone number
  phone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  }
};

// XSS Prevention - HTML sanitization
export const sanitizeHtml = (input: string): string => {
  // Basic HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Input sanitization for different contexts
export const sanitizeInput = {
  // For display purposes - basic XSS protection
  display: (input: string): string => {
    return sanitizeHtml(input.trim()).substring(0, 1000);
  },

  // For search queries - additional restrictions
  search: (input: string): string => {
    return input
      .trim()
      .replace(/[<>'"&]/g, '')
      .substring(0, 100);
  },

  // For user names - strict alphanumeric + basic chars
  username: (input: string): string => {
    return input
      .trim()
      .replace(/[^a-zA-Z0-9\s\-']/g, '')
      .substring(0, 50);
  }
};

// Session security utilities
export const sessionSecurity = {
  // Generate secure session token
  generateSessionId: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Validate session timeout (15 minutes)
  isSessionValid: (lastActivity: number): boolean => {
    const sessionTimeout = 15 * 60 * 1000; // 15 minutes in ms
    return Date.now() - lastActivity < sessionTimeout;
  },

  // Create secure session data
  createSession: (userId: string, role: string) => {
    return {
      sessionId: sessionSecurity.generateSessionId(),
      userId: sanitizeInput.username(userId),
      role: validateInput.role(role) ? role : 'student',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isValid: true
    };
  }
};

// Content Security Policy helpers
export const cspHelpers = {
  // Safe inline styles hash generator (for CSP)
  generateStyleHash: (style: string): string => {
    // In a real implementation, you'd use crypto.subtle.digest
    // For now, returning a placeholder
    return 'sha256-placeholder';
  }
};

// Rate limiting utilities (for production)
export const rateLimiting = {
  // Track login attempts
  loginAttempts: new Map<string, { count: number; lastAttempt: number }>(),
  
  // Check if user is rate limited
  isRateLimited: (identifier: string, maxAttempts: number = 5): boolean => {
    const attempts = rateLimiting.loginAttempts.get(identifier);
    if (!attempts) return false;
    
    // Reset if last attempt was over 1 hour ago
    if (Date.now() - attempts.lastAttempt > 3600000) {
      rateLimiting.loginAttempts.delete(identifier);
      return false;
    }
    
    return attempts.count >= maxAttempts;
  },

  // Record login attempt
  recordAttempt: (identifier: string): void => {
    const current = rateLimiting.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    rateLimiting.loginAttempts.set(identifier, {
      count: current.count + 1,
      lastAttempt: Date.now()
    });
  }
};

// Audit logging
export const auditLog = {
  log: (event: string, userId: string, details?: any): void => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: sanitizeInput.display(event),
      userId: sanitizeInput.username(userId),
      details: details ? sanitizeInput.display(JSON.stringify(details)) : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.log('[AUDIT]', logEntry);
    }
    
    // In production, send to secure backend logging service
    // TODO: Implement server-side audit logging via Supabase edge function
  }
};