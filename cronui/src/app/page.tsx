'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authLib } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect based on authentication status
    if (authLib.isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
    </div>
  );
}
