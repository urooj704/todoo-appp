'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getSession, signOut, restoreSession } from '@/lib/auth';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // Try to restore session first
      let session = getSession();
      if (!session) {
        session = await restoreSession();
      }

      if (!session) {
        router.push('/signin');
        return;
      }

      setAuthenticated(true);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-4 sm:gap-6">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Todoo</h1>
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/tasks"
                  className={`text-sm px-2 py-1 rounded-md transition-colors ${
                    pathname === '/tasks'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Tasks
                </Link>
                <Link
                  href="/chat"
                  className={`text-sm px-2 py-1 rounded-md transition-colors ${
                    pathname === '/chat'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Chat
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                {getSession()?.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
