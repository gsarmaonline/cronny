'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authLib } from '@/lib/auth';
import { useCrud } from '@/hooks/useCrud';
import { DataTable, Modal, PageLayout, Column } from '@/components/crud';
import type { Schedule } from '@/types';

export default function SchedulesPage() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<Partial<Schedule>>({
    name: '',
    description: '',
    schedule_type: 'recurring',
    is_active: true,
  });
  const router = useRouter();

  const {
    items,
    loading: dataLoading,
    error,
    create,
    update,
    remove,
  } = useCrud<Schedule>({ resource: 'schedules' });

  useEffect(() => {
    if (!authLib.isAuthenticated()) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  const columns: Column<Schedule>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'schedule_type',
      label: 'Type',
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {item.schedule_type}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.is_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      schedule_type: 'recurring',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Schedule) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Schedule) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await remove(item.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await update(editingItem.id, formData);
    } else {
      await create(formData);
    }
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Schedules"
      description="Manage your scheduled tasks and cron jobs"
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
          Error: {error.message}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          onClick={handleCreate}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-500"
        >
          Create Schedule
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <DataTable
          data={items}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={dataLoading}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Schedule' : 'Create Schedule'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Schedule Type
            </label>
            <select
              value={formData.schedule_type || 'recurring'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  schedule_type: e.target.value as Schedule['schedule_type'],
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="recurring">Recurring</option>
              <option value="absolute">Absolute</option>
              <option value="relative">Relative</option>
            </select>
          </div>

          {formData.schedule_type === 'recurring' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Cron Expression
              </label>
              <input
                type="text"
                value={formData.cron_expression || ''}
                onChange={(e) =>
                  setFormData({ ...formData, cron_expression: e.target.value })
                }
                placeholder="0 0 * * *"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          {formData.schedule_type === 'absolute' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Schedule Time
              </label>
              <input
                type="datetime-local"
                value={formData.schedule_time || ''}
                onChange={(e) =>
                  setFormData({ ...formData, schedule_time: e.target.value })
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          {formData.schedule_type === 'relative' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Interval (seconds)
              </label>
              <input
                type="number"
                value={formData.interval_seconds || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interval_seconds: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active || false}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-zinc-700 dark:text-zinc-300"
            >
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
