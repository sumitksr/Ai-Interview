import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const REDIRECT_URI = `${url.origin}/api/v1/user/auth/github/callback`;

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`;

  return NextResponse.redirect(authUrl);
}
