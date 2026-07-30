import { expect, test } from "@playwright/test";

// CSP correctness gate (consensus plan Phase 4): presence is not enough — the
// nonce must rotate per response and match the served HTML, and script-src must
// never regress to 'unsafe-inline'. If this ever fails on
// `upgrade-insecure-requests` against the localhost dev server, diagnose the
// loopback exemption; do NOT strip the directive.

function nonceFromHeader(csp: string): string {
  const match = csp.match(/'nonce-([^']+)'/);
  if (!match) throw new Error(`no nonce in CSP header: ${csp}`);
  return match[1];
}

test("CSP header is complete and script-src is nonce-based, not unsafe-inline", async ({ request }) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"];
  expect(csp).toBeTruthy();

  const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
  expect(scriptSrc).toContain("'nonce-");
  expect(scriptSrc).toContain("'strict-dynamic'");
  expect(scriptSrc).not.toContain("'unsafe-inline'");

  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'none'");
  expect(csp).toContain("form-action 'self'");
  expect(csp).toContain("upgrade-insecure-requests");

  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("two sequential responses carry different nonces", async ({ request }) => {
  const first = await request.get("/");
  const second = await request.get("/");
  const nonce1 = nonceFromHeader(first.headers()["content-security-policy"]);
  const nonce2 = nonceFromHeader(second.headers()["content-security-policy"]);
  expect(nonce1).not.toBe(nonce2);
});

test("the header nonce matches the inline script nonces in the served HTML", async ({ request }) => {
  const response = await request.get("/");
  const headerNonce = nonceFromHeader(response.headers()["content-security-policy"]);
  const html = await response.text();
  const htmlNonces = [...html.matchAll(/nonce="([^"]+)"/g)].map((m) => m[1]);
  expect(htmlNonces.length).toBeGreaterThan(0);
  for (const nonce of htmlNonces) expect(nonce).toBe(headerNonce);
});
