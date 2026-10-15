// designly-site — request handling for the Pages deployment.
//
// The build is a single-page app, so every dotless 404 is served index.html.
// Assets are immutable (their names carry a content hash); index.html is never
// cached, because a cached shell pins a user to an old bundle after a deploy.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (response.status === 404 && !url.pathname.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    const headers = new Headers(response.headers);

    if (url.pathname.includes('/assets/')) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname.endsWith('/index.html') || url.pathname === '/') {
      headers.set('Cache-Control', 'no-cache, must-revalidate');
    }

    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return new Response(response.body, { status: response.status, headers });
  },
};
