import { NextRequest, NextResponse } from "next/server";
import { AccountError, clearSession, cognito, setSession, signOut } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // All account mutations must originate from this site.
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  try {
    const body = await request.json();
    const action = body.action;
    if (action === "logout") {
      await signOut();
      const response = NextResponse.json({ ok: true }); clearSession(response); return response;
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new AccountError("InvalidInput", "Enter a valid email address.");
    const password = typeof body.password === "string" ? body.password : "";
    const client = process.env.COGNITO_CLIENT_ID;
    if (action === "signup") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name || name.length > 100) throw new AccountError("InvalidInput", "Enter your name (up to 100 characters).");
      if (password.length < 12 || password.length > 256 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) throw new AccountError("InvalidInput", "Use at least 12 characters, with uppercase, lowercase, and a number.");
      const result = await cognito<{ UserConfirmed: boolean }>("SignUp", { ClientId: client, Username: email, Password: password, UserAttributes: [{ Name: "email", Value: email }, { Name: "name", Value: name }] });
      return NextResponse.json({ ok: true, needsConfirmation: !result.UserConfirmed });
    }
    if (action === "confirm") {
      const code = typeof body.code === "string" ? body.code.trim() : "";
      if (!/^\d{6}$/.test(code)) throw new AccountError("InvalidInput", "Enter the six-digit code from your email.");
      await cognito("ConfirmSignUp", { ClientId: client, Username: email, ConfirmationCode: code });
      return NextResponse.json({ ok: true });
    }
    if (action === "resend") {
      await cognito("ResendConfirmationCode", { ClientId: client, Username: email });
      return NextResponse.json({ ok: true });
    }
    if (action !== "login" || !password || password.length > 256) throw new AccountError("InvalidInput", "Enter your email and password.");
    const displayName = typeof body.name === "string" ? body.name.trim() : "";
    if (displayName.length > 100) throw new AccountError("InvalidInput", "Keep your display name under 100 characters.");
    const result = await cognito<{ AuthenticationResult?: { AccessToken: string; RefreshToken?: string; ExpiresIn?: number } }>("InitiateAuth", { ClientId: client, AuthFlow: "USER_PASSWORD_AUTH", AuthParameters: { USERNAME: email, PASSWORD: password } });
    if (!result.AuthenticationResult?.AccessToken) throw new AccountError("AdditionalVerification", "Additional verification is required. Please contact support.");
    if (displayName) await cognito("UpdateUserAttributes", {
      AccessToken: result.AuthenticationResult.AccessToken,
      UserAttributes: [{ Name: "name", Value: displayName }],
    });
    const response = NextResponse.json({ ok: true }); setSession(response, result.AuthenticationResult); return response;
  } catch (error) {
    if (error instanceof AccountError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "We couldn't connect to account services. Please try again." }, { status: 503 });
  }
}
