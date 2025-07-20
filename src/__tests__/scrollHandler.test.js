import { ScrollHandler } from '../utils/scrollHandler';

// Mock DOM methods
Object.defineProperty(window, 'scrollBy', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(window, 'innerHeight', {
  value: 1080,
  writable: true
});

Object.defineProperty(window, 'innerWidth', {
  value: 1920,
  writable: true
});

// Mock document methods
document.querySelector = jest.fn();
document.querySelectorAll = jest.fn();

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'www.instagram.com',
    pathname: '/reels/test'
  },
  writable: true
});

describe('ScrollHandler', () => {
  let scrollHandler;

  beforeEach(() => {
    scrollHandler = new ScrollHandler();
    jest.clearAllMocks();
  });

  describe('getCurrentPlatform', () => {
    it('should detect Instagram platform', () => {
      window.location.hostname = 'www.instagram.com';
      window.location.pathname = '/reels/test';
      
      const platform = scrollHandler.getCurrentPlatform();
      expect(platform).toBe('instagram');
    });

    it('should detect YouTube platform', () => {
      window.location.hostname = 'www.youtube.com';
      window.location.pathname = '/shorts/test';
      
      const platform = scrollHandler.getCurrentPlatform();
      expect(platform).toBe('youtube');
    });

    it('should return null for unsupported platforms', () => {
      window.location.hostname = 'www.example.com';
      window.location.pathname = '/test';
      
      const platform = scrollHandler.getCurrentPlatform();
      expect(platform).toBe(null);
    });
  });

  describe('isReelsPage', () => {
    it('should return true for Instagram Reels URL', () => {
      window.location.pathname = '/reels/test';
      
      const isReels = scrollHandler.isReelsPage();
      expect(isReels).toBe(true);
    });

    it('should return true when Reel elements are present', () => {
      window.location.pathname = '/';
      document.querySelector.mockReturnValue(document.createElement('div'));
      
      const isReels = scrollHandler.isReelsPage();
      expect(isReels).toBe(true);
    });

    it('should return false for non-Reels pages', () => {
      window.location.pathname = '/profile/test';
      document.querySelector.mockReturnValue(null);
      
      const isReels = scrollHandler.isReelsPage();
      expect(isReels).toBe(false);
    });
  });

  describe('isShortsPage', () => {
    it('should return true for YouTube Shorts URL', () => {
      window.location.pathname = '/shorts/test';
      
      const isShorts = scrollHandler.isShortsPage();
      expect(isShorts).toBe(true);
    });

    it('should return true when Shorts container is present', () => {
      window.location.pathname = '/';
      document.querySelector.mockReturnValue(document.createElement('div'));
      
      const isShorts = scrollHandler.isShortsPage();
      expect(isShorts).toBe(true);
    });

    it('should return false for non-Shorts pages', () => {
      window.location.pathname = '/watch';
      document.querySelector.mockReturnValue(null);
      
      const isShorts = scrollHandler.isShortsPage();
      expect(isShorts).toBe(false);
    });
  });

  describe('scrollToNextVideo', () => {
    it('should scroll down for Instagram platform', () => {
      const result = scrollHandler.scrollToNextVideo('instagram');
      
      expect(window.scrollBy).toHaveBeenCalledWith({
        top: 1080,
        behavior: 'smooth'
      });
      expect(result).toBe(true);
    });

    it('should scroll down for YouTube platform', () => {
      const result = scrollHandler.scrollToNextVideo('youtube');
      
      expect(window.scrollBy).toHaveBeenCalledWith({
        top: 1080,
        behavior: 'smooth'
      });
      expect(result).toBe(true);
    });

    it('should return false for invalid platform', () => {
      const result = scrollHandler.scrollToNextVideo('invalid');
      expect(result).toBe(false);
    });

    it('should not scroll if already scrolling', () => {
      scrollHandler.isScrolling = true;
      
      const result = scrollHandler.scrollToNextVideo('instagram');
      
      expect(window.scrollBy).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('isVideoInViewport', () => {
    it('should return true for video in viewport', () => {
      const mockVideo = {
        getBoundingClientRect: () => ({
          top: 100,
          bottom: 500,
          left: 100,
          right: 500,
          width: 400,
          height: 400
        })
      };

      const result = scrollHandler.isVideoInViewport(mockVideo);
      expect(result).toBe(true);
    });

    it('should return false for video outside viewport', () => {
      const mockVideo = {
        getBoundingClientRect: () => ({
          top: -500,
          bottom: -100,
          left: 100,
          right: 500,
          width: 400,
          height: 400
        })
      };

      const result = scrollHandler.isVideoInViewport(mockVideo);
      expect(result).toBe(false);
    });
  });

  describe('getVideoElements', () => {
    it('should return video elements for given platform', () => {
      const mockVideoElements = [
        document.createElement('video'),
        document.createElement('video')
      ];
      
      document.querySelectorAll.mockReturnValue(mockVideoElements);
      
      const videos = scrollHandler.getVideoElements('instagram');
      expect(videos).toBe(mockVideoElements);
      expect(document.querySelectorAll).toHaveBeenCalledWith('video');
    });
  });

  describe('cleanup', () => {
    it('should clear timeout and reset scrolling state', () => {
      scrollHandler.scrollTimeout = setTimeout(() => {}, 1000);
      scrollHandler.isScrolling = true;
      
      scrollHandler.cleanup();
      
      expect(scrollHandler.scrollTimeout).toBe(null);
      expect(scrollHandler.isScrolling).toBe(false);
    });
  });

  describe('addVideoEndListener', () => {
    it('should add ended event listener to video', () => {
      const mockVideo = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };

      const handler = scrollHandler.addVideoEndListener(mockVideo, 'instagram');

      expect(mockVideo.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(mockVideo.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(typeof handler).toBe('function');
    });
  });
});
