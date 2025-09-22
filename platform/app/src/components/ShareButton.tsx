import React, { useState } from 'react';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { Button, ButtonEnums } from '@ohif/ui';
import TokenService from '../services/TokenService';

interface ShareButtonProps {
  studyInstanceUid: string;
  className?: string;
}

function ShareButton({ studyInstanceUid, className = '' }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    setIsCopied(false);

    try {
      // Generate a fresh access token using client credentials flow
      const tokenService = TokenService.getInstance();
      const shareUrl = await tokenService.generateStudyShareUrl(studyInstanceUid);

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error sharing study:', error);
      // You could show a toast notification here
      alert('Failed to generate share link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type={ButtonEnums.type.primary}
          size={ButtonEnums.size.medium}
          onClick={handleShare}
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <Icons.LoadingSpinner className="!h-[20px] !w-[20px] animate-spin text-black" />
            ) : isCopied ? (
              <Icons.CheckBoxChecked className="!h-[20px] !w-[20px] text-black" />
            ) : (
              <Icons.Link className="!h-[20px] !w-[20px] text-black" />
            )
          }
          dataCY={`share-${studyInstanceUid}`}
          className={`text-[13px] ${className}`}
        >
          {isLoading ? 'Generating...' : isCopied ? 'Copied!' : 'Share'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isCopied ? 'Link copied to clipboard!' : 'Generate a shareable link with fresh token'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default ShareButton;
