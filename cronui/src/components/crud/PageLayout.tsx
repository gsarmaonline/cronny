import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authLib } from '@/lib/auth';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageLayout({ title, description, children }: PageLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    authLib.logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Cronny
            </h1>
            <nav className="hidden md:flex space-x-4">
              <a
                href="/dashboard"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Dashboard
              </a>
              <a
                href="/schedules"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Schedules
              </a>
              <a
                href="/actions"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Actions
              </a>
              <a
                href="/jobs"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Jobs
              </a>
              <a
                href="/job-templates"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Job Templates
              </a>
            </nav>
          </div>
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
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
