import React from 'react';
import './AutoScrollToggle.css';

const AutoScrollToggle = ({ enabled, onToggle }) => {
  const handleToggle = () => {
    const newState = !enabled;
    onToggle(newState);
    
    // Send message to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'toggleAutoScroll',
        value: newState
      });
    }
  };

  return (
    <div className="toggle-container">
      <div className="toggle-header">
        <label htmlFor="auto-scroll-toggle" className="toggle-label">
          Auto Scroll
        </label>
        <span className="toggle-description">
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      
      <div className="toggle-switch-container">
        <input
          id="auto-scroll-toggle"
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          className="toggle-input"
        />
        <label htmlFor="auto-scroll-toggle" className="toggle-switch">
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  );
};

export default AutoScrollToggle;
