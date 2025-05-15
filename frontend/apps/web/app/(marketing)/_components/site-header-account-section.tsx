// frontend/apps/web/app/(marketing)/_components/site-header-account-section.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';
import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const ModeToggle = dynamic(() =>
  import('@kit/ui/mode-toggle').then((mod) => ({
    default: mod.ModeToggle,
  })),
);

const paths = {
  home: pathsConfig.app.home,
};

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

export function SiteHeaderAccountSection({
  user: initialUser,
}: React.PropsWithChildren<{
  user: User | null;
}>) {
  const supabase = useSupabase();
  const [clientUser, setClientUser] = useState<User | null>(initialUser);
  
  // This effect will run on the client side to check the current auth state
  useEffect(() => {
    // Get the current user session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setClientUser(data.session.user);
      }
    };
    
    // Run it once
    checkSession();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setClientUser(session?.user || null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Use the client-side state for rendering
  if (!clientUser) {
    return <AuthButtons />;
  }

  return <SuspendedPersonalAccountDropdown user={clientUser} />;
}

function SuspendedPersonalAccountDropdown(props: { user: User | null }) {
  const signOut = useSignOut();
  const userData = props.user;

  if (userData) {
    return (
      <PersonalAccountDropdown
        showProfileName={false}
        paths={paths}
        features={features}
        user={userData}
        signOutRequested={() => signOut.mutateAsync()}
      />
    );
  }

  return <AuthButtons />;
}

function AuthButtons() {
  return (
    <div className={'flex space-x-2'}>
      <div className={'hidden space-x-0.5 md:flex'}>
        <If condition={features.enableThemeToggle}>
          <ModeToggle />
        </If>

        <Button asChild variant={'ghost'}>
          <Link href={pathsConfig.auth.signIn}>
            <Trans i18nKey={'auth:signIn'} />
          </Link>
        </Button>
      </div>

      <Button asChild className="group" variant={'default'}>
        <Link href={pathsConfig.auth.signUp}>
          <Trans i18nKey={'auth:signUp'} />
        </Link>
      </Button>
    </div>
  );
}