const fs = require('fs');
const path = require('path');

// Build extension by copying necessary files to build directory
function buildExtension() {
  const buildDir = path.join(__dirname, '../build');
  const publicDir = path.join(__dirname, '../public');
  
  console.log('Building extension...');

  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Copy manifest.json
  const manifestSrc = path.join(publicDir, 'manifest.json');
  const manifestDest = path.join(buildDir, 'manifest.json');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
  console.log('✓ Copied manifest.json');
}

// Copy content.js
const contentSrc = path.join(publicDir, 'content.js');
const contentDest = path.join(buildDir, 'content.js');
if (fs.existsSync(contentSrc)) {
  fs.copyFileSync(contentSrc, contentDest);
  console.log('✓ Copied content.js');
}  // Copy popup HTML
  const popupSrc = path.join(publicDir, 'index.html');
  const popupDest = path.join(buildDir, 'index.html');
  if (fs.existsSync(popupSrc)) {
    fs.copyFileSync(popupSrc, popupDest);
    console.log('✓ Copied index.html');
  }

  // Create popup.js from React build
  const staticJsDir = path.join(buildDir, 'static/js');
  if (fs.existsSync(staticJsDir)) {
    const jsFiles = fs.readdirSync(staticJsDir).filter(file => file.endsWith('.js'));
    if (jsFiles.length > 0) {
      const mainJsFile = jsFiles.find(file => file.startsWith('main.')) || jsFiles[0];
      const mainJsSrc = path.join(staticJsDir, mainJsFile);
      const popupJsDest = path.join(buildDir, 'popup.js');
      
      if (fs.existsSync(mainJsSrc)) {
        fs.copyFileSync(mainJsSrc, popupJsDest);
        console.log('✓ Created popup.js from React build');
      }
    }
  }

  // Copy CSS files
  const staticCssDir = path.join(buildDir, 'static/css');
  if (fs.existsSync(staticCssDir)) {
    const cssFiles = fs.readdirSync(staticCssDir).filter(file => file.endsWith('.css'));
    if (cssFiles.length > 0) {
      const mainCssFile = cssFiles.find(file => file.startsWith('main.')) || cssFiles[0];
      const mainCssSrc = path.join(staticCssDir, mainCssFile);
      const popupCssDest = path.join(buildDir, 'popup.css');
      
      if (fs.existsSync(mainCssSrc)) {
        fs.copyFileSync(mainCssSrc, popupCssDest);
        console.log('✓ Created popup.css from React build');
        
        // Update HTML to reference the CSS file
        let htmlContent = fs.readFileSync(popupDest, 'utf8');
        htmlContent = htmlContent.replace(
          '</head>',
          '    <link rel="stylesheet" href="popup.css">\n</head>'
        );
        fs.writeFileSync(popupDest, htmlContent);
      }
    }
  }

  console.log('✅ Extension build complete!');
  console.log(`Build directory: ${buildDir}`);
  console.log('\nTo install the extension:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the build directory');
}

buildExtension();
