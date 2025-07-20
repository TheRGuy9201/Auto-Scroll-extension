import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutoScrollToggle from '../components/AutoScrollToggle';

// Mock Chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn()
  }
};

describe('AutoScrollToggle', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with enabled state', () => {
    render(<AutoScrollToggle enabled={true} onToggle={mockOnToggle} />);
    
    expect(screen.getByText('Auto Scroll')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('renders with disabled state', () => {
    render(<AutoScrollToggle enabled={false} onToggle={mockOnToggle} />);
    
    expect(screen.getByText('Auto Scroll')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('calls onToggle when clicked', () => {
    render(<AutoScrollToggle enabled={false} onToggle={mockOnToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('sends message to Chrome runtime when toggled', () => {
    render(<AutoScrollToggle enabled={false} onToggle={mockOnToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'toggleAutoScroll',
      value: true
    });
  });

  it('handles toggle from enabled to disabled', () => {
    render(<AutoScrollToggle enabled={true} onToggle={mockOnToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnToggle).toHaveBeenCalledWith(false);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'toggleAutoScroll',
      value: false
    });
  });

  it('handles missing Chrome API gracefully', () => {
    // Temporarily remove Chrome API
    const originalChrome = global.chrome;
    delete global.chrome;
    
    render(<AutoScrollToggle enabled={false} onToggle={mockOnToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnToggle).toHaveBeenCalledWith(true);
    
    // Restore Chrome API
    global.chrome = originalChrome;
  });

  it('has correct CSS classes applied', () => {
    render(<AutoScrollToggle enabled={true} onToggle={mockOnToggle} />);
    
    expect(document.querySelector('.toggle-container')).toBeInTheDocument();
    expect(document.querySelector('.toggle-switch')).toBeInTheDocument();
    expect(document.querySelector('.toggle-slider')).toBeInTheDocument();
  });
});
