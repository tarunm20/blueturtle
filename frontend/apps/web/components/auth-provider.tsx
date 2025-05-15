// frontend/apps/web/components/auth-provider.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthChangeListener } from '@kit/supabase/hooks/use-auth-change-listener';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import pathsConfig from '~/config/paths.config';

export function AuthProvider(props: React.PropsWithChildren) {
  const router = useRouter();
  const supabase = useSupabase();
  const [initialized, setInitialized] = useState(false);

  // Set up the auth change listener
  useAuthChangeListener({
    appHomePath: pathsConfig.app.home,
  });

  // Check for existing session on initial load
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      // If we have a session but we're on a marketing page, redirect to home
      if (data?.session && window.location.pathname === '/') {
        router.push(pathsConfig.app.home);
      }
      setInitialized(true);
    };

    checkSession();
  }, [router, supabase]);

  if (!initialized) {
    // You could return a loading indicator here if needed
    return null;
  }

  return props.children;
}