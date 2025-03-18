import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import ScheduleList from '../ScheduleList';
import ScheduleForm from '../ScheduleForm';
import scheduleService from '../../../services/schedule.service';
import actionService from '../../../services/action.service';

// Mock the services
jest.mock('../../../services/schedule.service');
jest.mock('../../../services/action.service');

const mockSchedules = [
  {
    ID: 1,
    name: 'Test Schedule 1',
    schedule_type: 3, // Relative
    schedule_value: '30',
    schedule_unit: 'minute',
    schedule_status: 1, // Pending
    action_id: 1,
    CreatedAt: '2024-03-20T10:00:00Z',
    UpdatedAt: '2024-03-20T10:00:00Z'
  },
  {
    ID: 2,
    name: 'Test Schedule 2',
    schedule_type: 1, // Absolute
    schedule_value: '2024-12-31T23:59:59Z',
    schedule_unit: 'second',
    schedule_status: 4, // Inactive
    action_id: 2,
    CreatedAt: '2024-03-20T10:00:00Z',
    UpdatedAt: '2024-03-20T10:00:00Z'
  }
];

const mockActions = [
  { ID: 1, name: 'Test Action 1' },
  { ID: 2, name: 'Test Action 2' }
];

describe('Schedule Management', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (scheduleService.getSchedules as jest.Mock).mockResolvedValue(mockSchedules);
    (scheduleService.createSchedule as jest.Mock).mockResolvedValue({ ID: 3, name: mockSchedules[0].name, schedule_type: mockSchedules[0].schedule_type, schedule_value: mockSchedules[0].schedule_value, schedule_unit: mockSchedules[0].schedule_unit, schedule_status: mockSchedules[0].schedule_status, action_id: mockSchedules[0].action_id });
    (scheduleService.updateSchedule as jest.Mock).mockResolvedValue(mockSchedules[0]);
    (scheduleService.deleteSchedule as jest.Mock).mockResolvedValue({});
    (actionService.getActions as jest.Mock).mockResolvedValue(mockActions);
  });

  describe('Schedule List', () => {
    it('renders the schedule list with initial state', async () => {
      render(
        <BrowserRouter>
          <ScheduleList />
        </BrowserRouter>
      );

      // Check loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Wait for schedules to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Verify schedules are displayed
      expect(screen.getByText('Test Schedule 1')).toBeInTheDocument();
      expect(screen.getByText('Test Schedule 2')).toBeInTheDocument();

      // Verify schedule types are displayed
      expect(screen.getByText('Relative')).toBeInTheDocument();
      expect(screen.getByText('Absolute')).toBeInTheDocument();

      // Verify status chips are displayed
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('handles schedule deletion', async () => {
      render(
        <BrowserRouter>
          <ScheduleList />
        </BrowserRouter>
      );

      // Wait for schedules to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Find and click delete button for first schedule
      const deleteButtons = screen.getAllByTitle('Delete schedule');
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion in dialog
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      // Verify delete API was called
      await waitFor(() => {
        expect(scheduleService.deleteSchedule).toHaveBeenCalledWith(1);
      });
    });

    it('handles schedule activation/deactivation', async () => {
      render(
        <BrowserRouter>
          <ScheduleList />
        </BrowserRouter>
      );

      // Wait for schedules to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Find and click activate button for inactive schedule
      const activateButton = screen.getByTitle('Activate schedule');
      fireEvent.click(activateButton);

      // Verify activate API was called
      await waitFor(() => {
        expect(scheduleService.updateSchedule).toHaveBeenCalledWith(2, { schedule_status: 1 });
      });

      // Find and click deactivate button for active schedule
      const deactivateButton = screen.getByTitle('Deactivate schedule');
      fireEvent.click(deactivateButton);

      // Verify deactivate API was called
      await waitFor(() => {
        expect(scheduleService.updateSchedule).toHaveBeenCalledWith(1, { schedule_status: 4 });
      });
    });
  });

  describe('Schedule Form', () => {
    it('creates a new schedule', async () => {
      render(
        <BrowserRouter>
          <ScheduleForm />
        </BrowserRouter>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      });

      // Fill out the form
      await act(async () => {
        // Fill name
        const nameInput = screen.getByRole('textbox', { name: /name/i });
        await userEvent.type(nameInput, 'New Test Schedule');

        // Select schedule type
        const typeSelect = screen.getByLabelText('Schedule Type *');
        await userEvent.click(typeSelect);
        await userEvent.click(screen.getByText('Relative'));

        // Fill schedule value
        const valueInput = screen.getByRole('textbox', { name: /schedule value/i });
        await userEvent.type(valueInput, '30');

        // Select schedule unit
        const unitSelect = screen.getByLabelText('Schedule Unit *');
        await userEvent.click(unitSelect);
        await userEvent.click(screen.getByText('Minute'));

        // Select action
        const actionSelect = screen.getByLabelText('Action *');
        await userEvent.click(actionSelect);
        await userEvent.click(screen.getByText('Test Action 1'));
      });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify create API was called with correct data
      await waitFor(() => {
        expect(scheduleService.createSchedule).toHaveBeenCalledWith({
          name: 'New Test Schedule',
          schedule_type: 3,
          schedule_value: '30',
          schedule_unit: 'minute',
          action_id: 1,
          schedule_status: 4
        });
      });
    });

    it('validates required fields', async () => {
      render(
        <BrowserRouter>
          <ScheduleForm />
        </BrowserRouter>
      );

      // Submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify validation messages
      await waitFor(() => {
        const helperTexts = screen.getAllByText(/required/i);
        expect(helperTexts.length).toBeGreaterThan(0);
      });
    });

    it('validates schedule value format based on type', async () => {
      render(
        <BrowserRouter>
          <ScheduleForm />
        </BrowserRouter>
      );

      // Test Absolute schedule type validation
      await act(async () => {
        // Select Absolute type
        const typeSelect = screen.getByLabelText('Schedule Type *');
        await userEvent.click(typeSelect);
        await userEvent.click(screen.getByText('Absolute'));

        // Enter invalid date
        const valueInput = screen.getByRole('textbox', { name: /schedule value/i });
        await userEvent.type(valueInput, 'invalid-date');
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify date format validation
      await waitFor(() => {
        expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
      });

      // Test Relative schedule type validation
      await act(async () => {
        // Select Relative type
        const typeSelect = screen.getByLabelText('Schedule Type *');
        await userEvent.click(typeSelect);
        await userEvent.click(screen.getByText('Relative'));

        // Clear and enter invalid number
        const valueInput = screen.getByRole('textbox', { name: /schedule value/i });
        await userEvent.clear(valueInput);
        await userEvent.type(valueInput, 'not-a-number');
      });

      fireEvent.click(submitButton);

      // Verify number validation
      await waitFor(() => {
        expect(screen.getByText(/value must be a number/i)).toBeInTheDocument();
      });
    });

    it('edits an existing schedule', async () => {
      // Mock getSchedule for edit mode
      (scheduleService.getSchedule as jest.Mock).mockResolvedValue(mockSchedules[0]);

      render(
        <BrowserRouter>
          <ScheduleForm />
        </BrowserRouter>
      );

      // Wait for schedule data to load
      await waitFor(() => {
        const nameInput = screen.getByRole('textbox', { name: /name/i });
        expect(nameInput).toBeInTheDocument();
      });

      // Update the name
      await act(async () => {
        const nameInput = screen.getByRole('textbox', { name: /name/i });
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Updated Schedule Name');
      });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(submitButton);

      // Verify update API was called with correct data
      await waitFor(() => {
        expect(scheduleService.updateSchedule).toHaveBeenCalledWith(1, expect.objectContaining({
          name: 'Updated Schedule Name'
        }));
      });
    });
  });
}); 