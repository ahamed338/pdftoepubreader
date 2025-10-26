#!/bin/bash

# Name of the project
PROJECT_NAME="pdftoepubreader"

# Create project root folder
mkdir -p ~/$PROJECT_NAME
cd ~/$PROJECT_NAME || exit

echo "Creating folder structure..."

# Public folder (for static assets)
mkdir -p public

# Source folder (frontend HTML/JS/CSS)
mkdir -p src
touch src/index.html
touch src/style.css
touch src/app.js

# Cloudflare Worker folder
mkdir -p worker
touch worker/worker.js

# Optional config and metadata files
touch README.md
touch wrangler.toml
touch package.json

# Add initial content for index.html
cat <<EOL > src/index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF to EPUB Reader</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>PDF to EPUB Reader</h1>
    <input type="file" id="pdfInput" accept=".pdf">
    <button id="convertBtn">Convert to EPUB</button>
    <div id="reader"></div>

    <script src="app.js"></script>
</body>
</html>
EOL

# Add placeholder content for app.js
cat <<EOL > src/app.js
// Placeholder JS for PDF upload and EPUB display
document.getElementById('convertBtn').addEventListener('click', () => {
    alert('PDF to EPUB conversion will be implemented here.');
});
EOL

# Add placeholder content for worker.js
cat <<EOL > worker/worker.js
// Cloudflare Worker template for PDF -> EPUB API
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    return new Response('Worker is ready!', { status: 200 })
}
EOL

# Add placeholder README
cat <<EOL > README.md
# PDF to EPUB Reader

This is a lightweight starter project for a PDF to EPUB Reader web app, deployable on Cloudflare Pages + Worker.

- Frontend: src/
- Worker: worker/
- Static assets: public/
EOL

echo "Project folder structure created successfully in ~/$PROJECT_NAME"
