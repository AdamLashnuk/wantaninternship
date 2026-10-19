import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type AccountUser = { id: string; email: string; name: string };
type Tokens = { AccessToken: string; RefreshToken?: string; ExpiresIn?: number };
type CognitoUser = { Username: string; UserAttributes?: { Name: string; Value: string }[] };
const accessCookie = "wai-access";
const refreshCookie = "wai-refresh";

export class AccountError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

export function accountsConfigured() {
  return Boolean(process.env.COGNITO_CLIENT_ID && process.env.COGNITO_REGION);
}

export async function cognito<T>(action: string, body: Record<string, unknown>): Promise<T> {
  if (!accountsConfigured()) throw new AccountError("NotConfigured", "Account access is being set up. Please try again soon.", 503);
  const region = process.env.COGNITO_REGION!;
  if (!/^[a-z]{2}(?:-[a-z]+)+-\d$/.test(region)) throw new AccountError("NotConfigured", "Account access is unavailable.", 503);
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-amz-json-1.1", "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}` },
    body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json();
  if (!response.ok) {
    const code = String(payload.__type ?? "AccountError").split("#").pop()!;
    const messages: Record<string, string> = {
      NotAuthorizedException: "The email or password is incorrect.",
      UserNotFoundException: "The email or password is incorrect.",
      UserNotConfirmedException: "Please verify your email to continue.",
      UsernameExistsException: "An account with this email already exists. Try logging in.",
      InvalidPasswordException: "Use at least 12 characters, with uppercase, lowercase, and a number.",
      CodeMismatchException: "That verification code is incorrect.",
      ExpiredCodeException: "That code has expired. Request a new one.",
      TooManyRequestsException: "Too many attempts. Please wait a moment and try again.",
      LimitExceededException: "Too many attempts. Please try again later.",
    };
    throw new AccountError(code, messages[code] ?? "We couldn't complete that request. Please try again.", code === "TooManyRequestsException" ? 429 : 400);
  }
  return payload as T;
}

export function setSession(response: NextResponse, tokens: Tokens) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  response.cookies.set(accessCookie, tokens.AccessToken, { ...options, maxAge: tokens.ExpiresIn ?? 3600 });
  if (tokens.RefreshToken) response.cookies.set(refreshCookie, tokens.RefreshToken, { ...options, maxAge: 30 * 24 * 3600 });
}

export function clearSession(response: NextResponse) {
  for (const name of [accessCookie, refreshCookie]) response.cookies.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

function accountUser(user: CognitoUser): AccountUser {
  const values = Object.fromEntries((user.UserAttributes ?? []).map((attribute) => [attribute.Name, attribute.Value]));
  return { id: values.sub ?? user.Username, email: values.email ?? "", name: values.name ?? "" };
}

export async function getSession(): Promise<{ user: AccountUser | null; tokens?: Tokens }> {
  if (!accountsConfigured()) return { user: null };
  const jar = await cookies();
  const access = jar.get(accessCookie)?.value;
  if (access) {
    try { return { user: accountUser(await cognito<CognitoUser>("GetUser", { AccessToken: access })) }; }
    catch (error) { if (!(error instanceof AccountError) || !["NotAuthorizedException", "UserNotFoundException"].includes(error.code)) throw error; }
  }
  const refresh = jar.get(refreshCookie)?.value;
  if (!refresh) return { user: null };
  try {
    const result = await cognito<{ AuthenticationResult: Tokens }>("InitiateAuth", {
      ClientId: process.env.COGNITO_CLIENT_ID, AuthFlow: "REFRESH_TOKEN_AUTH", AuthParameters: { REFRESH_TOKEN: refresh },
    });
    const user = accountUser(await cognito<CognitoUser>("GetUser", { AccessToken: result.AuthenticationResult.AccessToken }));
    return { user, tokens: result.AuthenticationResult };
  } catch (error) {
    if (error instanceof AccountError && ["NotAuthorizedException", "UserNotFoundException"].includes(error.code)) return { user: null };
    throw error;
  }
}

export async function signOut() {
  const jar = await cookies();
  const refresh = jar.get(refreshCookie)?.value;
  const access = jar.get(accessCookie)?.value;
  if (!accountsConfigured()) return;
  try {
    if (refresh) await cognito("RevokeToken", { ClientId: process.env.COGNITO_CLIENT_ID, Token: refresh });
    else if (access) await cognito("GlobalSignOut", { AccessToken: access });
  } catch { /* Always allow this browser's local session to be cleared. */ }
}
