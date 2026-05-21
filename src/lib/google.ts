import { google } from "googleapis";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

/**
 * OAuth client for Gmail.
 * Accepts either GMAIL_CLIENT_ID/SECRET (current .env) or GOOGLE_CLIENT_ID/SECRET (legacy).
 */
export function getGoogleOAuthClient() {
  const clientId =
    process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in environment"
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];
