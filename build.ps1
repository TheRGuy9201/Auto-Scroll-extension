echo "Building Auto Scroll Extension..."

# Create build directory if it doesn't exist
if (-not (Test-Path -Path "build")) {
    New-Item -Path "build" -ItemType Directory
}

# Copy manifest
Write-Host "Copying manifest.json..."
Copy-Item -Path "public\manifest.json" -Destination "build\manifest.json"

# Copy background script
Write-Host "Copying background.js..."
Copy-Item -Path "public\background.js" -Destination "build\background.js"

# Copy content script
Write-Host "Copying content.js..."
Copy-Item -Path "public\content.js" -Destination "build\content.js"

# Build React app
Write-Host "Building React app..."
npm run build

# Copy built files to build directory
Write-Host "Copying React build to extension build..."
Copy-Item -Path "build\static" -Destination "build\static" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "build\index.html" -Destination "build\index.html" -Force -ErrorAction SilentlyContinue

Write-Host "Extension built successfully! Load the 'build' folder in Chrome extensions page."
