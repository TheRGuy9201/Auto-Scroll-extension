// Background service worker for the extension
let autoScrollEnabled = false;

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, initializing state to OFF');
  autoScrollEnabled = false;
  chrome.storage.sync.set({ autoScrollEnabled: false }, () => {
    console.log('State initialized to OFF in storage');
  });
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAutoScroll') {
    autoScrollEnabled = request.value;
    
    // Save state to storage
    chrome.storage.sync.set({ autoScrollEnabled: request.value });
    
    // Send message to all tabs with Instagram or YouTube
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url?.includes('instagram.com') || tab.url?.includes('youtube.com')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'toggleAutoScroll',
            value: request.value
          }).catch(() => {
            // Ignore errors for tabs that don't have content script
          });
        }
      });
    });
    
    sendResponse({ status: 'success' });
  } else if (request.action === 'getAutoScrollState') {
    // First try from memory
    if (typeof autoScrollEnabled !== 'undefined') {
      console.log('Using in-memory state:', autoScrollEnabled);
      sendResponse({ enabled: autoScrollEnabled });
      return false;
    }
    
    // If not available in memory, get from storage
    chrome.storage.sync.get(['autoScrollEnabled'], (result) => {
      const state = result.autoScrollEnabled ?? false;
      console.log('Retrieved state from storage:', state);
      // Update memory state
      autoScrollEnabled = state;
      sendResponse({ enabled: state });
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'resetAutoScrollState') {
    // Force reset to OFF state (used for troubleshooting)
    console.log('Forcing reset of auto-scroll state to OFF');
    autoScrollEnabled = false;
    chrome.storage.sync.set({ autoScrollEnabled: false });
    sendResponse({ status: 'reset to OFF' });
  }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url?.includes('instagram.com') || tab.url?.includes('youtube.com'))) {
    
    // Send current state to the tab
    chrome.storage.sync.get(['autoScrollEnabled'], (result) => {
      chrome.tabs.sendMessage(tabId, {
        action: 'toggleAutoScroll',
        value: result.autoScrollEnabled ?? false
      }).catch(() => {
        // Ignore errors for tabs that don't have content script loaded yet
      });
    });
  }
});
