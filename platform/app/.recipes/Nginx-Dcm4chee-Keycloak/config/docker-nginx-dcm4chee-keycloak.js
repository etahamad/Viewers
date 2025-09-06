/** @type {AppTypes.Config} */
// To use token-based login, you can append `?access_token=<your_token>` to any URL.
// The application will automatically log you in and remove the token from the URL.
// Example: https://viewerdicom.cloudcompuexpediente.com/viewer?StudyInstanceUIDs=...&access_token=<your_token>
window.config = {
  routerBasename: "/",
  showStudyList: true,
  extensions: [],
  modes: [],
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  oidc: [
    {
      authority: "https://authdicom.cloudcompuexpediente.com/realms/dcm4che",
      client_id: "ohif-viewer",
      redirect_uri: "https://viewerdicom.cloudcompuexpediente.com/callback",
      response_type: "id_token token",
      scope: "openid email profile",
      post_logout_redirect_uri: "/",
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true
    }
  ],
  defaultDataSourceName: "dicomweb",
  dataSources: [
    {
      namespace: "@ohif/extension-default.dataSourcesModule.dicomweb",
      sourceName: "dicomweb",
      configuration: {
        friendlyName: "Dcm4chee Server",
        name: "Dcm4chee",
        wadoUriRoot: "https://pacsdicom.cloudcompuexpediente.com/dcm4chee-arc/aets/DCM4CHEE/wado",
        qidoRoot: "https://pacsdicom.cloudcompuexpediente.com/dcm4chee-arc/aets/DCM4CHEE/rs",
        wadoRoot: "https://pacsdicom.cloudcompuexpediente.com/dcm4chee-arc/aets/DCM4CHEE/rs",
        qidoSupportsIncludeField: false,
        imageRendering: "wadors",
        thumbnailRendering: "wadors",
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true
      }
    }
  ]
};
