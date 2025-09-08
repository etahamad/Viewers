/**
 * URL Token Manager - Enhanced token cleanup and browser history management
 */

export interface TokenCleanupOptions {
  preserveHistory?: boolean;
  redirectAfterCleanup?: boolean;
  logCleanup?: boolean;
}

/**
 * Enhanced token cleanup with browser history management
 */
export class URLTokenManager {
  private static instance: URLTokenManager;
  private cleanupCallbacks: Array<() => void> = [];

  static getInstance(): URLTokenManager {
    if (!URLTokenManager.instance) {
      URLTokenManager.instance = new URLTokenManager();
    }
    return URLTokenManager.instance;
  }

  /**
   * Remove token from URL with enhanced history management
   */
  cleanTokenFromURL(options: TokenCleanupOptions = {}): boolean {
    try {
      const currentUrl = new URL(window.location.href);
      const hasToken = currentUrl.searchParams.has('token');
      
      if (!hasToken) {
        return false;
      }

      // Store original URL for history if needed
      const originalUrl = currentUrl.toString();
      
      // Remove token parameter
      currentUrl.searchParams.delete('token');
      const cleanUrl = currentUrl.toString();

      // Update browser history
      if (window.history && window.history.replaceState) {
        if (options.preserveHistory) {
          // Push new state to preserve back button functionality
          window.history.pushState(null, '', cleanUrl);
        } else {
          // Replace current state (default behavior)
          window.history.replaceState(null, '', cleanUrl);
        }
      }

      // Log cleanup if requested
      if (options.logCleanup) {
        console.log('Token cleaned from URL', {
          original: originalUrl,
          cleaned: cleanUrl,
          preserveHistory: options.preserveHistory
        });
      }

      // Execute cleanup callbacks
      this.cleanupCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.warn('Token cleanup callback failed:', error);
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to clean token from URL:', error);
      return false;
    }
  }

  /**
   * Register callback to be executed after token cleanup
   */
  onTokenCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Remove specific cleanup callback
   */
  removeCleanupCallback(callback: () => void): void {
    const index = this.cleanupCallbacks.indexOf(callback);
    if (index > -1) {
      this.cleanupCallbacks.splice(index, 1);
    }
  }

  /**
   * Check if current URL contains a token
   */
  hasTokenInURL(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('token');
  }

  /**
   * Get token from URL without removing it
   */
  getTokenFromURL(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }

  /**
   * Create a shareable URL with token
   */
  createShareableURL(token: string, studyUIDs: string[], baseUrl?: string): string {
    const base = baseUrl || window.location.origin;
    const url = new URL(`${base}/viewer`);
    
    url.searchParams.set('StudyInstanceUIDs', studyUIDs.join(','));
    url.searchParams.set('token', token);
    
    return url.toString();
  }

  /**
   * Validate and sanitize URL parameters
   */
  sanitizeURLParams(): void {
    const url = new URL(window.location.href);
    let modified = false;

    // Remove potentially dangerous parameters
    const dangerousParams = ['script', 'eval', 'javascript'];
    dangerousParams.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        modified = true;
      }
    });

    if (modified && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', url.toString());
    }
  }

  /**
   * Handle browser back/forward navigation for token URLs
   */
  setupNavigationHandling(): void {
    window.addEventListener('popstate', (event) => {
      // Check if navigated to a URL with token
      if (this.hasTokenInURL()) {
        console.log('Navigation detected to token URL');
        
        // You might want to re-process the token or redirect
        const token = this.getTokenFromURL();
        if (token) {
          // Trigger token processing again
          window.dispatchEvent(new CustomEvent('tokenNavigation', {
            detail: { token, url: window.location.href }
          }));
        }
      }
    });
  }
}

/**
 * Enhanced token cleanup function that integrates with existing code
 */
export function enhancedTokenCleanup(
  location: any,
  options: TokenCleanupOptions = {}
): boolean {
  const tokenManager = URLTokenManager.getInstance();
  return tokenManager.cleanTokenFromURL(options);
}

/**
 * Create secure shareable link
 */
export function createSecureShareLink(
  token: string, 
  studyUIDs: string[],
  options: {
    baseUrl?: string;
    expiresIn?: string;
  } = {}
): string {
  const tokenManager = URLTokenManager.getInstance();
  return tokenManager.createShareableURL(token, studyUIDs, options.baseUrl);
}

/**
 * Initialize token management for the application
 */
export function initializeTokenManagement(): void {
  const tokenManager = URLTokenManager.getInstance();
  
  // Setup navigation handling
  tokenManager.setupNavigationHandling();
  
  // Sanitize URL on load
  tokenManager.sanitizeURLParams();
  
  // Register cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (tokenManager.hasTokenInURL()) {
      console.warn('Page unloading with token in URL');
    }
  });
}