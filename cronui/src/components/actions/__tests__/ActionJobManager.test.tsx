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

const mockActions = [
  {
    ID: 1,
    name: 'Test Action 1',
    description: 'Test Description 1',
    user_id: 1,
    CreatedAt: '',
    UpdatedAt: '',
    DeletedAt: null
  }
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
    jest.clearAllMocks();

    // Setup default mock implementations
    (jobService.getJobTemplates as jest.Mock).mockResolvedValue(mockJobTemplates);
    (jobService.getJobs as jest.Mock).mockResolvedValue(mockJobs);
    (actionsApi.getActions as jest.Mock).mockResolvedValue({ data: { actions: mockActions } });
    (actionsApi.createAction as jest.Mock).mockResolvedValue({ data: { action: mockActions[0] } });
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

  it('renders the component and fetches initial data', async () => {
    renderComponent();

    expect(screen.getByText('Actions')).toBeInTheDocument();

    await waitFor(() => {
      expect(jobService.getJobTemplates).toHaveBeenCalled();
      expect(actionsApi.getActions).toHaveBeenCalled();
    });
  });

  it('handles action selection and fetches jobs', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Action 1'));

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenCalledWith(1);
      expect(screen.getByText('Test Job 1')).toBeInTheDocument();
    });
  });

  it('prevents job creation when no action is selected', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Add Job'));

    expect(screen.getByText('Please select an action before creating a job')).toBeInTheDocument();
  });

  it('handles job creation with selected action', async () => {
    const newJob = {
      name: 'New Job',
      job_type: 'http',
      job_input_type: 'static_input',
      job_input_value: '{}',
      action_id: 1,
      job_template_id: 0,
      is_root_job: false,
      condition: '{}',
      proceed_condition: '',
      job_timeout_in_secs: 300
    };

    (jobService.createJob as jest.Mock).mockResolvedValue({
      ...newJob,
      ID: 2,
      CreatedAt: '',
      UpdatedAt: '',
      DeletedAt: null,
      job_executions: []
    });

    renderComponent();

    // Select an action first
    await waitFor(() => {
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Action 1'));

    // Open job dialog and fill form
    fireEvent.click(screen.getByText('Add Job'));
    await userEvent.type(screen.getByTestId('job-name-input'), 'New Job');
    
    // Save the job
    fireEvent.click(screen.getByTestId('save-job-button'));

    await waitFor(() => {
      expect(jobService.createJob).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Job',
        action_id: 1
      }));
    });
  });

  it('handles job editing', async () => {
    const updatedJob = {
      ...mockJobs[0],
      name: 'Updated Job'
    };

    (jobService.updateJob as jest.Mock).mockResolvedValue(updatedJob);

    renderComponent();

    // Select an action first
    await waitFor(() => {
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Action 1'));

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Test Job 1')).toBeInTheDocument();
    });

    // Click edit button and update job
    const editButtons = screen.getAllByTestId('edit-job-button');
    fireEvent.click(editButtons[0]);

    await userEvent.clear(screen.getByTestId('job-name-input'));
    await userEvent.type(screen.getByTestId('job-name-input'), 'Updated Job');

    fireEvent.click(screen.getByTestId('save-job-button'));

    await waitFor(() => {
      expect(jobService.updateJob).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'Updated Job'
      }));
      expect(screen.getByText('Updated Job')).toBeInTheDocument();
    });
  });

  it('handles errors during job operations', async () => {
    (jobService.createJob as jest.Mock).mockRejectedValue(new Error('Failed to create job'));

    renderComponent();

    // Select an action first
    await waitFor(() => {
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Action 1'));

    // Try to create a job
    fireEvent.click(screen.getByText('Add Job'));
    await userEvent.type(screen.getByTestId('job-name-input'), 'New Job');
    fireEvent.click(screen.getByTestId('save-job-button'));

    await waitFor(() => {
      expect(screen.getByText('Failed to save job')).toBeInTheDocument();
    });
  });

  it('preserves actionId in job form data', async () => {
    renderComponent();

    // Select an action first
    await waitFor(() => {
      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Action 1'));

    // Open job dialog
    fireEvent.click(screen.getByText('Add Job'));

    // Update various form fields
    await userEvent.type(screen.getByTestId('job-name-input'), 'New Job');
    fireEvent.change(screen.getByTestId('job-type-select'), {
      target: { value: 'slack' }
    });
    fireEvent.click(screen.getByTestId('root-job-switch'));

    // Save the job
    fireEvent.click(screen.getByTestId('save-job-button'));

    await waitFor(() => {
      expect(jobService.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          action_id: 1,
          name: 'New Job',
          job_type: 'slack',
          is_root_job: true
        })
      );
    });
  });
}); 