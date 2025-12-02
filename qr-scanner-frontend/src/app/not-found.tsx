'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after a brief moment
    const timer = setTimeout(() => {
      router.push('/');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600">Redirecting to home page...</p>
      </div>
    </div>
  );
}
