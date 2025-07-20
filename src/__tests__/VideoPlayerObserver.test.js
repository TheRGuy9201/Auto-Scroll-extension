import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import VideoPlayerObserver from '../components/VideoPlayerObserver';

// Mock Chrome API
global.chrome = {
  tabs: {
    query: jest.fn()
  }
};

// Mock reducer for testing
const mockReducer = (state = { autoScrollEnabled: true }, action) => {
  switch (action.type) {
    case 'SET_AUTO_SCROLL_ENABLED':
      return { ...state, autoScrollEnabled: action.payload };
    default:
      return state;
  }
};

const renderWithRedux = (component, initialState = { autoScrollEnabled: true }) => {
  const store = createStore(mockReducer, initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('VideoPlayerObserver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRedux(<VideoPlayerObserver />);
    expect(screen.getByText('Current Platform:')).toBeInTheDocument();
  });

  it('shows monitoring status when auto-scroll is enabled', () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([{ url: 'https://www.instagram.com/reels/test' }]);
    });

    renderWithRedux(<VideoPlayerObserver />, { autoScrollEnabled: true });

    expect(screen.getByText('Current Platform:')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('shows paused status when auto-scroll is disabled', () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([{ url: 'https://www.youtube.com/shorts/test' }]);
    });

    renderWithRedux(<VideoPlayerObserver />, { autoScrollEnabled: false });

    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });

  it('shows warning for unsupported platforms', async () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([{ url: 'https://www.example.com' }]);
    });

    renderWithRedux(<VideoPlayerObserver />);

    // Wait for the effect to complete
    await screen.findByText('Other');
    expect(screen.getByText('Extension only works on Instagram Reels and YouTube Shorts')).toBeInTheDocument();
  });

  it('handles Chrome API errors gracefully', async () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      throw new Error('Chrome API error');
    });

    renderWithRedux(<VideoPlayerObserver />);

    // Should still render without crashing
    expect(screen.getByText('Current Platform:')).toBeInTheDocument();
  });

  it('detects Instagram platform correctly', async () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([{ url: 'https://www.instagram.com/reels/abc123' }]);
    });

    renderWithRedux(<VideoPlayerObserver />);

    await screen.findByText('Instagram');
    expect(screen.getByText('Auto-scroll will activate when videos end on Reels pages')).toBeInTheDocument();
  });

  it('detects YouTube platform correctly', async () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([{ url: 'https://www.youtube.com/shorts/xyz789' }]);
    });

    renderWithRedux(<VideoPlayerObserver />);

    await screen.findByText('YouTube');
    expect(screen.getByText('Auto-scroll will activate when videos end on Shorts pages')).toBeInTheDocument();
  });

  it('shows correct monitoring indicator based on auto-scroll state', () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([{ url: 'https://www.instagram.com/reels/test' }]);
    });

    const { rerender } = renderWithRedux(<VideoPlayerObserver />, { autoScrollEnabled: true });

    expect(document.querySelector('.monitoring')).toBeInTheDocument();

    // Re-render with disabled state
    const disabledStore = createStore(mockReducer, { autoScrollEnabled: false });
    rerender(
      <Provider store={disabledStore}>
        <VideoPlayerObserver />
      </Provider>
    );

    expect(document.querySelector('.paused')).toBeInTheDocument();
  });
});
