// frontend/apps/web/app/auth/callback/route.ts

import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  // Exchange the code for a session
  await service.exchangeCodeForSession(request, {
    redirectPath: pathsConfig.app.home,
  });

  return redirect(pathsConfig.app.home);
}