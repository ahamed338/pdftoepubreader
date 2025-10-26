# PDF to EPUB Reader

Mobile-friendly PDF → EPUB reader, deployable on Cloudflare Pages + Worker.

## Features

- Upload PDF and convert to EPUB
- EPUB reader using epub.js
- Mobile-friendly layout with Tailwind CSS
- PWA-ready (Add to Home Screen)
- Cloudflare Worker ready for PDF → EPUB conversion

## Deployment

1. Install Wrangler CLI: `npm install -g wrangler`
2. Configure `wrangler.toml` with your Cloudflare account
3. Deploy Worker: `wrangler publish`
4. Deploy frontend to Cloudflare Pages
