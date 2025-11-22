'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const authRoutes = ['/login', '/register', '/login/forgot-password'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, checkAuth } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(false);

  const isAuthRoute = authRoutes.some(route => pathname?.startsWith(route));

  useEffect(() => {
    // Only check auth for non-auth routes
    if (!isAuthRoute) {
      const token = Cookies.get('token');
      
      if (!loading && !user && !checkingAuth && token) {
        setCheckingAuth(true);
        checkAuth(true).finally(() => {
          setCheckingAuth(false);
        });
      }
    }
  }, [user, loading, checkAuth, checkingAuth, isAuthRoute]);

  useEffect(() => {
    // Redirect to login if not authenticated and not on auth route
    if (!isAuthRoute && !loading && !checkingAuth && !user) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, checkingAuth, router, isAuthRoute]);

  // Show loading for non-auth routes while checking auth
  if (!isAuthRoute && (loading || checkingAuth)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render content for non-auth routes if not authenticated
  if (!isAuthRoute && !user) {
    return null;
  }

  // For auth routes, render without navbar
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // For authenticated routes, render with navbar
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

