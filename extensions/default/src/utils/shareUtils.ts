import { Types } from '@ohif/core';

/**
 * Utility functions for study sharing functionality
 */

/**
 * Retrieves active study UIDs from the current OHIF context.
 * This function attempts to get study UIDs from various sources in order of preference.
 * 
 * @param servicesManager - The OHIF services manager
 * @returns Array of StudyInstanceUIDs that are currently active/loaded
 */
export function getActiveStudyUIDs(servicesManager: Types.ServicesManager): string[] {
  const { hangingProtocolService, displaySetService } = servicesManager.services;

  try {
    // Method 1: Get from hanging protocol service (most reliable for active study)
    const hpState = hangingProtocolService.getState();
    if (hpState.activeStudyUID) {
      return [hpState.activeStudyUID];
    }

    // Method 2: Get from active display sets
    const activeDisplaySets = displaySetService.getActiveDisplaySets();
    if (activeDisplaySets && activeDisplaySets.length > 0) {
      const studyUIDs = Array.from(
        new Set(activeDisplaySets.map(ds => ds.StudyInstanceUID).filter(Boolean))
      );
      if (studyUIDs.length > 0) {
        return studyUIDs;
      }
    }

    // Method 3: Get all studies from hanging protocol service
    const allStudies = hangingProtocolService.studies || [];
    const studyUIDs = allStudies.map(study => study.StudyInstanceUID).filter(Boolean);
    
    if (studyUIDs.length > 0) {
      return studyUIDs;
    }

    console.warn('No active study UIDs found in current context');
    return [];
  } catch (error) {
    console.error('Error retrieving active study UIDs:', error);
    return [];
  }
}

/**
 * Validates if the sharing functionality is available and the context is ready
 * 
 * @param servicesManager - The OHIF services manager
 * @returns Object indicating if sharing is available and any error message
 */
export function validateSharingContext(servicesManager: Types.ServicesManager): {
  isAvailable: boolean;
  errorMessage?: string;
} {
  try {
    const studyUIDs = getActiveStudyUIDs(servicesManager);
    
    if (studyUIDs.length === 0) {
      return {
        isAvailable: false,
        errorMessage: 'No studies are currently loaded'
      };
    }

    // Check if token validator service is configured
    const tokenValidatorUrl = process.env.TOKEN_VALIDATOR_URL || 'http://localhost:3001';
    
    if (!tokenValidatorUrl) {
      return {
        isAvailable: false,
        errorMessage: 'Token validator service not configured'
      };
    }

    return {
      isAvailable: true
    };
  } catch (error) {
    return {
      isAvailable: false,
      errorMessage: `Sharing validation error: ${error.message}`
    };
  }
}

/**
 * Generates a shareable token for the specified studies
 * 
 * @param studyUIDs - Array of StudyInstanceUIDs to share
 * @param options - Token generation options
 * @returns Promise that resolves to token generation response
 */
export async function generateShareToken(
  studyUIDs: string[],
  options: {
    sharedBy?: string;
    expiresIn?: string;
  } = {}
): Promise<{
  success: boolean;
  token?: string;
  shareUrl?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const tokenValidatorUrl = process.env.TOKEN_VALIDATOR_URL || 'http://localhost:3001';
    
    const response = await fetch(`${tokenValidatorUrl}/api/shares/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studyInstanceUIDs: studyUIDs,
        sharedBy: options.sharedBy || 'anonymous',
        expiresIn: options.expiresIn || '24h'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      token: data.token,
      shareUrl: data.shareUrl,
      expiresAt: data.expiresAt
    };
  } catch (error) {
    console.error('Failed to generate share token:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Copies text to clipboard with fallback for older browsers
 * 
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves to success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}