// frontend/apps/web/app/auth/callback/route.ts
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  try {
    // This properly handles the OAuth callback
    const url = await service.verifyTokenHash(request, {
      redirectPath: pathsConfig.app.home,
    });
    
    // Use NextResponse.redirect for more reliable redirection
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Auth callback error:', error);
    // Redirect to error page if something goes wrong
    return NextResponse.redirect(new URL('/auth/callback/error', request.url));
  }
}