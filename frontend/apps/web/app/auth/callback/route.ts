// frontend/apps/web/app/auth/callback/route.ts

import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  // Exchange the code for a session and get redirect URL
  const url = await service.verifyTokenHash(request, {
    redirectPath: pathsConfig.app.home,
  });

  // Redirect to the home page
  return redirect(url.toString());
}