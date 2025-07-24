// content.js
let isAutoScrollEnabled = false;
let attachedVideos = new Set();
let observer = null;
let lastScrollTime = 0;
const SCROLL_COOLDOWN = 3000; // 3 seconds between scrolls

// Check if we're on a supported platform and page
function isSupportedPage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  if (hostname.includes('instagram.com')) {
    // Check for Reels pages
    return pathname.includes('/reels/') || 
           pathname.includes('/reel/') || 
           document.querySelector('[aria-label*="Reel"]') ||
           document.querySelector('article[role="presentation"]');
  }
  
  if (hostname.includes('youtube.com')) {
    // Check for Shorts pages
    return pathname.includes('/shorts/') ||
           document.querySelector('#shorts-container') ||
           document.querySelector('ytd-shorts');
  }
  
  return false;
}

// Get platform-specific scroll function
function getScrollFunction() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('instagram.com')) {
    return () => {
      // Try Instagram-specific scrolling first
      const reelsContainer = document.querySelector('main[role="main"]') || 
                            document.querySelector('section') ||
                            document.querySelector('article[role="presentation"]')?.parentElement;
      
      if (reelsContainer) {
        reelsContainer.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      } else {
        // Fallback to window scroll
        window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      }
    };
  }
  
  if (hostname.includes('youtube.com')) {
    return () => {
      // Try YouTube Shorts specific scrolling
      const shortsContainer = document.querySelector('#shorts-container') ||
                             document.querySelector('ytd-shorts') ||
                             document.querySelector('#content');
      
      if (shortsContainer) {
        shortsContainer.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      } else {
        // Fallback methods for YouTube
        window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        
        // Also try keyboard navigation as backup
        setTimeout(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'ArrowDown', 
            bubbles: true 
          }));
        }, 100);
      }
    };
  }
  
  // Default scroll function
  return () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };
}

// Load initial state from storage
chrome.storage.sync.get("toggleState", ({ toggleState }) => {
  isAutoScrollEnabled = toggleState || false;
  console.log("Initial state loaded:", isAutoScrollEnabled);
  
  if (isAutoScrollEnabled && isSupportedPage()) {
    setupAutoScroll();
  }
});

// Listen for toggle state changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.toggleState) {
    isAutoScrollEnabled = changes.toggleState.newValue;
    console.log("Toggle switched to", isAutoScrollEnabled);
    
    if (isAutoScrollEnabled && isSupportedPage()) {
      setupAutoScroll();
    } else {
      removeAllHandlers();
    }
  }
});

const videoSelector = "video";

function setupAutoScroll() {
  console.log("Setting up auto scroll");
  
  if (!isSupportedPage()) {
    console.log("Not on a supported page, skipping setup");
    return;
  }
  
  // Clean up existing observer if any
  if (observer) {
    observer.disconnect();
  }
  
  // Create new observer to watch for new videos
  observer = new MutationObserver(() => {
    attachToNewVideos();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  attachToNewVideos();
}

function attachToNewVideos() {
  const videos = document.querySelectorAll(videoSelector);
  console.log(`Found ${videos.length} videos on page`);

  videos.forEach(video => {
    if (attachedVideos.has(video)) return;

    // Handler for when video ends
    const onEnded = () => {
      if (!isAutoScrollEnabled) return;
      
      // Rate limiting
      const now = Date.now();
      if (now - lastScrollTime < SCROLL_COOLDOWN) {
        console.log("Scroll cooldown active, skipping");
        return;
      }
      
      console.log("Video ended, scrolling to next");
      lastScrollTime = now;
      
      const scrollFn = getScrollFunction();
      scrollFn();
    };

    // Handler for replay detection - more conservative approach
    const onTimeUpdate = () => {
      if (!isAutoScrollEnabled || !video.duration) return;
      
      // Only consider it a replay if:
      // 1. Video was near the end (>90%) and suddenly back to beginning (<5%)
      // 2. AND it's been at least 1 second since the last scroll
      const progress = video.currentTime / video.duration;
      const now = Date.now();
      
      if (video._wasNearEnd && 
          progress < 0.05 && 
          now - lastScrollTime > 1000) {
        
        console.log("Video replay detected, scrolling after 0.5s");
        lastScrollTime = now;
        
        setTimeout(() => {
          if (isAutoScrollEnabled) {
            const scrollFn = getScrollFunction();
            scrollFn();
          }
        }, 500);
        
        video._wasNearEnd = false;
      }
      
      // Track if video is near end
      video._wasNearEnd = progress > 0.9;
    };

    // Attach event listeners
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);

    attachedVideos.add(video);

    // Store handlers for cleanup
    video._onEnded = onEnded;
    video._onTimeUpdate = onTimeUpdate;
    
    console.log("Attached handlers to video");
  });
}

function removeAllHandlers() {
  console.log("Removing all handlers");
  
  // Disconnect observer
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  // Remove all event listeners
  attachedVideos.forEach(video => {
    if (video._onEnded) {
      video.removeEventListener("ended", video._onEnded);
    }
    if (video._onTimeUpdate) {
      video.removeEventListener("timeupdate", video._onTimeUpdate);
    }
    delete video._onEnded;
    delete video._onTimeUpdate;
    delete video._wasNearEnd;
  });
  
  attachedVideos.clear();
}

// Initialize on page load and when URL changes (for SPAs)
function initialize() {
  console.log("Initializing content script");
  console.log("Current URL:", window.location.href);
  console.log("Is supported page:", isSupportedPage());
  
  if (isAutoScrollEnabled && isSupportedPage()) {
    setupAutoScroll();
  }
}

// Handle SPA navigation
let currentUrl = window.location.href;
const urlCheckInterval = setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log("URL changed, reinitializing");
    
    // Clean up and reinitialize
    removeAllHandlers();
    lastScrollTime = 0; // Reset scroll timing
    
    setTimeout(() => {
      initialize();
    }, 1000);
  }
}, 1000);

// Initialize immediately
initialize();

// Add debug function for testing
window._autoScrollDebug = {
  status: () => ({
    enabled: isAutoScrollEnabled,
    supportedPage: isSupportedPage(),
    videosAttached: attachedVideos.size,
    lastScrollTime: lastScrollTime,
    url: window.location.href
  }),
  forceScroll: () => {
    const scrollFn = getScrollFunction();
    scrollFn();
  },
  toggle: () => {
    chrome.storage.sync.set({ toggleState: !isAutoScrollEnabled });
  }
};
