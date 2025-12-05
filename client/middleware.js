import { NextRequest, NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  if (!pathname.startsWith('/api/server/')) return;

  const token = req.cookies.get('access_token')?.value;

  const backendUrl = `${process.env.SERVER_HOST}${pathname.replace(
    '/api/server',
    '',
  )}${search}`;

  const requestHeaders = new Headers(req.headers);
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  return NextResponse.redirect(backendUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}