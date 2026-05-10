import { defineMiddleware } from 'astro:middleware';

const PUBLIC_PATHS = ['/login'];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return next();
  }

  const cookie = context.request.headers.get('cookie') ?? '';
  const isAuthenticated = cookie.includes('session=authenticated');

  if (!isAuthenticated) {
    return context.redirect('/login');
  }

  return next();
});