import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const VideoPlayerObserver = () => {
  const autoScrollEnabled = useSelector(state => state.autoScrollEnabled);
  const [currentPlatform, setCurrentPlatform] = useState('none');
  const [videosDetected, setVideosDetected] = useState(0);

  useEffect(() => {
    // This component runs in the popup context, not the page context
    // So we'll use it to display status information rather than observe videos directly
    
    const checkCurrentTab = async () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            if (tab.url.includes('instagram.com')) {
              setCurrentPlatform('Instagram');
            } else if (tab.url.includes('youtube.com')) {
              setCurrentPlatform('YouTube');
            } else {
              setCurrentPlatform('Other');
            }
          }
        } catch (error) {
          console.error('Error checking current tab:', error);
          setCurrentPlatform('Unknown');
        }
      }
    };

    checkCurrentTab();
  }, []);

  if (currentPlatform === 'none') {
    return null;
  }

  return (
    <div className="video-observer-status">
      <div className="platform-info">
        <strong>Current Platform:</strong> {currentPlatform}
      </div>
      
      {(currentPlatform === 'Instagram' || currentPlatform === 'YouTube') && (
        <div className="observer-status">
          <div className={`observer-indicator ${autoScrollEnabled ? 'monitoring' : 'paused'}`}>
            {autoScrollEnabled ? '👁️ Monitoring videos' : '⏸️ Monitoring paused'}
          </div>
          <div className="observer-details">
            Auto-scroll will activate when videos end on{' '}
            {currentPlatform === 'Instagram' ? 'Reels' : 'Shorts'} pages
          </div>
        </div>
      )}

      {currentPlatform === 'Other' && (
        <div className="platform-warning">
          Extension only works on Instagram Reels and YouTube Shorts
        </div>
      )}
    </div>
  );
};

export default VideoPlayerObserver;
