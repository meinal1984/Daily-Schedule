import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with requested scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const initGoogleAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token missing in memory, user will click Sign In
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Access Token পাওয়া যায়নি।');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Interface for Form Response
export interface FormResponseItem {
  responseId: string;
  createTime: string;
  answers: Record<string, { textAnswers?: { answers: { value: string }[] } }>;
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri: string;
  items?: Array<{
    itemId: string;
    title: string;
    questionItem?: {
      question: {
        questionId: string;
      };
    };
  }>;
}

// 1. Create a Google Form for a Daily Program
export const createProgramGoogleForm = async (
  title: string,
  description: string
): Promise<GoogleFormDetails> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Accounts-এ সাইন ইন করা নেই। অনুগ্রহ করে প্রথমে সাইন ইন করুন।');
  }

  // Step A: Create blank form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: title || 'দৈনন্দিন কর্মসূচি উপস্থিতি ও সভার নিশ্চিতকরণ',
        documentTitle: title || 'দৈনন্দিন কর্মসূচি উপস্থিতি ফর্ম',
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Form তৈরিতে ত্রুটি: ${createRes.status} - ${errText}`);
  }

  const formData: GoogleFormDetails = await createRes.json();
  const formId = formData.formId;

  // Step B: Batch update form items (Questions)
  const batchRequests = {
    requests: [
      {
        updateFormInfo: {
          info: {
            description: description || 'অনুগ্রহ করে সভায় আপনার অংশগ্রহণ নিশ্চিত করুন।',
          },
          updateMask: 'description',
        },
      },
      {
        createItem: {
          item: {
            title: 'আপনার নাম ও পদবী (Name & Designation)',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 0 },
        },
      },
      {
        createItem: {
          item: {
            title: 'দপ্তর / সংস্থার নাম (Office / Department)',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 1 },
        },
      },
      {
        createItem: {
          item: {
            title: 'যোগাযোগের মোবাইল নম্বর (Mobile Number)',
            questionItem: {
              question: {
                required: false,
                textQuestion: { paragraph: false },
              },
            },
          },
          location: { index: 2 },
        },
      },
      {
        createItem: {
          item: {
            title: 'অংশগ্রহণ সম্পর্কিত সিদ্ধান্ত (Attendance Status)',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'RADIO',
                  options: [
                    { value: 'স্বশরীরে উপস্থিত থাকবো (Will Attend In-Person)' },
                    { value: 'অনলাইনে / ভার্চুয়ালি যুক্ত হবো (Will Join Online)' },
                    { value: 'প্রতিনিধি প্রেরণ করবো (Will Send Representative)' },
                    { value: 'উপস্থিত হওয়া সম্ভব নয় (Unable to Attend)' },
                  ],
                },
              },
            },
          },
          location: { index: 3 },
        },
      },
      {
        createItem: {
          item: {
            title: 'অন্যান্য মন্তব্য / প্রস্তাবনা (Remarks/Suggestions)',
            questionItem: {
              question: {
                required: false,
                textQuestion: { paragraph: true },
              },
            },
          },
          location: { index: 4 },
        },
      },
    ],
  };

  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batchRequests),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.warn('Batch update failed:', errText);
  }

  // Refetch complete form object
  return await getFormDetails(formId);
};

// 2. Fetch Form Details
export const getFormDetails = async (formId: string): Promise<GoogleFormDetails> => {
  const token = getAccessToken();
  if (!token) throw new Error('Google Accounts-এ সাইন ইন করা নেই।');

  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Google Form তথ্য আনতে ব্যর্থ: ${res.statusText}`);
  }

  return await res.json();
};

// 3. Fetch Form Responses
export const getFormResponses = async (formId: string): Promise<FormResponseItem[]> => {
  const token = getAccessToken();
  if (!token) throw new Error('Google Accounts-এ সাইন ইন করা নেই।');

  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Google Form রেসপন্স আনতে ব্যর্থ: ${res.statusText}`);
  }

  const data = await res.json();
  return data.responses || [];
};

// 4. List Google Forms from Drive
export const listGoogleFormsFromDrive = async (): Promise<
  Array<{ id: string; name: string; createdTime: string; webViewLink?: string }>
> => {
  const token = getAccessToken();
  if (!token) throw new Error('Google Accounts-এ সাইন ইন করা নেই।');

  const q = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,createdTime,webViewLink)&orderBy=createdTime%20desc&pageSize=20`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Google Drive থেকে ফর্ম তালিকা আনতে ব্যর্থ: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
};
