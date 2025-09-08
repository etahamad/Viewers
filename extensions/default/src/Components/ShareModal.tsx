import * as React from 'react';
import { useState, useEffect } from 'react';
import { Icons } from '@ohif/ui-next';
import { Types } from '@ohif/core';
import { generateShareToken, copyToClipboard } from '../utils/shareUtils';

interface ShareModalProps {
  studyInstanceUIDs: string[];
  onClose: () => void;
  servicesManager: Types.ServicesManager;
  hide: () => void; // Automatically passed by uiModalService
}

/**
 * ShareModal - Modal component for generating and sharing study access tokens
 * 
 * This component allows users to:
 * - Set token expiration time
 * - Generate secure sharing tokens
 * - Copy shareable URLs to clipboard
 * - View token expiration information
 */
export const ShareModal: React.FC<ShareModalProps> = ({
  studyInstanceUIDs,
  onClose,
  servicesManager,
  hide
}) => {
  const [expiresIn, setExpiresIn] = useState('24h');
  const [shareUrl, setShareUrl] = useState('');
  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Get current user info if available
  const { userAuthenticationService } = servicesManager.services;
  const currentUser = userAuthenticationService?.getUser?.() || null;
  const sharedBy = currentUser?.email || currentUser?.name || 'Anonymous User';

  const expirationOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const handleGenerateShareUrl = async () => {
    if (studyInstanceUIDs.length === 0) {
      setError('No studies selected for sharing');
      return;
    }

    setLoading(true);
    setError('');
    setCopySuccess(false);
    
    try {
      const result = await generateShareToken(studyInstanceUIDs, {
        sharedBy,
        expiresIn
      });

      if (result.success) {
        setToken(result.token || '');
        setShareUrl(result.shareUrl || '');
        setExpiresAt(result.expiresAt || '');
        setError('');
      } else {
        setError(result.error || 'Failed to generate share URL');
        setShareUrl('');
        setToken('');
        setExpiresAt('');
      }
    } catch (err) {
      console.error('Share URL generation error:', err);
      setError('Network error. Please check your connection and try again.');
      setShareUrl('');
      setToken('');
      setExpiresAt('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000); // Reset success state after 3 seconds
      } else {
        setError('Failed to copy to clipboard. Please copy manually.');
      }
    } catch (err) {
      setError('Failed to copy to clipboard. Please copy manually.');
    }
  };

  const formatExpirationDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (err) {
      return dateString;
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    hide();
  };

  return (
    <div className="w-[500px] max-w-[90vw] p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Share Study</h2>
        <p className="text-sm text-muted-foreground">
          Generate a secure link to share {studyInstanceUIDs.length} study{studyInstanceUIDs.length > 1 ? 'ies' : ''} with others.
        </p>
      </div>

      {/* Study Information */}
      <div className="mb-4 p-3 bg-muted rounded-md">
        <h3 className="text-sm font-medium text-foreground mb-2">Studies to Share:</h3>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {studyInstanceUIDs.map((uid, index) => (
            <div key={uid} className="text-xs text-muted-foreground font-mono">
              {index + 1}. {uid}
            </div>
          ))}
        </div>
      </div>

      {/* Expiration Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Expires In:
        </label>
        <select
          value={expiresIn}
          onChange={(e) => setExpiresIn(e.target.value)}
          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        >
          {expirationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <div className="mb-4">
        <button
          onClick={handleGenerateShareUrl}
          disabled={loading || studyInstanceUIDs.length === 0}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Icons.Link className="w-4 h-4" />
              Generate Share Link
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2">
            <Icons.AlertOutline className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}

      {/* Generated URL Display */}
      {shareUrl && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Share URL:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-input bg-muted text-foreground text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleCopyToClipboard}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary flex items-center gap-1"
              title="Copy to clipboard"
            >
              {copySuccess ? (
                <>
                  <Icons.Checked className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Icons.Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          
          {/* Expiration Info */}
          {expiresAt && (
            <p className="text-xs text-muted-foreground mt-2">
              <Icons.Clock className="w-3 h-3 inline mr-1" />
              Expires: {formatExpirationDate(expiresAt)}
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {copySuccess && (
        <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-md">
          <div className="flex items-center gap-2">
            <Icons.Checked className="w-4 h-4 text-success" />
            <span className="text-sm text-success">
              Share URL copied to clipboard successfully!
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {shareUrl ? 'Done' : 'Cancel'}
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground">
          <Icons.Shield className="w-3 h-3 inline mr-1" />
          <strong>Security Notice:</strong> The generated link provides time-limited access to the specified studies. 
          Share only with trusted recipients. Links automatically expire after the selected duration.
        </p>
      </div>
    </div>
  );
};

export default ShareModal;