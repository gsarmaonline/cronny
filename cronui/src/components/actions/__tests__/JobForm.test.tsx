import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobForm from '../JobForm';
import { JobFormData } from '../types';

const mockJobTemplateOptions = [
  { id: 1, name: 'Template 1' },
  { id: 2, name: 'Template 2' }
];

const defaultJobFormData: JobFormData = {
  name: '',
  type: 'http',
  inputType: 'static_input',
  inputValue: '{}',
  actionId: 1,
  jobTemplateId: 0,
  isRootJob: false,
  condition: '{}',
  proceedCondition: '',
  jobTimeoutInSecs: 300
};

describe('JobForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockSetJobFormData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <JobForm
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        jobFormData={defaultJobFormData}
        setJobFormData={mockSetJobFormData}
        jobTemplateOptions={mockJobTemplateOptions}
        isEditing={false}
        actionId={1}
        {...props}
      />
    );
  };

  it('renders all form fields correctly', () => {
    renderComponent();

    // Check for all form fields
    expect(screen.getByTestId('job-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('job-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('input-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('input-value-input')).toBeInTheDocument();
    expect(screen.getByTestId('job-template-select')).toBeInTheDocument();
    expect(screen.getByTestId('timeout-input')).toBeInTheDocument();
    expect(screen.getByTestId('root-job-switch')).toBeInTheDocument();
    expect(screen.getByTestId('condition-input')).toBeInTheDocument();
    expect(screen.getByTestId('proceed-condition-input')).toBeInTheDocument();
  });

  it('shows correct title based on isEditing prop', () => {
    renderComponent({ isEditing: false });
    expect(screen.getByTestId('job-dialog-title')).toHaveTextContent('Add Job');

    renderComponent({ isEditing: true });
    expect(screen.getByTestId('job-dialog-title')).toHaveTextContent('Edit Job');
  });

  it('updates form data when fields change', async () => {
    renderComponent();

    // Test text field updates
    await userEvent.type(screen.getByTestId('job-name-input'), 'Test Job');
    expect(mockSetJobFormData).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Job',
      actionId: 1
    }));

    // Test select field updates
    fireEvent.change(screen.getByTestId('job-type-select'), {
      target: { value: 'slack' }
    });
    expect(mockSetJobFormData).toHaveBeenCalledWith(expect.objectContaining({
      type: 'slack',
      actionId: 1
    }));

    // Test switch updates
    fireEvent.click(screen.getByTestId('root-job-switch'));
    expect(mockSetJobFormData).toHaveBeenCalledWith(expect.objectContaining({
      isRootJob: true,
      actionId: 1
    }));
  });

  it('handles job template selection', () => {
    renderComponent();

    fireEvent.change(screen.getByTestId('job-template-select'), {
      target: { value: '1' }
    });

    expect(mockSetJobFormData).toHaveBeenCalledWith(expect.objectContaining({
      jobTemplateId: 1,
      actionId: 1
    }));
  });

  it('calls onClose when cancel button is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onSave when save button is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByTestId('save-job-button'));
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('always includes actionId when updating form data', async () => {
    renderComponent({ actionId: 123 });

    // Test multiple field updates
    await userEvent.type(screen.getByTestId('job-name-input'), 'Test');
    fireEvent.change(screen.getByTestId('job-type-select'), {
      target: { value: 'slack' }
    });
    fireEvent.click(screen.getByTestId('root-job-switch'));

    // Verify actionId is included in all updates
    const calls = mockSetJobFormData.mock.calls;
    calls.forEach(call => {
      expect(call[0]).toHaveProperty('actionId', 123);
    });
  });
}); 