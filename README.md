# Auto Scroll Extension for Instagram and YouTube

A browser extension that automatically scrolls to the next video on Instagram Reels and YouTube Shorts when the current video finishes playing.

## Features

- ✅ **Auto-scroll functionality** for Instagram Reels and YouTube Shorts
- ✅ **Toggle on/off** via popup interface
- ✅ **Smart video detection** with MutationObserver
- ✅ **Cross-platform support** for both Instagram and YouTube
- ✅ **Smooth scrolling animation**
- ✅ **State persistence** using Chrome storage
- ✅ **Modern React-based popup UI**

## Technology Stack

- **Frontend**: React 18
- **State Management**: Redux Toolkit
- **Browser Extension**: Manifest V3
- **Build Tool**: Webpack & Create React App
- **Styling**: CSS Modules
- **Testing**: Jest & React Testing Library

## Project Structure

```
auto-scroll-extension/
├── public/
│   ├── manifest.json          # Extension manifest
│   ├── background.js          # Background service worker
│   ├── content.js            # Content script for video detection
│   └── index.html            # Popup HTML
├── src/
│   ├── components/
│   │   ├── AutoScrollToggle.js    # Toggle switch component
│   │   └── VideoPlayerObserver.js # Video monitoring component
│   ├── redux/
│   │   ├── store.js               # Redux store configuration
│   │   └── actions.js             # Redux actions
│   ├── utils/
│   │   └── scrollHandler.js       # Scroll utility functions
│   ├── App.js                     # Main App component
│   ├── index.js                   # Entry point
│   └── styles.css                 # Global styles
├── scripts/
│   └── build-extension.js         # Build script
├── package.json
└── README.md
```

## Installation

### For Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TheRGuy9201/Auto-Scroll-extension.git
   cd Auto-Scroll-extension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build` folder from the project directory

### For Users

1. Download the latest release from the [releases page](https://github.com/TheRGuy9201/Auto-Scroll-extension/releases)
2. Extract the ZIP file
3. Follow steps 4 from the development installation above

## Usage

1. **Install the extension** following the installation steps above
2. **Navigate to Instagram Reels or YouTube Shorts**
3. **Click the extension icon** in your browser toolbar
4. **Toggle the auto-scroll feature** on/off using the switch
5. **Watch videos** - the extension will automatically scroll to the next video when each one ends

### Supported Platforms

- ✅ Instagram Reels (`instagram.com/reels/*`)
- ✅ YouTube Shorts (`youtube.com/shorts/*`)

## How It Works

1. **Content Script**: Monitors video elements on Instagram and YouTube pages
2. **Video Detection**: Uses MutationObserver to detect new videos as they load
3. **Event Listening**: Listens for `ended` events on video elements
4. **Smart Scrolling**: Automatically scrolls to the next video with smooth animation
5. **State Management**: Maintains toggle state across browser sessions

## Development

### Available Scripts

- `npm start` - Start React development server
- `npm run build` - Build the extension for production
- `npm test` - Run tests
- `npm run dev` - Build and watch for changes

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Building for Production

```bash
# Build React app and extension
npm run build

# The extension files will be in the 'build' directory
```

## Configuration

The extension can be configured by modifying the following files:

- **Scroll behavior**: Edit `src/utils/scrollHandler.js`
- **Video detection**: Modify selectors in `public/content.js`
- **UI styling**: Update `src/styles.css` and component CSS files
- **Permissions**: Adjust `public/manifest.json`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Extension Not Working

1. **Check if you're on a supported page** (Instagram Reels or YouTube Shorts)
2. **Verify the extension is enabled** in `chrome://extensions/`
3. **Check the toggle state** in the extension popup
4. **Refresh the page** after installing or updating the extension

### Videos Not Auto-Scrolling

1. **Ensure auto-scroll is enabled** in the popup
2. **Check browser console** for any error messages (F12 → Console)
3. **Try disabling other extensions** that might interfere
4. **Reload the extension** in `chrome://extensions/`

### Common Issues

- **Videos don't end naturally**: Some platforms may loop videos indefinitely
- **Slow scrolling**: Adjust scroll timing in `scrollHandler.js`
- **Multiple videos detected**: The extension prioritizes videos in the viewport

## Privacy

This extension:
- ✅ **Only accesses Instagram and YouTube pages**
- ✅ **Does not collect personal data**
- ✅ **Stores only toggle state locally**
- ✅ **Does not send data to external servers**
- ✅ **Open source and transparent**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 1.0.0
- Initial release
- Auto-scroll functionality for Instagram Reels and YouTube Shorts
- React-based popup interface
- Toggle on/off functionality
- State persistence

## Future Enhancements

- [ ] **Customizable scroll speed**
- [ ] **Video duration detection**
- [ ] **Keyboard shortcuts**
- [ ] **More platform support** (TikTok, etc.)
- [ ] **Analytics and usage statistics**
- [ ] **Custom scroll distances**
- [ ] **Dark mode support**

## Support

If you encounter any issues or have suggestions:

1. **Check existing issues**: [GitHub Issues](https://github.com/TheRGuy9201/Auto-Scroll-extension/issues)
2. **Create a new issue**: Provide detailed steps to reproduce the problem
3. **Join discussions**: [GitHub Discussions](https://github.com/TheRGuy9201/Auto-Scroll-extension/discussions)

---

⭐ **Star this repository** if you find it helpful!

Made with ❤️ by [TheRGuy9201](https://github.com/TheRGuy9201)
