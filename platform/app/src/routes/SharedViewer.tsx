import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { extensionManager as defaultExtensionManager } from '../App';
import ViewportGrid from '@components/ViewportGrid';
import { utils } from '@ohif/core';
import { ImageViewerProvider, DragAndDropProvider } from '@ohif/ui-next';

function SharedViewer({ servicesManager, extensionManager = defaultExtensionManager }) {
  const { StudyInstanceUIDs } = useParams();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studyInstanceUIDs, setStudyInstanceUIDs] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [displaySets, setDisplaySets] = useState([]);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    if (extensionManager) {
      const activeDataSource = extensionManager.getActiveDataSource()[0];
      setDataSource(activeDataSource);
    }
  }, [extensionManager]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock password verification
    if (password === 'password') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  useEffect(() => {
    const fetchStudyData = async () => {
      if (dataSource && isAuthenticated && StudyInstanceUIDs) {
        const uids = StudyInstanceUIDs.split(';');
        setStudyInstanceUIDs(uids);

        const {
          displaySetService,
          hangingProtocolService,
        } = servicesManager.services;

        displaySetService.init(extensionManager);
        hangingProtocolService.reset();

        const madeDisplaySets = await utils.studyMetadataManager.makeDisplaySets(
          uids,
          {
            dataSource,
            displaySetService,
          }
        );

        setDisplaySets(madeDisplaySets);
        const { numRows, numCols } = hangingProtocolService.getGridInformation(madeDisplaySets);
        setLayout({ numRows, numCols });
      }
    };

    fetchStudyData();
  }, [dataSource, isAuthenticated, StudyInstanceUIDs, servicesManager, extensionManager]);

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h2>Enter Password to View Study</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginRight: '10px', color: 'black' }}
          />
          <button type="submit" style={{ color: 'black' }}>Submit</button>
        </form>
      </div>
    );
  }

  if (!dataSource || !studyInstanceUIDs || !layout) {
    return <div>Loading...</div>;
  }

  return (
    <ImageViewerProvider StudyInstanceUIDs={studyInstanceUIDs}>
      <DragAndDropProvider>
        <ViewportGrid
          displaySets={displaySets}
          layout={layout}
          dataSource={dataSource}
        />
      </DragAndDropProvider>
    </ImageViewerProvider>
  );
}

export default SharedViewer;
