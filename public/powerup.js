/* global TrelloPowerUp */
(function () {
  const t = window.TrelloPowerUp;
  const config = window.ExcelViewerPowerUpConfig || {};

  const EXCEL_EXTENSIONS = new Set([
    'xls',
    'xlsx',
    'xlsm',
    'xlsb',
    'xlt',
    'xltx',
    'xltm'
  ]);

  const EXCEL_MIME_PREFIXES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml'
  ];

  const OFFICE_VIEWER = 'office';
  const GOOGLE_VIEWER = 'google';

  function isExcelAttachment(attachmentLike) {
    if (!attachmentLike) return false;
    const url = attachmentLike.url || attachmentLike.link;
    const mime = attachmentLike.mimeType || attachmentLike.mime;

    if (mime && EXCEL_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))) {
      return true;
    }

    const extension = extractExtension(url);
    return EXCEL_EXTENSIONS.has(extension);
  }

  function extractExtension(url = '') {
    try {
      const path = new URL(url).pathname || '';
      const pieces = path.split('.');
      return pieces.pop().toLowerCase();
    } catch (err) {
      const manualPieces = url.split('?')[0].split('.');
      return manualPieces.pop().toLowerCase();
    }
  }

  function shouldProxyAttachment(attachment) {
    if (!config.proxyBaseUrl) return false;
    if (!config.allowDirectPublicUrls) return true;

    try {
      const host = new URL(attachment.url).hostname;
      const requiresToken = /trello\.(com|net)$/i.test(host) || /amazonaws\.com$/i.test(host);
      return requiresToken;
    } catch (err) {
      return true;
    }
  }

  function buildDownloadUrl(attachment) {
    if (!config.proxyBaseUrl) {
      return attachment.url;
    }

    if (shouldProxyAttachment(attachment)) {
      return `${config.proxyBaseUrl}?url=${encodeURIComponent(attachment.url)}`;
    }

    return attachment.url;
  }

  function buildViewerTargets(attachment) {
    const downloadUrl = buildDownloadUrl(attachment);

    const primaryProvider = (config.viewerProvider || OFFICE_VIEWER).toLowerCase();
    const fallbackProvider = (config.fallbackViewer || GOOGLE_VIEWER).toLowerCase();

    const primaryViewerUrl = buildViewerUrl(downloadUrl, primaryProvider);
    const fallbackViewerUrl = primaryProvider === fallbackProvider
      ? null
      : buildViewerUrl(downloadUrl, fallbackProvider);

    return {
      downloadUrl,
      viewerUrl: primaryViewerUrl,
      fallbackViewerUrl,
      provider: primaryProvider,
      fallbackProvider
    };
  }

  function buildViewerUrl(fileUrl, provider) {
    if (!fileUrl) return null;
    const encoded = encodeURIComponent(fileUrl);
    if (provider === GOOGLE_VIEWER) {
      return `https://docs.google.com/gview?embedded=1&url=${encoded}`;
    }
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
  }

  function openExcelModal(tInstance, attachment, context) {
    const targets = buildViewerTargets(attachment);

    return tInstance.modal({
      title: attachment.name || 'Excel preview',
      url: tInstance.signUrl('./viewer.html'),
      fullscreen: true,
      accentColor: '#107c41',
      args: {
        viewerContext: {
          attachmentName: attachment.name || attachment.url,
          provider: targets.provider,
          fallbackProvider: targets.fallbackProvider,
          viewerUrl: targets.viewerUrl,
          fallbackViewerUrl: targets.fallbackViewerUrl,
          downloadUrl: targets.downloadUrl,
          originalUrl: attachment.url,
          card: context?.context?.card || null
        }
      }
    });
  }

  function buildThumbnailResponse(tInstance, attachment) {
    return {
      title: 'Preview Excel',
      url: attachment.url,
      icon: './assets/excel-icon.svg',
      callback: function () {
        return openExcelModal(tInstance, attachment);
      }
    };
  }

  function handleAttachmentThumbnail(tInstance, options) {
    const attachment = options.attachment || options;
    if (!isExcelAttachment(attachment)) {
      return null;
    }
    return buildThumbnailResponse(tInstance, attachment);
  }

  t.initialize(
    {
      'attachment-thumbnail': handleAttachmentThumbnail
    },
    {
      appKey: 'eaa6d0d7c57218139af1b772bbd777cb'
    }
  );
})();
