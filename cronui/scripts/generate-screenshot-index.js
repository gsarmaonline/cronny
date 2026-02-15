const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots-repo');
const metadataPath = path.join(SCREENSHOTS_DIR, 'metadata.json');

if (!fs.existsSync(metadataPath)) {
  console.error('❌ metadata.json not found. Run npm run capture-screenshots first.');
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cronny UI Screenshots - ${metadata.date}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .metadata {
      color: #666;
      margin-bottom: 30px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .metadata p {
      margin: 5px 0;
    }
    .route {
      margin-bottom: 50px;
      border-bottom: 1px solid #eee;
      padding-bottom: 30px;
    }
    .route:last-child {
      border-bottom: none;
    }
    .route-header {
      margin-bottom: 20px;
    }
    .route-header h2 {
      color: #1a1a1a;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .route-path {
      color: #0066cc;
      font-family: monospace;
      font-size: 16px;
      margin-bottom: 5px;
    }
    .route-description {
      color: #666;
      font-size: 14px;
    }
    .screenshots {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .screenshot {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      background: white;
    }
    .screenshot-header {
      padding: 10px 15px;
      background: #f9f9f9;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      color: #333;
      text-transform: capitalize;
    }
    .screenshot img {
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .screenshot img:hover {
      transform: scale(1.02);
    }
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      cursor: pointer;
    }
    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal img {
      max-width: 90%;
      max-height: 90vh;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Cronny UI Screenshots</h1>
    <div class="metadata">
      <p><strong>Last Updated:</strong> ${new Date(metadata.lastUpdated).toLocaleString()}</p>
      <p><strong>Base URL:</strong> ${metadata.baseUrl}</p>
      <p><strong>Total Screenshots:</strong> ${metadata.totalScreenshots}</p>
      <p><strong>Viewports:</strong> ${metadata.viewports.map(v => `${v.name} (${v.width}x${v.height})`).join(', ')}</p>
    </div>

    ${metadata.routes.map(route => `
      <div class="route">
        <div class="route-header">
          <h2>${route.name}</h2>
          <div class="route-path">${route.path}</div>
          <div class="route-description">${route.description}</div>
        </div>
        <div class="screenshots">
          ${route.screenshots.map(screenshot => {
            const viewport = screenshot.split('-').pop().replace('.png', '');
            return `
              <div class="screenshot">
                <div class="screenshot-header">${viewport}</div>
                <img src="${screenshot}" alt="${route.name} - ${viewport}" onclick="openModal(this.src)">
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <div id="modal" class="modal" onclick="closeModal()">
    <img id="modal-img" src="" alt="">
  </div>

  <script>
    function openModal(src) {
      document.getElementById('modal').classList.add('active');
      document.getElementById('modal-img').src = src;
    }
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;

const indexPath = path.join(SCREENSHOTS_DIR, 'index.html');
fs.writeFileSync(indexPath, html);

console.log('✅ Screenshot index generated!');
console.log(`📄 Open: ${indexPath}`);
