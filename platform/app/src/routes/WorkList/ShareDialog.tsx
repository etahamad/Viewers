import React, { useState } from 'react';
import { Button, Modal } from '@ohif/ui-next';

function ShareDialog({ studyInstanceUid, onComplete }) {
  const [password, setPassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateLink = () => {
    // For now, just generate the link without a password
    const link = `${window.location.origin}/shared/${studyInstanceUid}`;
    setGeneratedLink(link);
  };

  return (
    <Modal
      isOpen={true}
      title="Share Study"
      onClose={onComplete}
    >
      <div style={{ padding: '20px', color: 'white' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="password">Password (optional)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ color: 'black', width: '100%' }}
          />
        </div>
        <Button onClick={handleGenerateLink}>Generate Link</Button>
        {generatedLink && (
          <div style={{ marginTop: '20px' }}>
            <input
              type="text"
              readOnly
              value={generatedLink}
              style={{ color: 'black', width: 'calc(100% - 80px)', marginRight: '10px' }}
            />
            <Button onClick={() => navigator.clipboard.writeText(generatedLink)}>
              Copy
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ShareDialog;
