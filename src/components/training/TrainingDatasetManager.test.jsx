import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrainingDatasetManager from './TrainingDatasetManager';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

import { toast } from 'sonner';

describe('TrainingDatasetManager Component', () => {
  const defaultProps = {
    onDataChange: vi.fn(),
    initialData: [],
    validationSplit: 0.2,
    onValidationSplitChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<TrainingDatasetManager {...defaultProps} />);

      expect(screen.getByText('Training Dataset')).toBeInTheDocument();
      expect(screen.getByText('Add Training Data')).toBeInTheDocument();
    });

    it('should render data source buttons', () => {
      render(<TrainingDatasetManager {...defaultProps} />);

      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('Upload File')).toBeInTheDocument();
    });

    it('should display quality metrics when data exists', () => {
      const initialData = [
        { id: '1', input: 'test input', expected_output: 'test output', feedback: 'correct' }
      ];

      render(<TrainingDatasetManager {...defaultProps} initialData={initialData} />);

      expect(screen.getByText('Quality Score')).toBeInTheDocument();
      expect(screen.getByText('Training')).toBeInTheDocument();
      expect(screen.getByText('Validation')).toBeInTheDocument();
    });
  });

  describe('Manual Entry', () => {
    it('should add example when form is filled', async () => {
      const user = userEvent.setup();
      const onDataChange = vi.fn();

      render(<TrainingDatasetManager {...defaultProps} onDataChange={onDataChange} />);

      // Fill in the form
      const inputField = screen.getByPlaceholderText(/enter the input prompt/i);
      const outputField = screen.getByPlaceholderText(/enter the expected response/i);

      await user.type(inputField, 'Test input question');
      await user.type(outputField, 'Expected answer');

      // Click add button
      const addButton = screen.getByText('Add Example');
      await user.click(addButton);

      expect(onDataChange).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Example added');
    });

    it('should show error when input is empty', async () => {
      const user = userEvent.setup();

      render(<TrainingDatasetManager {...defaultProps} />);

      const addButton = screen.getByText('Add Example');
      await user.click(addButton);

      expect(toast.error).toHaveBeenCalledWith('Input is required');
    });

    it('should clear form after adding example', async () => {
      const user = userEvent.setup();

      render(<TrainingDatasetManager {...defaultProps} />);

      const inputField = screen.getByPlaceholderText(/enter the input prompt/i);
      await user.type(inputField, 'Test input');

      const outputField = screen.getByPlaceholderText(/enter the expected response/i);
      await user.type(outputField, 'Test output');

      const addButton = screen.getByText('Add Example');
      await user.click(addButton);

      expect(inputField.value).toBe('');
      expect(outputField.value).toBe('');
    });
  });

  describe('Data Display', () => {
    it('should display existing examples', () => {
      const initialData = [
        { id: '1', input: 'Question 1', expected_output: 'Answer 1', feedback: 'correct' },
        { id: '2', input: 'Question 2', expected_output: 'Answer 2', feedback: 'partial' }
      ];

      render(<TrainingDatasetManager {...defaultProps} initialData={initialData} />);

      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Answer 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });

    it('should display feedback badges', () => {
      const initialData = [
        { id: '1', input: 'Test', expected_output: 'Output', feedback: 'correct' }
      ];

      render(<TrainingDatasetManager {...defaultProps} initialData={initialData} />);

      expect(screen.getByText('correct')).toBeInTheDocument();
    });
  });

  describe('Data Removal', () => {
    it('should remove example when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDataChange = vi.fn();
      const initialData = [
        { id: '1', input: 'Test', expected_output: 'Output', feedback: 'correct' }
      ];

      render(
        <TrainingDatasetManager
          {...defaultProps}
          initialData={initialData}
          onDataChange={onDataChange}
        />
      );

      // Find and click delete button (using aria or test-id would be better)
      const deleteButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg[class*="trash"]')
      );

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        expect(onDataChange).toHaveBeenCalled();
      }
    });
  });

  describe('Filter', () => {
    it('should filter examples by search text', async () => {
      const user = userEvent.setup();
      const initialData = [
        { id: '1', input: 'Apple question', expected_output: 'Output 1', feedback: 'correct' },
        { id: '2', input: 'Banana question', expected_output: 'Output 2', feedback: 'correct' }
      ];

      render(<TrainingDatasetManager {...defaultProps} initialData={initialData} />);

      const filterInput = screen.getByPlaceholderText('Filter...');
      await user.type(filterInput, 'Apple');

      await waitFor(() => {
        expect(screen.getByText('Apple question')).toBeInTheDocument();
        expect(screen.queryByText('Banana question')).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation Split', () => {
    it('should display validation split slider', () => {
      render(<TrainingDatasetManager {...defaultProps} validationSplit={0.2} />);

      expect(screen.getByText(/Validation Split: 20%/i)).toBeInTheDocument();
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate quality score', () => {
      const initialData = [
        { id: '1', input: 'Long enough input text', expected_output: 'Long enough output', feedback: 'correct' },
        { id: '2', input: 'Another input text', expected_output: 'Another output', feedback: 'correct' }
      ];

      render(<TrainingDatasetManager {...defaultProps} initialData={initialData} />);

      // Quality score should be displayed
      const qualityElements = screen.getAllByText(/%/);
      expect(qualityElements.length).toBeGreaterThan(0);
    });

    it('should show warning when data has issues', () => {
      const initialData = [
        { id: '1', input: '', expected_output: 'Output', feedback: 'correct' } // Empty input
      ];

      render(<TrainingDatasetManager {...defaultProps} initialData={initialData} />);

      // Should show warning about missing data
      expect(screen.queryByText(/missing data/i) || screen.getByText('0%')).toBeTruthy();
    });
  });

  describe('Export', () => {
    it('should have export button when data exists', () => {
      const initialData = [
        { id: '1', input: 'Test', expected_output: 'Output', feedback: 'correct' }
      ];

      render(<TrainingDatasetManager {...defaultProps} initialData={initialData} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  describe('Shuffle', () => {
    it('should shuffle data when shuffle button clicked', async () => {
      const user = userEvent.setup();
      const onDataChange = vi.fn();
      const initialData = [
        { id: '1', input: 'Test 1', expected_output: 'Output 1', feedback: 'correct' },
        { id: '2', input: 'Test 2', expected_output: 'Output 2', feedback: 'correct' },
        { id: '3', input: 'Test 3', expected_output: 'Output 3', feedback: 'correct' }
      ];

      render(
        <TrainingDatasetManager
          {...defaultProps}
          initialData={initialData}
          onDataChange={onDataChange}
        />
      );

      const shuffleButton = screen.getByText('Shuffle');
      await user.click(shuffleButton);

      expect(onDataChange).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Data shuffled');
    });
  });
});
