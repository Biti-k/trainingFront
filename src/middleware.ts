import { defineMiddleware } from 'astro:middleware';

const PUBLIC_PATHS = ['/login', '/auth/'];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return next();
  }

  const isAuthenticated = Boolean(context.cookies.get('session')?.value);

  if (!isAuthenticated) {
    return context.redirect('/login');
  }

  return next();
});
