// Content script for Instagram Reels and YouTube Shorts auto-scrolling
(() => {
  console.log("🚀 Auto Scroll Extension Content Script LOADED");
  let autoScrollEnabled = false;
  let observer = null;
  let scrollTimeout = null;
  let isScrolling = false;
  const DEBUG = true; // Enable debugging

  // Enhanced debug logging utility with timestamps and caller info
  function debug(...args) {
    if (DEBUG) {
      const timestamp = new Date().toISOString().substr(11, 8);
      
      // Try to get caller info
      let callerInfo = '';
      try {
        throw new Error();
      } catch (e) {
        const callerLine = e.stack.split('\n')[2].trim();
        const match = callerLine.match(/at\s+(\w+)\s+\(/);
        if (match && match[1]) {
          callerInfo = match[1] + ': ';
        }
      }
      
      console.log(`📺 AUTO-SCROLL [${timestamp}] ${callerInfo}`, ...args);
    }
  }

  // Configuration for different platforms
  const config = {
    instagram: {
      videoSelector: 'video, div[role="dialog"] video, div[role="presentation"] video, article video, .EmbeddedMediaImage + div > video, .VideoPlayerContainer video',
      nextVideoTrigger: () => {
        debug('Executing Instagram scroll trigger');
        
        // Try multiple methods for more reliable scrolling
        
        // Method 1: Try to find and click a "Next" button
        const nextButton = document.querySelector('button[aria-label*="Next"]') || 
                          document.querySelector('button[aria-label*="next"]') ||
                          document.querySelector('button svg[aria-label*="Next"]')?.closest('button');
        
        if (nextButton) {
          debug('Found Next button, clicking it');
          nextButton.click();
          return;
        }
        
        // Method 2: Try container-specific scrolling
        const reelsContainer = document.querySelector('main[role="main"]') || 
                              document.querySelector('[data-testid="reels-viewer"]') ||
                              document.querySelector('section') ||
                              document.querySelector('article[role="presentation"]')?.parentElement;
        
        if (reelsContainer) {
          debug('Found reels container, scrolling it', reelsContainer);
          reelsContainer.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
          });
          return;
        }
        
        // Method 3: Simulate down arrow key
        debug('No specific container found, simulating down arrow key');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        
        // Method 4: Fallback to window scroll
        setTimeout(() => {
          debug('Fallback to window scroll');
          window.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
          });
        }, 100);
      },
      isReelsPage: () => {
        // More comprehensive checks for Instagram Reels
        const url = window.location.pathname;
        
        // URL-based detection
        const hasReelInUrl = url.includes('/reels/') || 
                            url.includes('/reel/') || 
                            url.includes('/stories/');
        
        // Element-based detection
        const selectors = [
          '[aria-label*="Reel"]',
          '[aria-label*="reel"]',
          '[data-testid*="reel"]',
          'article[role="presentation"]',
          'div[role="dialog"] video',
          'div.EmbeddedMediaImage + div > video',
          '.VideoPlayerContainer video'
        ];
        
        let hasReelElements = false;
        for (const selector of selectors) {
          if (document.querySelector(selector)) {
            debug(`Instagram Reels detected via selector: ${selector}`);
            hasReelElements = true;
            break;
          }
        }
        
        // Also check for video elements that could be reels
        const videoElements = document.querySelectorAll('video');
        if (videoElements.length > 0) {
          for (const video of videoElements) {
            // Check if this looks like a reel video (fullscreen-like)
            const rect = video.getBoundingClientRect();
            if (rect.height > window.innerHeight * 0.7) {
              debug('Found large video element that might be a Reel');
              hasReelElements = true;
              break;
            }
          }
        }
        
        return hasReelInUrl || hasReelElements;
      }
    },
    youtube: {
      videoSelector: 'video, ytd-reel-video-renderer video, ytd-shorts video, #shorts-player video, .html5-video-container video, ytd-shorts-player-container video, #shorts-inner-container video',
      nextVideoTrigger: () => {
        debug('Executing YouTube scroll trigger');
        
        // Clear any existing scroll timeout to avoid multiple scrolls
        if (window._youtubeScrollTimeout) {
          clearTimeout(window._youtubeScrollTimeout);
        }
        
        // Method 1: Try to find and click the Next button or navigation controls
        const nextButtons = [
          'button.ytp-next-button',
          'button[aria-label*="Next"]',
          'button[aria-label*="next"]',
          'a.ytp-next-button',
          'ytd-thumbnail[aria-label*="Shorts"]',
          '.ytp-suggestion-set .ytp-suggestion-link'
        ];
        
        let buttonClicked = false;
        for (const selector of nextButtons) {
          const buttons = document.querySelectorAll(selector);
          if (buttons.length > 0) {
            debug(`Found ${buttons.length} YouTube buttons with selector: ${selector}`);
            
            for (const button of buttons) {
              // Check if the button is visible
              const rect = button.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && 
                  rect.bottom > 0 && rect.right > 0 && 
                  rect.top < window.innerHeight && rect.left < window.innerWidth) {
                
                debug(`Clicking visible YouTube button: ${selector}`);
                button.click();
                buttonClicked = true;
                break;
              }
            }
            
            if (buttonClicked) break;
          }
        }
        
        if (buttonClicked) {
          debug('Successfully clicked a navigation button');
          return;
        }
        
        // Method 2: Try to find YouTube-specific navigation elements
        debug('Trying YouTube-specific navigation');
        
        // Check for the "Next" button in the player
        try {
          const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
          if (player && typeof player.nextVideo === 'function') {
            debug('Found YouTube player with nextVideo method');
            player.nextVideo();
            return;
          }
        } catch (e) {
          debug('Error accessing player.nextVideo:', e);
        }
        
        // Method 3: Try to find the specific shorts container
        const containerSelectors = [
          '#shorts-container', 
          '[data-shorts-container]', 
          '#player-container-inner',
          'ytd-shorts',
          'ytd-reel-video-renderer',
          '#shorts-inner-container',
          'ytd-shorts-page-component',
          '.style-scope.ytd-shorts'
        ];
        
        let shortsContainer = null;
        for (const selector of containerSelectors) {
          shortsContainer = document.querySelector(selector);
          if (shortsContainer) {
            debug(`Found shorts container with selector: ${selector}`);
            break;
          }
        }
        
        if (shortsContainer) {
          debug('Scrolling shorts container');
          
          // Try multiple scroll methods for better reliability
          try {
            // Method 1: Standard scrollBy
            shortsContainer.scrollBy({
              top: window.innerHeight,
              behavior: 'smooth'
            });
            
            // Method 2: Set scrollTop directly
            setTimeout(() => {
              const currentScrollTop = shortsContainer.scrollTop;
              shortsContainer.scrollTop = currentScrollTop + window.innerHeight;
              debug(`Direct scrollTop: ${currentScrollTop} -> ${shortsContainer.scrollTop}`);
            }, 100);
            
            return;
          } catch (e) {
            debug('Error scrolling container:', e);
          }
        }
        
        // Method 4: Enhanced key simulation
        debug('Using enhanced key simulation for YouTube');
        
        // Simulate sequence of keys: Down arrow, then Space, then Page Down
        document.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'ArrowDown', 
          code: 'ArrowDown',
          keyCode: 40,
          bubbles: true 
        }));
        
        setTimeout(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: ' ', 
            code: 'Space',
            keyCode: 32,
            bubbles: true 
          }));
        }, 150);
        
        setTimeout(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'PageDown', 
            code: 'PageDown',
            keyCode: 34,
            bubbles: true 
          }));
        }, 300);
        
        // Method 5: More aggressive fallback for YouTube
        setTimeout(() => {
          debug('Using aggressive fallback methods for YouTube scrolling');
          
          // Try to find the next video by looking for the current one and scrolling to the next
          try {
            const currentVideo = document.querySelector('ytd-shorts video');
            if (currentVideo) {
              const allShortElements = Array.from(document.querySelectorAll('ytd-shorts, ytd-reel-video-renderer'));
              const currentShort = currentVideo.closest('ytd-shorts, ytd-reel-video-renderer');
              
              if (currentShort) {
                const currentIndex = allShortElements.indexOf(currentShort);
                if (currentIndex !== -1 && allShortElements[currentIndex + 1]) {
                  debug('Found next Short element, scrolling to it');
                  allShortElements[currentIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
              }
            }
          } catch (e) {
            debug('Error finding next Short element:', e);
          }
          
          // First attempt - standard scroll
          window.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
          });
          
          // Second attempt - use keyboard simulation after a delay
          setTimeout(() => {
            debug('Trying keyboard navigation');
            // Try to focus the player first
            const player = document.querySelector('ytd-shorts video');
            if (player) player.focus();
            
            // Send a sequence of keys - J key is YouTube's shortcut for next video
            ['j', 'n', 'ArrowDown'].forEach(key => {
              document.dispatchEvent(new KeyboardEvent('keydown', {
                key: key,
                code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
                bubbles: true
              }));
            });
          }, 200);
          
          // Third attempt - larger scroll after a delay
          setTimeout(() => {
            debug('Large scroll attempt');
            window.scrollBy({
              top: window.innerHeight * 1.5,
              behavior: 'smooth'
            });
          }, 400);
        }, 300);
      },
      isShortsPage: () => {
        // More comprehensive checks for YouTube Shorts
        const url = window.location.pathname;
        const hasShortsInUrl = url.includes('/shorts/');
        
        if (hasShortsInUrl) {
          debug('YouTube Shorts detected via URL pattern');
          return true;
        }
        
        // Element-based detection to handle YouTube's dynamic nature
        const shortsSelectors = [
          '#shorts-container', 
          '[data-shorts-container]',
          'ytd-shorts', 
          'ytd-reel-video-renderer',
          '.short-video',
          'ytd-shorts-player-container',
          '#shorts-inner-container',
          'ytd-shorts-carousel-renderer',
          'ytd-shorts-compact-video-renderer',
          'ytd-shorts-video-renderer'
        ];
        
        let hasShortsElements = false;
        for (const selector of shortsSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            debug(`YouTube Shorts detected via selector: ${selector}`);
            hasShortsElements = true;
            break;
          }
        }
        
        // Also check for shorts-specific video players
        const videoElements = document.querySelectorAll('video');
        if (videoElements.length > 0) {
          const shortsPlayer = Array.from(videoElements).find(video => {
            // Check if this video is in a shorts container or has shorts-specific attributes
            const parent = video.closest('#shorts-container, [data-shorts-container], ytd-shorts');
            return parent !== null;
          });
          
          if (shortsPlayer) {
            debug('Found video element inside a Shorts container');
            hasShortsElements = true;
          }
        }
        
        const result = hasShortsInUrl || hasShortsElements;
        if (result) debug('YouTube Shorts page detected');
        return result;
      }
    }
  };

  // Determine current platform
  function getCurrentPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('instagram.com')) {
      return config.instagram.isReelsPage() ? 'instagram' : null;
    } else if (hostname.includes('youtube.com')) {
      return config.youtube.isShortsPage() ? 'youtube' : null;
    }
    return null;
  }
  
  // Handle video end event with improved YouTube handling
  function handleVideoEnd(video) {
    debug(`Video ended event triggered, auto-scroll enabled: ${autoScrollEnabled}, isScrolling: ${isScrolling}`);
    
    // Clear any existing timeouts
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
    }
    
    if (!autoScrollEnabled) {
      debug('Auto-scroll is disabled');
      return;
    }
    
    const platform = getCurrentPlatform();
    if (!platform) {
      debug('Unsupported platform or not on a Reels/Shorts page');
      return;
    }
    
    // For YouTube specifically, override isScrolling check if the video has looped
    // This ensures we scroll even if another scroll was recently triggered
    if (isScrolling) {
      if (platform === 'youtube' && video._waitingForLoop) {
        debug('Overriding scroll lock for YouTube loop');
      } else {
        debug('Scrolling already in progress, skipping');
        return;
      }
    }
    
    debug(`Platform detected: ${platform}, preparing to scroll...`);
    isScrolling = true;
    
    // Platform-specific delay - shorter for YouTube loops
    const delay = (platform === 'youtube' && video._waitingForLoop) ? 100 : 500;
    
    // Add delay before scrolling
    scrollTimeout = setTimeout(() => {
      try {
        debug(`Executing scroll on ${platform}...`);
        config[platform].nextVideoTrigger();
        
        // Double-check that we're actually on a valid platform page
        if (platform === 'youtube' && !config.youtube.isShortsPage()) {
          debug('Warning: YouTube page but not on Shorts page, might not scroll correctly');
        }
      } catch (e) {
        debug('Error during scroll:', e);
      }
      
      // Reset scrolling flag after scroll completes
      setTimeout(() => {
        debug('Scroll completed, resetting scroll flag');
        isScrolling = false;
      }, 1000);
    }, delay);
  }
  
  // Enhanced video end detection using timeupdate
  function setupTimeUpdateHandler(video, platform) {
    // Remove existing handlers to avoid duplicates
    video.removeEventListener('timeupdate', video._timeUpdateHandler);
    
    // Track last time updates for stall detection
    video._lastTimeUpdate = Date.now();
    video._lastTimeValue = video.currentTime;
    video._endDetectionAttempts = 0;
    
    // Create and store handler function with enhanced detection specifically for YouTube Shorts
    video._timeUpdateHandler = () => {
      const now = Date.now();
      
      // First check if auto-scroll is enabled before doing any processing
      if (!autoScrollEnabled) {
        // Still update tracking values but don't do any processing
        video._lastTimeUpdate = now;
        video._lastTimeValue = video.currentTime;
        return;
      }
      
      // Update tracking values
      video._lastTimeUpdate = now;
      
      // For YouTube, make sure we're checking at least every 100ms for more reliable loop detection
      if (platform === 'youtube' && !video._moreFrequentUpdates) {
        video._moreFrequentUpdates = true;
        // Force more frequent timeupdate checks for YouTube
        video._frequentUpdateInterval = setInterval(() => {
          // Check if auto-scroll is still enabled in the interval
          if (!autoScrollEnabled && video._frequentUpdateInterval) {
            clearInterval(video._frequentUpdateInterval);
            video._frequentUpdateInterval = null;
            return;
          }
          
          // Compare current time with last recorded time to detect loops
          if (video._lastTimeValue > 0 && 
              video._lastTimeValue > video.currentTime && 
              video._lastTimeValue > video.duration * 0.5) {
            // Log loop detection with clear signature
            debug(`🔄 LOOP CHECK: Detected loop from ${video._lastTimeValue.toFixed(2)} to ${video.currentTime.toFixed(2)}`);
            // Manually trigger the timeupdate handler to process the loop
            video._timeUpdateHandler();
          }
          // Update the last time value
          video._lastTimeValue = video.currentTime;
        }, 100);
        
        // Clean up interval when video is removed
        const clearInterval = () => {
          if (video._frequentUpdateInterval) {
            clearInterval(video._frequentUpdateInterval);
            video._frequentUpdateInterval = null;
          }
        };
        video.addEventListener('remove', clearInterval);
        video.addEventListener('unload', clearInterval);
      }
      
      // Platform-specific end thresholds
      let endThreshold = 0.5; // default: 0.5 seconds from end
      if (platform === 'instagram') {
        endThreshold = 0.3; // Instagram videos may end a bit earlier
      } else if (platform === 'youtube') {
        endThreshold = 0.7; // YouTube videos may have credits at the end
      }
      
      // Calculate progress percentage
      const progress = video.currentTime / video.duration;
      
      // Case 1: Standard near-end detection
      if (video.duration > 0 && !isNaN(video.duration) && 
          video.currentTime > 0 && 
          video.duration - video.currentTime < endThreshold &&
          !video.paused && !video.dataset.triggered) {
        
        debug(`Video near end detected (${progress.toFixed(2) * 100}%): ${video.currentTime.toFixed(1)}/${video.duration.toFixed(1)}`);
        
        // Mark as triggered to avoid multiple scrolls
        video.dataset.triggered = 'true';
        handleVideoEnd(video);
        
        // Reset after some time
        setTimeout(() => {
          delete video.dataset.triggered;
        }, 2000);
      }
      
      // Case 2: Detect repeating/looping videos (common on reels/shorts)
      // For YouTube Shorts, we want to wait exactly 0.5s after detecting a loop
      if (video._lastTimeValue > video.currentTime && video._lastTimeValue > video.duration * 0.5) {
        // Time jumped backward from near the end to the beginning - video loop detected
        const jumpSize = video._lastTimeValue - video.currentTime;
        debug(`VIDEO LOOP DETECTED: jumped from ${video._lastTimeValue.toFixed(2)} to ${video.currentTime.toFixed(2)}, jumpSize: ${jumpSize.toFixed(2)}, platform: ${platform}`);
        
        // For YouTube, we want this to happen EVERY time we detect a loop
        if (platform === 'youtube') {
          // Cancel any existing timers to avoid multiple scrolls
          if (video._loopTimer) {
            debug('Canceling existing loop timer');
            clearTimeout(video._loopTimer);
            video._loopTimer = null;
          }
          
          // Log the loop detection with a very clear message
          debug('📱 YOUTUBE SHORTS LOOP DETECTED - WAITING EXACTLY 0.5s BEFORE SCROLLING');
          
          // Save the detection time for debugging
          video._loopDetectedTime = Date.now();
          
          // Set up a GUARANTEED timer that will scroll after exactly 0.5s
          video._loopTimer = setTimeout(() => {
            // Double-check that auto-scroll is still enabled when the timer fires
            if (!autoScrollEnabled) {
              debug('Auto-scroll is now disabled, cancelling scroll after loop detection');
              return;
            }
            
            const elapsedSinceLoop = Date.now() - video._loopDetectedTime;
            debug(`⏱️ YOUTUBE LOOP WAIT COMPLETE (${elapsedSinceLoop}ms) - NOW SCROLLING TO NEXT VIDEO`);
            
            // Force scrolling regardless of any other conditions
            isScrolling = false;
            video._waitingForLoop = true;
            
            // Call our scroll function directly rather than through handleVideoEnd
            // to ensure we actually scroll regardless of other conditions
            try {
              config.youtube.nextVideoTrigger();
              
              // Reset scrolling flag after scroll completes
              setTimeout(() => {
                debug('Scroll completed, resetting scroll flag');
                isScrolling = false;
                video._waitingForLoop = false;
              }, 1000);
            } catch (e) {
              debug('Error during forced scroll:', e);
              isScrolling = false;
              video._waitingForLoop = false;
            }
          }, 500); // Exactly 0.5 seconds - this is critical
          
        } else if (!video.dataset.triggered) {
          // For non-YouTube platforms, use the original behavior
          video.dataset.triggered = 'true';
          debug('Non-YouTube video loop, scrolling immediately');
          handleVideoEnd(video);
          
          // Reset trigger after a longer time to avoid multiple triggers
          setTimeout(() => {
            delete video.dataset.triggered;
          }, 3000);
        }
      }
      
      // Case 3: Progressive detection - as we get closer to the end, be more aggressive
      // This helps with videos that don't properly fire ended events
      if (video.duration > 0 && !isNaN(video.duration) && progress > 0.85 && !video.dataset.triggered) {
        video._endDetectionAttempts++;
        
        // As we get more attempts at high progress, increase likelihood of triggering
        if (video._endDetectionAttempts > 3) {
          debug(`High progress detection (${progress.toFixed(2) * 100}%) with ${video._endDetectionAttempts} attempts`);
          video.dataset.triggered = 'true';
          handleVideoEnd(video);
          
          setTimeout(() => {
            delete video.dataset.triggered;
          }, 2000);
        }
      } else if (progress < 0.8) {
        // Reset counter when not near the end
        video._endDetectionAttempts = 0;
      }
      
      // Store current time for next comparison
      video._lastTimeValue = video.currentTime;
    };
    
    // Add the handler
    video.addEventListener('timeupdate', video._timeUpdateHandler);
    debug('Added enhanced timeupdate handler to video');
  }

  // Set up video observers
  function setupVideoObservers() {
    // Don't set up observers if auto-scroll is disabled
    if (!autoScrollEnabled) {
      debug('Auto-scroll is disabled, skipping video observer setup');
      return;
    }
    
    const platform = getCurrentPlatform();
    if (!platform) {
      debug('Not on a supported platform, skipping video observer setup');
      return;
    }

    debug(`Setting up video observers for ${platform}`);

    // Clear existing observers and clean up listeners
    if (observer) {
      debug('Disconnecting existing observer');
      observer.disconnect();
      observer = null;
    }
    
    // Clean up any existing listeners before setting up new ones
    cleanupAllVideoListeners();

    // Clean up all video event listeners across the page
  function cleanupAllVideoListeners() {
    debug('Cleaning up all video listeners');
    
    // Clear any existing observers
    if (observer) {
      observer.disconnect();
      observer = null;
      debug('Disconnected mutation observer');
    }
    
    // Find all videos with our data attribute and clean them up
    const videos = document.querySelectorAll('video[data-scroll-attached="true"]');
    debug(`Found ${videos.length} videos with event listeners to clean up`);
    
    videos.forEach(video => {
      // Clear all timers
      if (video._loopTimer) {
        clearTimeout(video._loopTimer);
        video._loopTimer = null;
      }
      if (video._youtubeLoopTimer) {
        clearTimeout(video._youtubeLoopTimer);
        video._youtubeLoopTimer = null;
      }
      if (video._frequentUpdateInterval) {
        clearInterval(video._frequentUpdateInterval);
        video._frequentUpdateInterval = null;
      }
      
      // Remove all event listeners
      if (video._endedHandler) {
        video.removeEventListener('ended', video._endedHandler);
      }
      if (video._timeUpdateHandler) {
        video.removeEventListener('timeupdate', video._timeUpdateHandler);
      }
      if (video._youtubeLoopHandler) {
        video.removeEventListener('timeupdate', video._youtubeLoopHandler);
      }
      if (video._pauseHandler) {
        video.removeEventListener('pause', video._pauseHandler);
      }
      if (video._errorHandler) {
        video.removeEventListener('error', video._errorHandler);
      }
      if (video._stalledHandler) {
        video.removeEventListener('stalled', video._stalledHandler);
      }
      
      // Remove our data attribute
      delete video.dataset.scrollAttached;
      delete video.dataset.triggered;
      
      debug('Cleaned up event listeners for video:', video);
    });
  }

  // Function to attach event listeners to videos
    const attachVideoListeners = (video) => {
      if (video.dataset.scrollAttached) {
        debug('Video already has listeners attached, skipping');
        return;
      }
      
      debug('Attaching listeners to video:', video);
      
      // Mark as attached to prevent duplicate listeners
      video.dataset.scrollAttached = 'true';
      
      // Clear any existing timers
      if (video._loopTimer) {
        clearTimeout(video._loopTimer);
        video._loopTimer = null;
      }
      if (video._youtubeLoopTimer) {
        clearTimeout(video._youtubeLoopTimer);
        video._youtubeLoopTimer = null;
      }
      if (video._frequentUpdateInterval) {
        clearInterval(video._frequentUpdateInterval);
        video._frequentUpdateInterval = null;
      }
      
      // Remove any existing listeners to avoid duplicates
      if (video._endedHandler) video.removeEventListener('ended', video._endedHandler);
      if (video._timeUpdateHandler) video.removeEventListener('timeupdate', video._timeUpdateHandler);
      if (video._youtubeLoopHandler) video.removeEventListener('timeupdate', video._youtubeLoopHandler);
      if (video._pauseHandler) video.removeEventListener('pause', video._pauseHandler);
      if (video._errorHandler) video.removeEventListener('error', video._errorHandler);
      if (video._stalledHandler) video.removeEventListener('stalled', video._stalledHandler);
      
      // Create and store event handlers with better video end detection
      video._endedHandler = () => {
        debug(`Video ended event fired directly (currentTime: ${video.currentTime}, duration: ${video.duration})`);
        // Only process if auto-scroll is enabled
        if (!autoScrollEnabled) {
          debug('Auto-scroll is disabled, ignoring ended event');
          return;
        }
        
        // YouTube sometimes fires 'ended' incorrectly, verify we're really at the end
        if (video.currentTime > 0 && video.duration > 0 && !isNaN(video.duration) &&
            video.currentTime >= video.duration * 0.9) {
          handleVideoEnd(video);
        } else {
          debug('Ignoring false ended event (not near end of video)');
        }
      };
      
      // Add primary ended event listener
      video.addEventListener('ended', video._endedHandler);
      debug('Added ended handler to video');
      
      // Set up timeupdate listener as main detection method (more reliable than ended)
      setupTimeUpdateHandler(video, platform);
      
      // Special handling for YouTube Shorts
      if (platform === 'youtube') {
        // Add a dedicated YouTube loop detector
        debug('Setting up dedicated YouTube Shorts loop detector');
        
        // Track previous time values to detect backwards jumps (loops)
        let previousTimes = [];
        let loopDetectionActive = false;
        
        // Create a specialized listener for YouTube
        video._youtubeLoopHandler = () => {
          // First check if auto-scroll is enabled
          if (!autoScrollEnabled) {
            return; // Don't process anything if auto-scroll is disabled
          }
          
          // Store recent time values (keep last 5)
          previousTimes.push(video.currentTime);
          if (previousTimes.length > 5) previousTimes.shift();
          
          // If we have enough data points, check for a loop
          if (previousTimes.length >= 2) {
            const lastTime = previousTimes[previousTimes.length - 2];
            const currentTime = video.currentTime;
            
            // Check if time jumped backwards significantly (loop)
            if (lastTime > currentTime && lastTime > video.duration * 0.5 && currentTime < video.duration * 0.3) {
              if (!loopDetectionActive) {
                loopDetectionActive = true;
                debug(`⭐ YOUTUBE SHORTS: Definitive loop detected - from ${lastTime.toFixed(2)} to ${currentTime.toFixed(2)}`);
                
                // Set up timer to scroll after exactly 0.5s
                clearTimeout(video._youtubeLoopTimer);
                
                // Start a timer that will scroll after exactly 0.5s, but double check auto-scroll is enabled
                video._youtubeLoopTimer = setTimeout(() => {
                  // Check again that auto-scroll is still enabled when the timer fires
                  if (!autoScrollEnabled) {
                    debug('Auto-scroll is now disabled, cancelling scroll after loop detection');
                    return;
                  }
                  
                  debug('⭐ YOUTUBE SHORTS: 0.5s delay complete - forcing scroll');
                  isScrolling = false; // Reset scrolling flag to ensure we can scroll
                  config.youtube.nextVideoTrigger();
                }, 500);
                
                // Reset detection after a delay
                setTimeout(() => {
                  loopDetectionActive = false;
                }, 3000);
              }
            }
          }
        };
        
        // Add listener for more frequent checks
        video.addEventListener('timeupdate', video._youtubeLoopHandler);
      }
      
      // Additional handlers for more robust detection
      
      // Pause handler - sometimes videos "pause" at the end instead of firing ended
      video._pauseHandler = () => {
        // Only check if it's at the end
        if (video.currentTime > 0 && video.duration > 0 && 
            !isNaN(video.duration) && 
            video.currentTime >= video.duration - 0.5) {
          debug('Video paused near end, treating as ended');
          handleVideoEnd(video);
        } else if (platform === 'youtube' && video.paused && video.currentTime < 1.0) {
          // Special case for YouTube Shorts - sometimes they pause at beginning of loop
          debug('YouTube video paused near start, might be loop restart');
          setTimeout(() => {
            if (video.paused && video.currentTime < 1.0) {
              debug('Video still paused near start, treating as loop');
              handleVideoEnd(video);
            }
          }, 200);
        }
      };
      video.addEventListener('pause', video._pauseHandler);
      
      // Error handler - sometimes videos error out at the end
      video._errorHandler = (e) => {
        debug(`Video error occurred: ${e.type}`);
        if (video.currentTime > 0 && video.currentTime / video.duration > 0.7) {
          // If we're at least 70% through the video, treat errors as potential end
          debug('Video error near end, may need to scroll');
          handleVideoEnd(video);
        }
      };
      video.addEventListener('error', video._errorHandler);
      
      // Stalled handler - detect if video playback stalls
      video._stalledHandler = () => {
        if (video.currentTime > 0 && video.duration > 0 && 
            !isNaN(video.duration) &&
            video.currentTime / video.duration > 0.9) {
          debug('Video stalled near end, treating as ended');
          handleVideoEnd(video);
        }
      };
      video.addEventListener('stalled', video._stalledHandler);
      
      // Log video details
      debug(`Video details - duration: ${video.duration}, readyState: ${video.readyState}, networkState: ${video.networkState}`);
      
      // Add click handler for debug purposes
      video.addEventListener('click', () => {
        debug('Video clicked, current time:', video.currentTime, 'duration:', video.duration, 
             'paused:', video.paused, 'ended:', video.ended);
      });
    };

    // Create new observer for video elements
    observer = new MutationObserver((mutations) => {
      debug('DOM mutation detected, checking for new videos');
      
      // Use a timeout to batch multiple rapid DOM changes
      setTimeout(() => {
        const videos = document.querySelectorAll(config[platform].videoSelector);
        debug(`Found ${videos.length} video elements after DOM change`);
        
        videos.forEach(attachVideoListeners);
      }, 500);
    });

    // Start observing with more comprehensive options
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'style', 'class', 'data-testid', 'aria-label']
    });
    
    // Also set up periodic polling for videos as a fallback
    // This helps with cases where MutationObserver might miss some videos
    const videoCheckInterval = setInterval(() => {
      const platform = getCurrentPlatform();
      if (!platform) {
        clearInterval(videoCheckInterval);
        return;
      }
      
      const videos = document.querySelectorAll(config[platform].videoSelector);
      if (videos.length > 0) {
        debug(`Polling found ${videos.length} videos`);
        videos.forEach(attachVideoListeners);
      }
    }, 2000);

    // Initial setup for existing videos
    const existingVideos = document.querySelectorAll(config[platform].videoSelector);
    debug(`Found ${existingVideos.length} existing video elements`);
    existingVideos.forEach(attachVideoListeners);
    
    // Print DOM structure around videos for debugging
    if (existingVideos.length > 0) {
      debug('First video parent structure:');
      let element = existingVideos[0];
      let path = [];
      for (let i = 0; i < 3; i++) {
        if (!element.parentElement) break;
        element = element.parentElement;
        path.push(element.tagName + (element.id ? `#${element.id}` : '') + 
                 (element.className ? `.${element.className.replace(/ /g, '.')}` : ''));
      }
      debug('Parent path:', path.join(' <- '));
    }
  }

  // Initialize the extension
  function initialize() {
    debug('Auto Scroll Extension initializing');
    
    // Detect platform
    const platform = getCurrentPlatform();
    debug(`Current platform: ${platform || 'unsupported'}`);
    
    if (platform) {
      debug('Setting up video observers for platform:', platform);
      setupVideoObservers();
      
      // Also inject a marker to verify script is running
      const marker = document.createElement('div');
      marker.id = 'auto-scroll-extension-active';
      marker.style.display = 'none';
      document.body.appendChild(marker);
      debug('Injected DOM marker for verification');
      
      // Print current state
      debug(`Auto-scroll currently ${autoScrollEnabled ? 'ENABLED' : 'DISABLED'}`);
      
      // Try to manually identify some video elements
      try {
        const allVideos = document.querySelectorAll('video');
        debug(`Total videos found: ${allVideos.length}`);
        
        if (platform === 'youtube') {
          debug('YouTube-specific selectors:');
          debug('ytd-shorts:', document.querySelectorAll('ytd-shorts').length);
          debug('ytd-reel-video-renderer:', document.querySelectorAll('ytd-reel-video-renderer').length);
          debug('#shorts-container:', document.querySelector('#shorts-container') ? 'found' : 'not found');
        }
        
        if (platform === 'instagram') {
          debug('Instagram-specific selectors:');
          debug('article[role="presentation"]:', document.querySelectorAll('article[role="presentation"]').length);
          debug('[aria-label*="Reel"]:', document.querySelectorAll('[aria-label*="Reel"]').length);
          debug('[data-testid*="reel"]:', document.querySelectorAll('[data-testid*="reel"]').length);
        }
      } catch (e) {
        debug('Error during element detection:', e);
      }
    } else {
      debug('Not on a supported platform, extension inactive');
    }
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleAutoScroll') {
      const oldValue = autoScrollEnabled;
      autoScrollEnabled = request.value;
      debug(`Auto scroll ${autoScrollEnabled ? 'ENABLED' : 'DISABLED'}`);
      sendResponse({ status: 'success' });
      
      if (oldValue !== autoScrollEnabled) {
        // Re-initialize when toggled ON
        if (autoScrollEnabled) {
          debug('Auto-scroll enabled, refreshing video observers');
          setupVideoObservers();
        } 
        // Clean up event listeners when toggled OFF
        else {
          debug('Auto-scroll disabled, cleaning up event listeners');
          cleanupAllVideoListeners();
        }
      }
    }
  });

  // Handle navigation changes (for SPAs like Instagram and YouTube)
  let currentUrl = window.location.href;
  
  // Better SPA navigation detection
  function setupNavigationObserver() {
    debug('Setting up navigation observer for SPA');
    
    // Function to handle URL changes
    function handleUrlChange() {
      const newUrl = window.location.href;
      if (currentUrl !== newUrl) {
        debug(`URL changed: ${currentUrl} -> ${newUrl}`);
        currentUrl = newUrl;
        
        // Reinitialize after navigation
        setTimeout(() => {
          debug('Reinitializing after navigation');
          initialize();
        }, 1000);
      }
    }
    
    // Method 1: Check periodically
    setInterval(handleUrlChange, 1000);
    
    // Method 2: Use History API
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      debug('history.pushState called');
      handleUrlChange();
    };
    
    window.addEventListener('popstate', () => {
      debug('popstate event');
      handleUrlChange();
    });
    
    // Method 3: MutationObserver for title changes
    const titleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target === document.title) {
          debug('Title changed, checking URL');
          handleUrlChange();
        }
      });
    });
    
    titleObserver.observe(document.querySelector('title'), {
      subtree: true,
      characterData: true,
      childList: true
    });
  }

  // Complete initialization
  function fullInitialize() {
    debug('Full initialization starting');
    
    // Set up SPA navigation handling
    setupNavigationObserver();
    
    // Initialize the extension
    initialize();
    
    // Request current auto-scroll state from background
    chrome.runtime.sendMessage({ action: 'getAutoScrollState' }, (response) => {
      if (response) {
        debug(`Got auto-scroll state from background: ${response.enabled}`);
        autoScrollEnabled = response.enabled;
        
        // If enabled, make sure observers are set up
        if (autoScrollEnabled) {
          debug('Auto-scroll is enabled, refreshing video observers');
          setupVideoObservers();
        }
      } else {
        debug('No response from background script for state');
      }
    });
    
    // Add comprehensive controls for debugging
    window._autoScrollDebug = {
      enable: () => {
        autoScrollEnabled = true;
        debug('Auto-scroll manually ENABLED via debug console');
        setupVideoObservers();
        return 'Auto-scroll enabled';
      },
      disable: () => {
        autoScrollEnabled = false;
        debug('Auto-scroll manually DISABLED via debug console');
        return 'Auto-scroll disabled';
      },
      status: () => {
        const platform = getCurrentPlatform();
        debug(`Debug status: platform=${platform}, enabled=${autoScrollEnabled}`);
        
        // Get more detailed video information
        const videos = document.querySelectorAll('video');
        const videoInfo = Array.from(videos).map(v => ({
          duration: v.duration,
          currentTime: v.currentTime,
          paused: v.paused,
          ended: v.ended,
          readyState: v.readyState,
          networkState: v.networkState,
          hasListeners: !!v.dataset.scrollAttached,
          isVisible: v.getBoundingClientRect().top >= 0 && 
                    v.getBoundingClientRect().top < window.innerHeight
        }));
        
        return {
          enabled: autoScrollEnabled,
          platform: platform,
          videos: videos.length,
          videoDetails: videoInfo,
          url: window.location.href,
          isScrolling: isScrolling,
          documentHeight: document.body.scrollHeight,
          viewportHeight: window.innerHeight,
          currentScroll: window.scrollY
        };
      },
      scroll: () => {
        const platform = getCurrentPlatform();
        if (platform) {
          debug('Manually triggering scroll');
          config[platform].nextVideoTrigger();
          return 'Scroll triggered';
        }
        return 'Not on a supported platform';
      },
      reattach: () => {
        debug('Manually reattaching video observers');
        setupVideoObservers();
        return 'Video observers reattached';
      },
      listVideos: () => {
        const videos = document.querySelectorAll('video');
        debug(`Found ${videos.length} videos`);
        
        return Array.from(videos).map((v, i) => {
          const rect = v.getBoundingClientRect();
          return {
            index: i,
            src: v.src || '(no src)',
            duration: v.duration,
            currentTime: v.currentTime,
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            position: `(${Math.round(rect.top)}, ${Math.round(rect.left)})`,
            isVisible: rect.top >= 0 && rect.top < window.innerHeight,
            hasListeners: !!v.dataset.scrollAttached,
            parent: v.parentElement ? v.parentElement.tagName + 
                    (v.parentElement.className ? '.' + v.parentElement.className.replace(/ /g, '.') : '') : 'none'
          };
        });
      },
      forceScrollTo: (index) => {
        const videos = document.querySelectorAll('video');
        if (index >= 0 && index < videos.length) {
          const video = videos[index];
          video.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return `Scrolled to video ${index}`;
        }
        return 'Invalid video index';
      },
      detectPlatform: () => {
        // Manually check platform detection
        const url = window.location.href;
        const hostname = window.location.hostname;
        
        let results = {
          url: url,
          hostname: hostname,
          detected: getCurrentPlatform(),
          tests: {}
        };
        
        if (hostname.includes('instagram.com')) {
          results.tests.instagram = {
            isReelsPage: config.instagram.isReelsPage(),
            reelsInUrl: url.includes('/reels/') || url.includes('/reel/'),
            hasReelElements: document.querySelector('[aria-label*="Reel"]') !== null ||
                           document.querySelector('[data-testid*="reel"]') !== null ||
                           document.querySelector('article[role="presentation"]') !== null,
            videoCount: document.querySelectorAll(config.instagram.videoSelector).length
          };
        }
        
        if (hostname.includes('youtube.com')) {
          results.tests.youtube = {
            isShortsPage: config.youtube.isShortsPage(),
            shortsInUrl: url.includes('/shorts/'),
            hasShortsElements: document.querySelector('#shorts-container') !== null ||
                             document.querySelector('[data-shorts-container]') !== null,
            videoCount: document.querySelectorAll(config.youtube.videoSelector).length
          };
        }
        
        return results;
      }
    };
    
    debug('Initialized debug console commands. Try: window._autoScrollDebug.status()');
  }

  // Initialize when DOM is ready with better initialization for SPAs
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fullInitialize);
  } else {
    fullInitialize();
  }
  
  // Also initialize after a delay to catch dynamically loaded content
  setTimeout(fullInitialize, 1500);
  
  // And re-initialize periodically for YouTube which loads content dynamically
  setInterval(() => {
    const platform = getCurrentPlatform();
    if (platform === 'youtube') {
      debug('Periodic re-initialization for YouTube');
      setupVideoObservers();
    }
  }, 10000); // Every 10 seconds

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (observer) {
      observer.disconnect();
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    debug('Extension cleanup on page unload');
  });
})();
