import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleManager } from '../ScheduleManager';
import { ScheduleService } from '../../../services/ScheduleService';
import { Schedule, ScheduleType, ScheduleUnit } from '../../../types/Schedule';
import { BrowserRouter } from 'react-router-dom';

// Mock the ScheduleService
jest.mock('../../../services/ScheduleService');

const mockSchedule: Schedule = {
  id: '1',
  name: 'Test Schedule',
  type: ScheduleType.RELATIVE,
  unit: ScheduleUnit.MINUTES,
  value: '30',
  action: 'test-action',
  isActive: true,
};

describe('Schedule Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schedule List', () => {
    it('renders the schedule list with initial state', async () => {
      const mockSchedules = [mockSchedule];
      (ScheduleService.getSchedules as jest.Mock).mockResolvedValue(mockSchedules);

      render(
        <BrowserRouter>
          <ScheduleManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Schedule')).toBeInTheDocument();
      });
    });

    it('handles schedule deletion', async () => {
      const mockSchedules = [mockSchedule];
      (ScheduleService.getSchedules as jest.Mock).mockResolvedValue(mockSchedules);
      (ScheduleService.deleteSchedule as jest.Mock).mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <ScheduleManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        const deleteButton = screen.getByTestId(`delete-schedule-${mockSchedule.id}`);
        fireEvent.click(deleteButton);
      });

      expect(ScheduleService.deleteSchedule).toHaveBeenCalledWith(mockSchedule.id);
    });

    it('handles schedule activation/deactivation', async () => {
      const mockSchedules = [mockSchedule];
      (ScheduleService.getSchedules as jest.Mock).mockResolvedValue(mockSchedules);
      (ScheduleService.updateSchedule as jest.Mock).mockResolvedValue({ ...mockSchedule, isActive: false });

      render(
        <BrowserRouter>
          <ScheduleManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        const toggleButton = screen.getByTestId(`toggle-schedule-${mockSchedule.id}`);
        fireEvent.click(toggleButton);
      });

      expect(ScheduleService.updateSchedule).toHaveBeenCalledWith(mockSchedule.id, {
        ...mockSchedule,
        isActive: false,
      });
    });
  });

  describe('Schedule Form', () => {
    it('creates a new schedule', async () => {
      const newSchedule = {
        name: 'New Test Schedule',
        type: ScheduleType.RELATIVE,
        unit: ScheduleUnit.MINUTES,
        value: '45',
        action: 'test-action',
      };

      (ScheduleService.createSchedule as jest.Mock).mockResolvedValue({ ...newSchedule, id: '2' });

      render(
        <BrowserRouter>
          <ScheduleManager />
        </BrowserRouter>
      );

      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i);
      await userEvent.type(nameInput, newSchedule.name);

      // Select schedule type
      const typeSelect = screen.getByLabelText(/schedule type/i);
      fireEvent.mouseDown(typeSelect);
      const relativeOption = screen.getByText('Relative');
      fireEvent.click(relativeOption);

      // Select unit
      const unitSelect = screen.getByLabelText(/unit/i);
      fireEvent.mouseDown(unitSelect);
      const minutesOption = screen.getByText('Minutes');
      fireEvent.click(minutesOption);

      // Enter value
      const valueInput = screen.getByLabelText(/schedule value/i);
      await userEvent.type(valueInput, newSchedule.value);

      // Select action
      const actionSelect = screen.getByLabelText(/action/i);
      fireEvent.mouseDown(actionSelect);
      const actionOption = screen.getByText('test-action');
      fireEvent.click(actionOption);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(ScheduleService.createSchedule).toHaveBeenCalledWith(newSchedule);
      });
    });

    it('validates required fields', async () => {
      render(
        <BrowserRouter>
          <ScheduleManager />
        </BrowserRouter>
      );

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify validation messages
      await waitFor(() => {
        const nameError = screen.getByText('Name is required');
        const typeError = screen.getByText('Schedule type is required');
        const valueError = screen.getByText('Schedule value is required');
        const actionError = screen.getByText('Action is required');

        expect(nameError).toBeInTheDocument();
        expect(typeError).toBeInTheDocument();
        expect(valueError).toBeInTheDocument();
        expect(actionError).toBeInTheDocument();
      });
    });

    it('validates schedule value format based on type', async () => {
      render(
        <BrowserRouter>
          <ScheduleManager />
        </BrowserRouter>
      );

      // Select Absolute type
      const typeSelect = screen.getByLabelText(/schedule type/i);
      fireEvent.mouseDown(typeSelect);
      const absoluteOption = screen.getByText('Absolute');
      fireEvent.click(absoluteOption);

      // Enter invalid cron expression
      const valueInput = screen.getByLabelText(/schedule value/i);
      await userEvent.type(valueInput, 'invalid-cron');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify validation message
      await waitFor(() => {
        const error = screen.getByText('Invalid cron expression');
        expect(error).toBeInTheDocument();
      });
    });

    it('edits an existing schedule', async () => {
      const updatedSchedule = {
        ...mockSchedule,
        name: 'Updated Schedule Name',
      };

      (ScheduleService.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);
      (ScheduleService.updateSchedule as jest.Mock).mockResolvedValue(updatedSchedule);

      render(
        <BrowserRouter>
          <ScheduleManager scheduleId={mockSchedule.id} />
        </BrowserRouter>
      );

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockSchedule.name)).toBeInTheDocument();
      });

      // Update name
      const nameInput = screen.getByLabelText(/name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, updatedSchedule.name);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      // Verify update API was called with correct data
      await waitFor(() => {
        expect(ScheduleService.updateSchedule).toHaveBeenCalledWith(mockSchedule.id, {
          ...mockSchedule,
          name: updatedSchedule.name,
        });
      });
    });
  });
}); 