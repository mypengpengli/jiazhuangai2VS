import { NextResponse, type NextRequest } from 'next/server';
import { LANGUAGE_COOKIE, preferredLocale } from '@/lib/locale';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isEnglishPath = path === '/en' || path.startsWith('/en/');
  const saved = request.cookies.get(LANGUAGE_COOKIE)?.value;
  const locale = saved === 'en' || saved === 'zh-CN'
    ? saved
    : preferredLocale(request.headers.get('accept-language'));

  if (path === '/' && locale === 'en') {
    const url = request.nextUrl.clone();
    url.pathname = '/en';
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Vary', 'Accept-Language, Cookie');
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-site-locale', isEnglishPath ? 'en' : 'zh-CN');
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ['/', '/en/:path*'] };
