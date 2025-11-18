window.ExcelViewerPowerUpConfig = {
  /**
   * REQUIRED: URL of your deployed Vercel proxy endpoint.
   * Example: https://excel-proxy.vercel.app/api/proxy
   */
  proxyBaseUrl: 'https://YOUR-VERCEL-APP.vercel.app/api/proxy',

  /**
   * Preferred preview provider: 'office' or 'google'.
   * Microsoft Office works best for preserving formatting.
   */
  viewerProvider: 'office',

  /**
   * Optional fallback provider if the preferred viewer fails.
   */
  fallbackViewer: 'google',

  /**
   * When true, public attachments skip the proxy to load faster.
   */
  allowDirectPublicUrls: true
};
