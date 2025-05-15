// frontend/apps/web/app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  // Use the correct method from the service
  const url = await service.verifyTokenHash(request, {
    redirectPath: pathsConfig.app.home,
  });

  // Return the redirect response
  return NextResponse.redirect(url);
}