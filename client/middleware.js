import { NextRequest, NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  if (!pathname.startsWith('/api/server/')) return;

  const token = req.cookies.get('access_token')?.value;

  const backendUrl = `${process.env.NEXT_PUBLIC_SERVER_HOST}${pathname.replace(
    '/api/server',
    '',
  )}${search}`;

  const requestHeaders = new Headers(req.headers);
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  console.log('backendUrl', backendUrl);
  return NextResponse.rewrite(backendUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}