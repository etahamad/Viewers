import React, { useState } from 'react';
import { Button, Input, Label, Clipboard, Select } from '@ohif/ui-next';

const ShareDialog = ({ onGenerateLink, shareableLink, hide }) => {
  const [expiresIn, setExpiresIn] = useState(3600); // Default to 1 hour

  const handleGenerateLink = () => {
    onGenerateLink(expiresIn);
  };

  const expirationOptions = [
    { value: 3600, label: '1 Hour' },
    { value: 86400, label: '24 Hours' },
    { value: 604800, label: '7 Days' },
  ];

  return (
    <div className="flex flex-col">
      {!shareableLink ? (
        <>
          <Label htmlFor="expiresIn">Expires In</Label>
          <Select
            id="expiresIn"
            value={expiresIn}
            onChange={value => setExpiresIn(value)}
            options={expirationOptions}
          />
          <Button onClick={handleGenerateLink} className="mt-4">
            Generate Link
          </Button>
        </>
      ) : (
        <>
          <Label htmlFor="shareableLink">Shareable Link</Label>
          <div className="flex">
            <Input
              id="shareableLink"
              type="text"
              value={shareableLink}
              readOnly
            />
            <Clipboard
              text={shareableLink}
              className="ml-2"
            />
          </div>
          <Button onClick={hide} className="mt-4">
            Close
          </Button>
        </>
      )}
    </div>
  );
};

export default ShareDialog;
