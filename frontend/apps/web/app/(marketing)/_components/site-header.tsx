import type { User } from '@supabase/supabase-js';

import { Header } from '@kit/ui/marketing';

import { AppLogo } from '~/components/app-logo';

import { SiteHeaderAccountSection } from './site-header-account-section';
import { SiteNavigation } from './site-navigation';

export function SiteHeader(props: { user?: User | null }) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
      <Header
        logo={<AppLogo showBrandName={true} />}
        navigation={<SiteNavigation />}
        actions={<SiteHeaderAccountSection user={props.user ?? null} />}
      />
    </div>
  );
}