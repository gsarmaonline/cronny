'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authLib } from '@/lib/auth';

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

  const handleLogout = () => {
    authLib.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Cronny Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-500"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Welcome to Cronny
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your cron jobs and scheduled tasks
          </p>
        </div>

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
      </main>
    </div>
  );
}
