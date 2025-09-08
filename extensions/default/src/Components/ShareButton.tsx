import * as React from 'react';
import { Icons } from '@ohif/ui-next';
import { Types } from '@ohif/core';

interface ShareButtonProps {
  id?: string;
  className?: string;
  onInteraction?: (args: any) => void;
  servicesManager?: Types.ServicesManager;
  commandsManager?: any;
  disabled?: boolean;
  tooltip?: string;
}

/**
 * ShareButton - Toolbar button component for study sharing functionality
 * 
 * This component provides a button that triggers the study sharing modal
 * when clicked. It integrates with the OHIF toolbar system.
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  id = 'ShareStudy',
  className = '',
  onInteraction,
  servicesManager,
  commandsManager,
  disabled = false,
  tooltip = 'Share Study'
}) => {
  const handleClick = () => {
    if (disabled) {
      return;
    }

    // Trigger the share command through the commands manager
    if (commandsManager) {
      commandsManager.runCommand('shareStudy');
    }

    // Also trigger the onInteraction callback if provided
    if (onInteraction) {
      onInteraction({
        itemId: id,
        interactionType: 'action',
        commands: ['shareStudy']
      });
    }
  };

  const buttonClassName = `
    inline-flex items-center justify-center
    w-10 h-10
    text-foreground hover:text-primary
    bg-background hover:bg-muted
    border border-input hover:border-primary
    rounded-md
    transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <button
      className={buttonClassName}
      onClick={handleClick}
      disabled={disabled}
      title={tooltip}
      data-testid={`${id}-btn`}
      data-cy={`${id}-btn`}
    >
      <Icons.Link className="w-5 h-5" />
    </button>
  );
};

export default ShareButton;