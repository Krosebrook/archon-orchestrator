/**
 * Button Component Tests
 * 
 * Tests for the base Button UI component
 */

import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Button } from './button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      renderWithProviders(<Button>Click me</Button>);
      
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });
    
    it('renders with default variant', () => {
      renderWithProviders(<Button>Default</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });
    
    it('renders with destructive variant', () => {
      renderWithProviders(<Button variant="destructive">Delete</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });
    
    it('renders with outline variant', () => {
      renderWithProviders(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });
    
    it('renders with different sizes', () => {
      const { rerender } = renderWithProviders(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-8');
      
      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-10');
      
      rerender(<Button size="icon">Icon</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-9', 'w-9');
    });
  });
  
  describe('User Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const { user } = renderWithProviders(
        <Button onClick={handleClick}>Click me</Button>
      );
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const { user } = renderWithProviders(
        <Button onClick={handleClick} disabled>Click me</Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Try to click (should not work)
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
  
  describe('Accessibility', () => {
    it('has proper button role', () => {
      renderWithProviders(<Button>Accessible</Button>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    it('is keyboard accessible', async () => {
      const handleClick = vi.fn();
      const { user } = renderWithProviders(
        <Button onClick={handleClick}>Press me</Button>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    it('supports custom aria labels', () => {
      renderWithProviders(
        <Button aria-label="Custom label">Icon</Button>
      );
      
      expect(screen.getByRole('button', { name: /custom label/i })).toBeInTheDocument();
    });
  });
  
  describe('Custom Classes', () => {
    it('applies custom className', () => {
      renderWithProviders(
        <Button className="custom-class">Custom</Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
  
  describe('AsChild Prop', () => {
    it('renders as child component when asChild is true', () => {
      renderWithProviders(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });
});
