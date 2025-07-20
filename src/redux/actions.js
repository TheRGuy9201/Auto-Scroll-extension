// Import actions from store
import { setAutoScrollEnabled, setScrollSpeed, setPlatform } from './store';

// Async action creators
export const toggleAutoScroll = (enabled) => (dispatch) => {
  dispatch(setAutoScrollEnabled(enabled));
  
  // Send message to background script
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'toggleAutoScroll',
      value: enabled
    });
  }
};

export const initializeExtension = () => (dispatch) => {
  // Get initial state from Chrome storage
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'getAutoScrollState' }, (response) => {
      if (response) {
        dispatch(setAutoScrollEnabled(response.enabled));
      }
    });
  }
};

// Export the action creators for direct use
export { setAutoScrollEnabled, setScrollSpeed, setPlatform };
