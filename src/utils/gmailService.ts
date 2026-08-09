import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize or reuse Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Gmail Scopes
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://mail.google.com/');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize Auth State listener
 */
export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Popup to obtain Gmail OAuth Access Token
 */
export const signInWithGmail = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('গুগল অ্যাকাউন্ট থেকে অ্যাক্সেস টোকেন পাওয়া যায়নি।');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      console.log('User closed Gmail sign-in popup.');
      return null;
    }
    console.error('Gmail Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGmailAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getGmailUser = (): User | null => {
  return auth.currentUser;
};

export const logoutGmail = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Base64URL encoding helper according to RFC 4648 Section 5
 */
function base64UrlEncode(str: string): string {
  // Convert string to UTF-8 array then to base64
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send email via Gmail API (POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send)
 */
export const sendGmailEmail = async ({
  to,
  subject,
  bodyText,
  bodyHtml,
}: {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}): Promise<{ id: string; threadId: string }> => {
  const token = await getGmailAccessToken();
  if (!token) {
    throw new Error('জি-মেইল লগইন করা নেই। অনুগ্রহ করে প্রথমে সাইন-ইন করুন।');
  }

  // Build RFC 2822 MIME message
  const utf8Subject = `=?utf-8?B?${btoa(new TextEncoder().encode(subject).reduce((acc, byte) => acc + String.fromCharCode(byte), ''))}?=`;

  let mimeMessage = '';
  mimeMessage += `To: ${to}\r\n`;
  mimeMessage += `Subject: ${utf8Subject}\r\n`;
  mimeMessage += `MIME-Version: 1.0\r\n`;

  if (bodyHtml) {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    mimeMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n`;
    mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeMessage += `${btoa(new TextEncoder().encode(bodyText).reduce((acc, byte) => acc + String.fromCharCode(byte), ''))}\r\n\r\n`;

    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
    mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeMessage += `${btoa(new TextEncoder().encode(bodyHtml).reduce((acc, byte) => acc + String.fromCharCode(byte), ''))}\r\n\r\n`;

    mimeMessage += `--${boundary}--`;
  } else {
    mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n`;
    mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeMessage += `${btoa(new TextEncoder().encode(bodyText).reduce((acc, byte) => acc + String.fromCharCode(byte), ''))}`;
  }

  const raw = base64UrlEncode(mimeMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `ইমেইল পাঠানো সম্ভব হয়নি (স্ট্যাটাস: ${response.status})`);
  }

  return await response.json();
};

/**
 * Fetch list of recently sent emails
 */
export const fetchRecentSentEmails = async (maxResults = 5) => {
  const token = await getGmailAccessToken();
  if (!token) return [];

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=label:SENT&maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!listRes.ok) return [];

  const data = await listRes.json();
  if (!data.messages) return [];

  const messagesDetails = await Promise.all(
    data.messages.map(async (msg: { id: string }) => {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!detailRes.ok) return null;
      const detail = await detailRes.json();
      const headers = detail.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: msg.id,
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: detail.snippet,
      };
    })
  );

  return messagesDetails.filter(Boolean);
};
