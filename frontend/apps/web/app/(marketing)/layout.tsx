// frontend/apps/web/app/(marketing)/layout.tsx
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';

async function SiteLayout(props: React.PropsWithChildren) {
  const cookieStore = await cookies();
  cookieStore.getAll();
  const client = getSupabaseServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  // If user is authenticated and they're on the root page, redirect to home
  if (user && !cookieStore.get('redirected')) {
    // Set a cookie to prevent redirect loops
    cookieStore.set('redirected', 'true', { path: '/' });
    redirect(pathsConfig.app.home);
  }

  return (
    <div className={'flex min-h-[100vh] flex-col'}>
      <SiteHeader user={user} />

      {props.children}

      <SiteFooter />
    </div>
  );
}

export default withI18n(SiteLayout);