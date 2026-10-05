import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';

async function runMiddlewareTests() {
  console.log('🧪 Testing Next.js Middleware Routing & Onboarding Gate Logic...');

  let passCount = 0;

  // Helper function to create request
  function createReq(host: string, path: string, headers: Record<string, string> = {}) {
    return new NextRequest(new URL(`http://${host}${path}`), {
      headers: {
        host,
        ...headers,
      },
    });
  }

  // 1. Host root production: /tenant/<user> -> 308 redirect to subdomain
  {
    const req = createReq('www.letmehearyou.id', '/tenant/axaa');
    const res = await middleware(req);
    assert.strictEqual(res.status, 308, 'www /tenant/axaa should return 308');
    assert.strictEqual(res.headers.get('location'), 'https://axaa.letmehearyou.id/');
    passCount++;
  }

  // 2. /tenant/<user>/write -> 308 redirect to subdomain builder
  {
    const req = createReq('www.letmehearyou.id', '/tenant/axaa/write');
    const res = await middleware(req);
    assert.strictEqual(res.status, 308);
    assert.strictEqual(res.headers.get('location'), 'https://axaa.letmehearyou.id/builder?username=axaa');
    passCount++;
  }

  // 3. /tenant/<user>/<slug> -> 308 redirect to subdomain article
  {
    const req = createReq('www.letmehearyou.id', '/tenant/axaa/mengenali-tanda-burnout');
    const res = await middleware(req);
    assert.strictEqual(res.status, 308);
    assert.strictEqual(res.headers.get('location'), 'https://axaa.letmehearyou.id/mengenali-tanda-burnout');
    passCount++;
  }

  // 4. Bare domain /tenant/<user> -> 308 redirect
  {
    const req = createReq('letmehearyou.id', '/tenant/axaa');
    const res = await middleware(req);
    assert.strictEqual(res.status, 308);
    assert.strictEqual(res.headers.get('location'), 'https://axaa.letmehearyou.id/');
    passCount++;
  }

  // 5. Root domain /write -> 308 redirect to /builder
  {
    const req = createReq('www.letmehearyou.id', '/write');
    const res = await middleware(req);
    assert.strictEqual(res.status, 308);
    assert.strictEqual(res.headers.get('location'), 'http://www.letmehearyou.id/builder');
    passCount++;
  }

  // 6. Subdomain /write -> 308 redirect to /builder?username=<sub>
  {
    const req = createReq('axaa.letmehearyou.id', '/write');
    const res = await middleware(req);
    assert.strictEqual(res.status, 308);
    assert.strictEqual(res.headers.get('location'), 'http://axaa.letmehearyou.id/builder?username=axaa');
    passCount++;
  }

  // 7. Subdomain root routes should NOT be rewritten (root route wins)
  const rootRoutes = ['/builder', '/blog', '/creator', '/admin/litera', '/login', '/onboarding', '/auth/callback'];
  for (const route of rootRoutes) {
    const req = createReq('axaa.letmehearyou.id', route);
    const res = await middleware(req);
    // When not rewritten, NextResponse.next() doesn't have x-middleware-rewrite header
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    assert.strictEqual(rewriteHeader, null, `Subdomain ${route} should not be rewritten to /tenant/axaa${route}`);
    passCount++;
  }

  // 8. Subdomain tenant routes SHOULD be rewritten
  {
    const req = createReq('axaa.letmehearyou.id', '/');
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    assert.ok(rewriteHeader?.includes('/tenant/axaa/'), 'Subdomain / should rewrite to /tenant/axaa/');
    passCount++;
  }

  {
    const req = createReq('axaa.letmehearyou.id', '/mengenali-tanda-burnout');
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    assert.ok(rewriteHeader?.includes('/tenant/axaa/mengenali-tanda-burnout'), 'Subdomain /<slug> should rewrite');
    passCount++;
  }

  // 9. Static assets & API bypass
  const staticPaths = ['/_next/static/chunk.js', '/api/health', '/assets/logo.png', '/favicon.ico'];
  for (const staticPath of staticPaths) {
    const req = createReq('axaa.letmehearyou.id', staticPath);
    const res = await middleware(req);
    assert.strictEqual(res.headers.get('x-middleware-rewrite'), null);
    passCount++;
  }

  console.log(`  ✅ Passed all ${passCount} middleware routing & onboarding assertions!`);
}

runMiddlewareTests().catch((err) => {
  console.error('❌ Middleware test failed:', err);
  process.exit(1);
});
