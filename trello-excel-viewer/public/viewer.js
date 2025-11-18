/* global TrelloPowerUp */
(function () {
  const t = window.TrelloPowerUp.iframe();
  const ctx = (t.arg('viewerContext') || {});

  const frame = document.getElementById('viewerFrame');
  const status = document.getElementById('viewerStatus');
  const titleEl = document.getElementById('viewerTitle');
  const providerEl = document.getElementById('viewerProvider');
  const openBtn = document.getElementById('openInNewTab');
  const refreshBtn = document.getElementById('refreshViewer');
  const fallbackBtn = document.getElementById('useFallback');
  const statusHeadline = document.getElementById('statusHeadline');
  const statusSubline = document.getElementById('statusSubline');

  const providerLabels = {
    office: 'Microsoft Office viewer',
    google: 'Google Docs viewer'
  };

  let currentViewer = ctx.provider || 'office';
  let loadTimeout = null;

  titleEl.textContent = ctx.attachmentName || 'Excel preview';
  providerEl.textContent = providerLabels[currentViewer] || 'Loading viewer…';
  openBtn.disabled = !ctx.downloadUrl;

  openBtn.addEventListener('click', () => {
    if (!ctx.downloadUrl) return;
    window.open(ctx.downloadUrl, '_blank', 'noopener');
  });

  refreshBtn.addEventListener('click', () => {
    if (!frame.src) return;
    frame.contentWindow?.location?.reload?.();
    showStatus('Reloading preview…', `Using ${providerLabels[currentViewer] || currentViewer}`);
  });

  if (!ctx.fallbackViewerUrl) {
    fallbackBtn.disabled = true;
    fallbackBtn.style.display = 'none';
  } else {
    fallbackBtn.disabled = false;
  }
  fallbackBtn.addEventListener('click', () => {
    if (!ctx.fallbackViewerUrl) return;
    currentViewer = ctx.fallbackProvider;
    providerEl.textContent = providerLabels[currentViewer] || currentViewer;
    loadViewer(ctx.fallbackViewerUrl);
    fallbackBtn.disabled = true;
  });

  frame.addEventListener('load', () => {
    hideStatus();
    clearTimeout(loadTimeout);
    t.sizeToParent();
  });

  function loadViewer(url) {
    if (!url) {
      showStatus('Missing preview URL', 'Check your Power-Up configuration.');
      return;
    }
    providerEl.textContent = providerLabels[currentViewer] || currentViewer;
    frame.src = url;
    showStatus('Preparing preview…', 'Larger workbooks may take longer.');
    clearTimeout(loadTimeout);
    loadTimeout = window.setTimeout(() => {
      showStatus(
        'Still waiting…',
        ctx.fallbackViewerUrl && !fallbackBtn.disabled
          ? 'The file is slow to load. Try the fallback viewer.'
          : 'If loading never finishes, open the original file instead.'
      );
    }, 8000);
  }

  function showStatus(title, subtitle) {
    statusHeadline.textContent = title;
    statusSubline.textContent = subtitle;
    status.dataset.hidden = 'false';
  }

  function hideStatus() {
    status.dataset.hidden = 'true';
  }

  loadViewer(ctx.viewerUrl || ctx.fallbackViewerUrl);
})();
