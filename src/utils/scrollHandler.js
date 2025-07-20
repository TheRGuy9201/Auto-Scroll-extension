// Utility functions for handling scroll behavior

export class ScrollHandler {
  constructor() {
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.config = {
      instagram: {
        containerSelector: 'main[role="main"]',
        videoSelector: 'video',
        scrollAmount: () => window.innerHeight,
        scrollBehavior: 'smooth'
      },
      youtube: {
        containerSelector: '#shorts-container, #content',
        videoSelector: 'video',
        scrollAmount: () => window.innerHeight,
        scrollBehavior: 'smooth'
      }
    };
  }

  /**
   * Determines the current platform based on URL
   * @returns {string|null} Platform name or null if unsupported
   */
  getCurrentPlatform() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    if (hostname.includes('instagram.com')) {
      return this.isReelsPage() ? 'instagram' : null;
    } else if (hostname.includes('youtube.com')) {
      return this.isShortsPage() ? 'youtube' : null;
    }
    return null;
  }

  /**
   * Checks if current page is Instagram Reels
   * @returns {boolean}
   */
  isReelsPage() {
    return window.location.pathname.includes('/reels/') || 
           document.querySelector('[aria-label*="Reel"]') !== null ||
           document.querySelector('article[role="presentation"]') !== null;
  }

  /**
   * Checks if current page is YouTube Shorts
   * @returns {boolean}
   */
  isShortsPage() {
    return window.location.pathname.includes('/shorts/') ||
           document.querySelector('#shorts-container') !== null;
  }

  /**
   * Scrolls to the next video based on platform
   * @param {string} platform - The platform ('instagram' or 'youtube')
   */
  scrollToNextVideo(platform) {
    if (this.isScrolling || !platform) {
      return false;
    }

    this.isScrolling = true;
    const config = this.config[platform];

    try {
      // Find the appropriate container
      const container = document.querySelector(config.containerSelector) || window;
      const scrollAmount = config.scrollAmount();

      if (container === window) {
        window.scrollBy({
          top: scrollAmount,
          behavior: config.scrollBehavior
        });
      } else {
        container.scrollBy({
          top: scrollAmount,
          behavior: config.scrollBehavior
        });
      }

      console.log(`Scrolled ${scrollAmount}px on ${platform}`);
      return true;

    } catch (error) {
      console.error('Error scrolling to next video:', error);
      return false;
    } finally {
      // Reset scrolling flag after animation completes
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
      }, 1000);
    }
  }

  /**
   * Gets all video elements on the current page
   * @param {string} platform - The platform to get videos for
   * @returns {NodeList} List of video elements
   */
  getVideoElements(platform) {
    if (!platform || !this.config[platform]) {
      return document.querySelectorAll('video');
    }
    return document.querySelectorAll(this.config[platform].videoSelector);
  }

  /**
   * Checks if a video element is currently in viewport
   * @param {HTMLVideoElement} video - The video element to check
   * @returns {boolean}
   */
  isVideoInViewport(video) {
    const rect = video.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Video is considered in viewport if more than 50% is visible
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
    const totalArea = rect.width * rect.height;

    return totalArea > 0 && (visibleArea / totalArea) > 0.5;
  }

  /**
   * Gets the currently playing video
   * @param {string} platform - The platform to check
   * @returns {HTMLVideoElement|null}
   */
  getCurrentVideo(platform) {
    const videos = this.getVideoElements(platform);
    
    for (const video of videos) {
      if (!video.paused && this.isVideoInViewport(video)) {
        return video;
      }
    }
    
    // If no playing video found, return the first video in viewport
    for (const video of videos) {
      if (this.isVideoInViewport(video)) {
        return video;
      }
    }
    
    return null;
  }

  /**
   * Cleanup method to clear timeouts and reset state
   */
  cleanup() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    this.isScrolling = false;
  }

  /**
   * Adds event listener to video for auto-scroll on end
   * @param {HTMLVideoElement} video - Video element to monitor
   * @param {string} platform - Current platform
   */
  addVideoEndListener(video, platform) {
    const handleVideoEnd = () => {
      console.log('Video ended, attempting auto-scroll...');
      this.scrollToNextVideo(platform);
    };

    // Remove existing listener to prevent duplicates
    video.removeEventListener('ended', handleVideoEnd);
    video.addEventListener('ended', handleVideoEnd);
    
    return handleVideoEnd;
  }
}

// Create a singleton instance
export const scrollHandler = new ScrollHandler();

// Export individual functions for backward compatibility
export const scrollToNextVideo = (platform) => scrollHandler.scrollToNextVideo(platform);
export const getCurrentPlatform = () => scrollHandler.getCurrentPlatform();
export const isVideoInViewport = (video) => scrollHandler.isVideoInViewport(video);
export const getCurrentVideo = (platform) => scrollHandler.getCurrentVideo(platform);

export default ScrollHandler;
