import React, { useState } from 'react';
import { Button } from '@ohif/ui';

function ShareDialog({ studyInstanceUid, onComplete, hide }) {
  const [password, setPassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateLink = () => {
    // For now, just generate the link without a password
    const link = `${window.location.origin}/shared/${studyInstanceUid}`;
    setGeneratedLink(link);
  };

  return (
    <div className="bg-secondary-dark rounded-md p-4">
      <div className="flex flex-row justify-between">
        <h5 className="text-2xl text-white">Share Study</h5>
        <Button
          onClick={hide}
          className="text-2xl text-white"
        >
          &times;
        </Button>
      </div>
      <div className="mt-4">
        <div className="mb-4">
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-bold text-white"
          >
            Password (optional)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
          />
        </div>
        <Button
          onClick={handleGenerateLink}
          className="bg-primary-main hover:bg-primary-dark w-full rounded py-2 px-4 font-bold text-white"
        >
          Generate Link
        </Button>
        {generatedLink && (
          <div className="mt-4">
            <div className="flex">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="focus:shadow-outline w-full appearance-none rounded-l border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
              />
              <Button
                onClick={() => navigator.clipboard.writeText(generatedLink)}
                className="bg-primary-main hover:bg-primary-dark rounded-r px-4 font-bold text-white"
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareDialog;
