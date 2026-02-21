'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
// import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/lib/AuthContext';

const queryClient = new QueryClient();

// Temporarily disabled - Google OAuth
// const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> */}
        <AuthProvider>
          {children}
        </AuthProvider>
      {/* </GoogleOAuthProvider> */}
    </QueryClientProvider>
  );
}
