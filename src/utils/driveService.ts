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
import { ScheduleDocument } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
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

export const signInWithDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
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
      console.log('User closed Google Drive sign-in popup.');
      return null;
    }
    console.error('Drive Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Get or create the default App folder in Google Drive ("সরকারি সূচি ব্যাকআপ")
 */
export async function getOrCreateAppFolder(token: string): Promise<string | null> {
  const folderName = 'সরকারি সূচি ব্যাকআপ';
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      folderName
    )}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      return folderData.id;
    }
  } catch (err) {
    console.error('Folder check/create error:', err);
  }
  return null;
}

/**
 * Save schedule file to Google Drive using multipart upload
 */
export async function uploadToGoogleDrive({
  fileName,
  fileContent,
  mimeType,
}: {
  fileName: string;
  fileContent: string;
  mimeType: 'application/json' | 'text/plain' | 'text/html';
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('গুগল ড্রাইভে সাইন-ইন করা নেই।');
  }

  const folderId = await getOrCreateAppFolder(token);

  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `গুগল ড্রাইভে ফাইল আপলোড করতে ব্যর্থ (স্ট্যাটাস: ${response.status})`);
  }

  return await response.json();
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

/**
 * List files saved in Google Drive app folder or overall Drive
 */
export async function listDriveFiles(): Promise<DriveFileItem[]> {
  const token = await getDriveAccessToken();
  if (!token) return [];

  const folderId = await getOrCreateAppFolder(token);
  let q = "trashed=false";
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  } else {
    q += " and (name contains 'Schedule' or name contains 'সূচি' or mimeType = 'application/json')";
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    console.error('List Drive files error:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Download file media content from Google Drive
 */
export async function downloadDriveFileContent(fileId: string): Promise<string> {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('গুগল ড্রাইভ অথেনটিকেশন পাওয়া যায়নি।');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`ড্রাইভ ফাইল ডাউনলোড করা সম্ভব হয়নি (স্ট্যাটাস: ${res.status})`);
  }

  return await res.text();
}

/**
 * Delete a file from Google Drive
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('গুগল ড্রাইভ সাইন-ইন নেই।');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error('ড্রাইভ থেকে ফাইল মোছা সম্ভব হয়নি।');
  }

  return true;
}
