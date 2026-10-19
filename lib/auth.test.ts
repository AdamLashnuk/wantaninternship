import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
process.env.COGNITO_CLIENT_ID = "test-client";
process.env.COGNITO_REGION = "us-east-1";

function loadModule(path: string, overrides: Record<string, unknown>) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", compiled.outputText)(
    (name: string) => name in overrides ? overrides[name] : require(name), module, module.exports,
  );
  return module.exports;
}

function setup() {
  const jar = new Map<string, string>();
  const auth = loadModule("./auth.ts", { "next/headers": { cookies: async () => ({ get: (name: string) => jar.has(name) ? { value: jar.get(name) } : undefined }) } });
  const route = loadModule("../app/api/auth/route.ts", { "../../../lib/auth": auth });
  return { auth, route, jar };
}

function request(body: object, origin = "https://wantaninternship.com") {
  return new Request("https://wantaninternship.com/api/auth", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

test("cross-origin account requests are rejected before calling the identity provider", async (t) => {
  const { route } = setup();
  const network = t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not call network"); });
  const response = await route.POST(request({ action: "logout" }, "https://attacker.example"));
  assert.equal(response.status, 403);
  assert.equal(network.mock.callCount(), 0);
});

test("login returns HttpOnly session cookies and never exposes tokens in JSON", async (t) => {
  const { route } = setup();
  t.mock.method(globalThis, "fetch", async () => Response.json({ AuthenticationResult: { AccessToken: "access-secret", RefreshToken: "refresh-secret", ExpiresIn: 3600 } }));
  const response = await route.POST(request({ action: "login", email: "student@example.com", password: "StudentPassword123" }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { ok: true });
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  cookies.forEach((cookie: string) => { assert.match(cookie, /httponly/i); assert.match(cookie, /samesite=lax/i); });
});

test("a forged access cookie cannot create a signed-in account", async (t) => {
  const { auth, jar } = setup(); jar.set("wai-access", "forged-token");
  t.mock.method(globalThis, "fetch", async () => Response.json({ __type: "NotAuthorizedException" }, { status: 400 }));
  assert.deepEqual(await auth.getSession(), { user: null });
});

test("an expired access token is refreshed and the account is revalidated", async (t) => {
  const { auth, jar } = setup(); jar.set("wai-access", "expired"); jar.set("wai-refresh", "valid-refresh");
  t.mock.method(globalThis, "fetch", async (_url: unknown, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    if (body.AccessToken === "expired") return Response.json({ __type: "NotAuthorizedException" }, { status: 400 });
    if (body.AuthFlow === "REFRESH_TOKEN_AUTH") return Response.json({ AuthenticationResult: { AccessToken: "fresh-access", ExpiresIn: 3600 } });
    assert.equal(body.AccessToken, "fresh-access");
    return Response.json({ Username: "user-id", UserAttributes: [{ Name: "email", Value: "student@example.com" }, { Name: "name", Value: "Student" }] });
  });
  const session = await auth.getSession();
  assert.equal(session.user.email, "student@example.com");
  assert.equal(session.tokens.AccessToken, "fresh-access");
});

test("signup remains signed out until email verification and login", async (t) => {
  const { route } = setup();
  t.mock.method(globalThis, "fetch", async () => Response.json({ UserConfirmed: false }));
  const response = await route.POST(request({ action: "signup", email: "student@example.com", name: "Student", password: "StudentPassword123" }));
  assert.deepEqual(await response.json(), { ok: true, needsConfirmation: true });
  assert.equal(response.headers.getSetCookie().length, 0);
});

test("logout revokes the refresh token and clears both session cookies", async (t) => {
  const { route, jar } = setup(); jar.set("wai-refresh", "refresh-to-revoke");
  t.mock.method(globalThis, "fetch", async (_url: unknown, options: RequestInit) => {
    assert.match(JSON.stringify(options.headers), /RevokeToken/);
    assert.equal(JSON.parse(String(options.body)).Token, "refresh-to-revoke");
    return Response.json({});
  });
  const response = await route.POST(request({ action: "logout" }));
  assert.equal(response.status, 200);
  response.headers.getSetCookie().forEach((cookie: string) => assert.match(cookie, /max-age=0/i));
});
