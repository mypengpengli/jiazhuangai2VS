import { NextResponse, type NextRequest } from 'next/server';
import { LANGUAGE_COOKIE, preferredLocale } from '@/lib/locale';

export function middleware(request: NextRequest) {
  const saved = request.cookies.get(LANGUAGE_COOKIE)?.value;
  const locale = saved === 'en' || saved === 'zh-CN'
    ? saved
    : preferredLocale(request.headers.get('accept-language'));

  if (locale === 'en') {
    return new NextResponse(null, {
      status: 307,
      headers: {
        Location: `/en${request.nextUrl.search}`,
        'Cache-Control': 'private, no-store',
        Vary: 'Accept-Language, Cookie',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('Vary', 'Accept-Language, Cookie');
  return response;
}

export const config = { matcher: ['/'] };
