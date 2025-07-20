import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AutoScrollToggle from './components/AutoScrollToggle';
import VideoPlayerObserver from './components/VideoPlayerObserver';
import { setAutoScrollEnabled } from './redux/actions';

function App() {
  const dispatch = useDispatch();
  const autoScrollEnabled = useSelector(state => state.autoScrollEnabled);

  useEffect(() => {
    // Get initial state from Chrome storage
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'getAutoScrollState' }, (response) => {
        if (response) {
          dispatch(setAutoScrollEnabled(response.enabled));
        }
      });
    }
  }, [dispatch]);

  return (
    <div className="app">
      <div className="header">
        <h2>Auto Scroll Extension</h2>
        <p className="subtitle">For Instagram Reels & YouTube Shorts</p>
      </div>
      
      <div className="content">
        <AutoScrollToggle 
          enabled={autoScrollEnabled}
          onToggle={(enabled) => dispatch(setAutoScrollEnabled(enabled))}
        />
        
        <div className="info-section">
          <h3>How it works:</h3>
          <ul>
            <li>Automatically scrolls to the next video when current video ends</li>
            <li>Works on Instagram Reels and YouTube Shorts</li>
            <li>Toggle on/off anytime using the switch above</li>
          </ul>
        </div>
        
        <div className="status">
          <span className={`status-indicator ${autoScrollEnabled ? 'active' : 'inactive'}`}>
            {autoScrollEnabled ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </div>
      
      <VideoPlayerObserver />
    </div>
  );
}

export default App;
