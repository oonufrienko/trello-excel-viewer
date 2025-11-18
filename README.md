# Trello Excel Viewer Power-Up

Preview Excel attachments (`.xls`, `.xlsx`, `.xlsm`, `.xlsb`, `.xlt*`) without leaving Trello. Clicking the native attachment row or its file-type badge opens a modal with either the Microsoft Office Online viewer or Google Docs viewer, just like Trello’s built-in PDF preview.

## Repository layout

```
public/           # Static files served via GitHub Pages (or any HTTPS host)
  index.html      # Power-Up entrypoint + docs page
  viewer.html     # Modal iframe loaded when a preview opens
  powerup.js      # Trello capability handlers
  viewer.js       # Viewer-frame controller (fallbacks, reload UX)
  config.js       # Runtime configuration (proxy URL, viewer preference)
  powerup.json    # Trello manifest you register in the admin console
  assets/         # SVG icon etc.
api/proxy.js      # Vercel serverless proxy for private Trello attachments
```

## Prerequisites

- Trello API key (already provided): `eaa6d0d7c57218139af1b772bbd777cb`
- Trello token (generate via https://trello.com/app-key and authorize your account)
- GitHub Pages (or any static HTTPS host) for the `public` folder
- Vercel account for the proxy API (Node 18 runtime)

## Deploy steps

### 1. Static frontend (GitHub Pages)

1. Push this repo to GitHub.
2. In repository settings → Pages, set the source to the `public` folder (or publish via an action/build step).
3. Note the live URL, e.g. `https://your-user.github.io/trello-excel-viewer`.
4. Update `public/config.js`:
   - `proxyBaseUrl`: `https://<your-vercel-app>.vercel.app/api/proxy`
   - Tweak `viewerProvider` / `fallbackViewer` if desired.
5. (Optional) Update `public/powerup.json` → `homepage` to the public repo/landing page.

### 2. Backend proxy (Vercel)

1. Run `vercel init` in the repo (or import it in the Vercel dashboard).
2. Set environment variables in Vercel → Settings → Environment Variables:
   - `TRELLO_API_KEY = eaa6d0d7c57218139af1b772bbd777cb`
   - `TRELLO_TOKEN = <your Trello member token>`
3. Deploy. The function will be available at `https://<app>.vercel.app/api/proxy`.

> The proxy white-lists `trello.com`, `trello.net`, and Trello’s S3 hosts. It appends your key/token automatically so Office/Google viewers can fetch private attachments.

### 3. Register the Power-Up

1. Go to https://trello.com/power-ups/admin and create a new Power-Up.
2. Provide a name/icon, then point the manifest URL at your hosted `powerup.json` (e.g. `https://your-user.github.io/trello-excel-viewer/powerup.json`).
3. Enable the Power-Up for your workspace / board.
4. Attach an `.xlsx` file to any card. Clicking the attachment (or its badge) should now open the modal preview.

## Configuration tips

- **Viewer choice**: Microsoft Office preserves Excel features better. Use `viewerProvider: 'google'` only if Office Online is blocked in your network.
- **Proxy bypass**: Set `allowDirectPublicUrls` to `false` if you want to force all downloads through Vercel (adds auditing, consistent access control).
- **Quota / size**: The proxy limits files to 40 MB; adjust `MAX_BYTES` in `api/proxy.js` if you need more (mind Office Online’s ~70 MB hard limit).

## Development

Because the Power-Up consists of static assets, you can serve the `public` directory locally via any static server (e.g. `npx serve public`). When registering the manifest for local testing, use a tunneling service such as `ngrok` so Trello can reach your machine.

## License

MIT
