/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/ohif-viewer/',
  showStudyList: true,
  extensions: [],
  modes: [],
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Dcm4chee Server',
        name: 'Dcm4chee',
        wadoUriRoot: "https://pacsdicom.cloudcompuexpediente.com/dcm4chee-arc/aets/DCM4CHEE/wado",
        qidoRoot: "https://pacsdicom.cloudcompuexpediente.com/dcm4chee-arc/aets/DCM4CHEE/rs",
        wadoRoot: "https://pacsdicom.cloudcompuexpediente.com/dcm4chee-arc/aets/DCM4CHEE/rs",
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
};
