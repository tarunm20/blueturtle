import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';
import { withI18n } from '~/lib/i18n/with-i18n';
import { cookies } from 'next/headers';

async function SiteLayout(props: React.PropsWithChildren) {
  const cookieStore = await cookies();
  cookieStore.getAll();
  const client = getSupabaseServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  return (
    <div className={'flex min-h-[100vh] flex-col'}>
      <SiteHeader user={user} />

      {props.children}

      <SiteFooter />
    </div>
  );
}

export default withI18n(SiteLayout);
