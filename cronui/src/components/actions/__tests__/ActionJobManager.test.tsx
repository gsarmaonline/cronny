import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../../../contexts/AuthContext';
import ActionJobManager from '../ActionJobManager';
import jobService from '../../../services/job.service';
import { actionsApi } from '../../../services/api';

// Mock the services
jest.mock('../../../services/job.service');
jest.mock('../../../services/api');

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser'
};

const mockJobTemplates = [
  { ID: 1, name: 'Template 1', exec_type: 1, exec_link: 'link1', code: 'code1', CreatedAt: '', UpdatedAt: '', DeletedAt: null },
  { ID: 2, name: 'Template 2', exec_type: 2, exec_link: 'link2', code: 'code2', CreatedAt: '', UpdatedAt: '', DeletedAt: null }
];

const mockJobs = [
  {
    ID: 1,
    name: 'Test Job 1',
    job_type: 'http',
    job_input_type: 'static_input',
    job_input_value: '{}',
    action_id: 1,
    job_template_id: 1,
    is_root_job: true,
    condition: '{}',
    proceed_condition: '',
    job_timeout_in_secs: 300,
    CreatedAt: '',
    UpdatedAt: '',
    DeletedAt: null,
    job_executions: []
  }
];

describe('ActionJobManager', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (jobService.getJobTemplates as jest.Mock).mockResolvedValue(mockJobTemplates);
    (actionsApi.createAction as jest.Mock).mockResolvedValue({ data: { actions: { ID: 1, name: 'New Action' } } });
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={{
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: true,
        loading: false,
        loginWithGoogle: jest.fn(),
        register: jest.fn()
      }}>
        <ActionJobManager />
      </AuthContext.Provider>
    );
  };

  it('renders the component with initial state', async () => {
    renderComponent();

    // Check for main elements
    expect(screen.getByText('Manage Action and Jobs')).toBeInTheDocument();
    expect(screen.getByLabelText('Action Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Add Job')).toBeInTheDocument();

    // Verify job templates are fetched
    await waitFor(() => {
      expect(jobService.getJobTemplates).toHaveBeenCalled();
    });
  });

  it('opens job dialog when Add Job button is clicked', async () => {
    renderComponent();

    // Click the Add Job button
    fireEvent.click(screen.getByTestId('add-job-button'));

    // Verify dialog is open with form fields
    expect(screen.getByTestId('job-dialog-title')).toBeInTheDocument();
    expect(screen.getByLabelText('Job Name')).toBeInTheDocument();
    expect(screen.getByTestId('job-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('input-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('input-value-input')).toBeInTheDocument();
    expect(screen.getByTestId('job-template-select')).toBeInTheDocument();
    expect(screen.getByTestId('timeout-input')).toBeInTheDocument();
    expect(screen.getByTestId('root-job-switch')).toBeInTheDocument();
    expect(screen.getByTestId('condition-input')).toBeInTheDocument();
    expect(screen.getByTestId('proceed-condition-input')).toBeInTheDocument();
  });

  it('handles job creation', async () => {
    renderComponent();

    // Open job dialog
    fireEvent.click(screen.getByTestId('add-job-button'));

    // Fill in the form
    await userEvent.type(screen.getByLabelText('Job Name'), 'New Test Job');
    
    // Select job type
    const jobTypeSelect = screen.getByTestId('job-type-select');
    fireEvent.mouseDown(jobTypeSelect);
    fireEvent.click(screen.getByText('HTTP'));

    // Select input type
    const inputTypeSelect = screen.getByTestId('input-type-select');
    fireEvent.mouseDown(inputTypeSelect);
    fireEvent.click(screen.getByText('Static Input'));

    // Fill in other fields
    const inputValue = screen.getByTestId('input-value-input');
    fireEvent.change(inputValue, { target: { value: '{"test": "value"}' } });
    
    const timeoutInput = screen.getByTestId('timeout-input');
    await userEvent.clear(timeoutInput);
    await userEvent.type(timeoutInput, '600');
    
    // Toggle root job
    await userEvent.click(screen.getByTestId('root-job-switch'));

    // Save the job
    fireEvent.click(screen.getByTestId('save-job-button'));

    // Verify the job is added to the list
    await waitFor(() => {
      expect(screen.getByText('New Test Job')).toBeInTheDocument();
    });
  });

  it('handles action creation', async () => {
    renderComponent();

    // Fill in action details
    await userEvent.type(screen.getByLabelText('Action Name'), 'New Action');
    await userEvent.type(screen.getByLabelText('Description'), 'Test Description');

    // Save the action
    fireEvent.click(screen.getByText('Save Action'));

    await waitFor(() => {
      expect(actionsApi.createAction).toHaveBeenCalledWith({
        name: 'New Action',
        description: 'Test Description',
        user_id: mockUser.id,
        ID: 0,
        CreatedAt: '',
        UpdatedAt: '',
        DeletedAt: null
      });
    });
  });

  it('handles errors gracefully', async () => {
    // Mock an error response
    (actionsApi.createAction as jest.Mock).mockRejectedValue(new Error('Failed to create action'));
    
    renderComponent();

    // Fill in action details and try to save
    await userEvent.type(screen.getByLabelText('Action Name'), 'New Action');
    fireEvent.click(screen.getByText('Save Action'));

    // Verify error message is displayed
    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Failed to save action');
    });
  });

  it('allows editing existing jobs', async () => {
    renderComponent();

    // Add a mock job first
    fireEvent.click(screen.getByText('Add Job'));
    await userEvent.type(screen.getByLabelText('Job Name'), 'Test Job');
    fireEvent.click(screen.getByText('Save Job'));

    // Click edit button
    const editButtons = screen.getAllByTestId('edit-button');
    fireEvent.click(editButtons[0]);

    // Verify edit dialog opens with job data
    expect(screen.getByDisplayValue('Test Job')).toBeInTheDocument();

    // Edit the job name
    await userEvent.clear(screen.getByLabelText('Job Name'));
    await userEvent.type(screen.getByLabelText('Job Name'), 'Updated Job');

    // Save the changes
    fireEvent.click(screen.getByText('Save Job'));

    // Verify the job is updated in the list
    expect(screen.getByText('Updated Job')).toBeInTheDocument();
  });

  it('allows deleting jobs', async () => {
    renderComponent();

    // Add a mock job first
    fireEvent.click(screen.getByText('Add Job'));
    await userEvent.type(screen.getByLabelText('Job Name'), 'Test Job');
    fireEvent.click(screen.getByText('Save Job'));

    // Verify job is in the list
    expect(screen.getByText('Test Job')).toBeInTheDocument();

    // Click delete button
    const deleteButtons = screen.getAllByTestId('delete-button');
    fireEvent.click(deleteButtons[0]);

    // Verify job is removed from the list
    expect(screen.queryByText('Test Job')).not.toBeInTheDocument();
  });
}); 