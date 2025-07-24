import React, { useEffect, useState } from 'react';

function App() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load initial state from storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get("toggleState", ({ toggleState }) => {
        setIsEnabled(toggleState || false);
        console.log("Popup loaded, toggle state:", toggleState);
      });
    }
  }, []);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    // Save to storage - this will trigger the content script
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ toggleState: newState });
      console.log("Toggle set to:", newState);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h2>Auto Scroll Extension</h2>
        <p className="subtitle">For Instagram Reels & YouTube Shorts</p>
      </div>
      
      <div className="content">
        <div className="toggle-container">
          <div className="toggle-header">
            <label htmlFor="auto-scroll-toggle" className="toggle-label">
              Auto Scroll
            </label>
            <span className="toggle-description">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="toggle-switch-container">
            <input
              id="auto-scroll-toggle"
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggle}
              className="toggle-input"
            />
            <label htmlFor="auto-scroll-toggle" className="toggle-switch">
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="info-section">
          <h3>How it works:</h3>
          <ul>
            <li>Automatically scrolls to the next video when current video ends</li>
            <li>On replay: waits 0.5s then scrolls to next video</li>
            <li>Works on Instagram Reels and YouTube Shorts</li>
            <li>Toggle on/off anytime using the switch above</li>
          </ul>
        </div>
        
        <div className="status">
          <span className={`status-indicator ${isEnabled ? 'active' : 'inactive'}`}>
            {isEnabled ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
