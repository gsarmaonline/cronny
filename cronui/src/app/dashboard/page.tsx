'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authLib } from '@/lib/auth';
import { PageLayout } from '@/components/crud';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Double check authentication on client side
    if (!authLib.isAuthenticated()) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Dashboard"
      description="Manage your cron jobs and scheduled tasks"
    >
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Total Actions
          </h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Active Schedules
          </h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Completed Jobs
          </h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Failed Jobs
          </h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Recent Activity
        </h3>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            No recent activity
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
