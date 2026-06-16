import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = `${url.origin}/api/v1/user/auth/google/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email%20profile`;

  return NextResponse.redirect(authUrl);
}
