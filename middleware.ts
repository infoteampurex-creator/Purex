import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured yet — skip auth checks to allow dev browsing
  // without env vars. Route protection activates automatically once env is set.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // Create Supabase client in middleware — needed to refresh expired sessions
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Refresh session — required for server components to read the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /client routes
  if (pathname.startsWith('/client') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Gate /client routes. Two redirects happen here:
  //
  //   1. ADMIN BLOCK — admins / super_admins should never see the
  //      client app surface. Their workflow is fully under /admin/*.
  //      If an admin lands on any /client/* path (via a stale link,
  //      manual URL, or post-login leftover), we bounce them to
  //      /admin/dashboard. Per user direction: "I don't want client
  //      view in admin." Coaches preview a client's data from the
  //      admin panel's client detail page, not by switching roles.
  //
  //   2. PENDING-APPROVAL BLOCK — regular users with signup_status
  //      != 'approved' get bounced to /pending-approval (a top-level
  //      route outside /client so the gate doesn't recurse).
  if (pathname.startsWith('/client') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('signup_status, role')
      .eq('id', user.id)
      .single();

    // (1) Admin block
    if (
      profile &&
      (profile.role === 'admin' || profile.role === 'super_admin')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }

    // (2) Pending-approval block
    if (profile && profile.signup_status !== 'approved') {
      const url = request.nextUrl.clone();
      url.pathname = '/pending-approval';
      return NextResponse.redirect(url);
    }
  }

  // Conversely, if an *approved* user lands on /pending-approval, send
  // them to their dashboard — they've already been let in.
  if (pathname === '/pending-approval' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('signup_status, role')
      .eq('id', user.id)
      .single();

    if (profile?.signup_status === 'approved') {
      const url = request.nextUrl.clone();
      url.pathname =
        profile.role === 'admin' || profile.role === 'super_admin'
          ? '/admin/dashboard'
          : '/client/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin routes — also check role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    // Send admin users to the admin dashboard; client users to their
    // dashboard if approved, otherwise to /pending-approval.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, signup_status')
      .eq('id', user.id)
      .single();

    const isAdmin =
      profile?.role === 'admin' || profile?.role === 'super_admin';
    const url = request.nextUrl.clone();

    if (isAdmin) {
      url.pathname = '/admin/dashboard';
    } else if (profile?.signup_status === 'approved') {
      url.pathname = '/client/dashboard';
    } else {
      url.pathname = '/pending-approval';
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico
     * - public files (svg, png, jpg, jpeg, gif, webp)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
