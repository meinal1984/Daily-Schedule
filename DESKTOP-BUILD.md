# Daily Schedule by MRINAL — Desktop Edition

এটি আপনার Google AI Studio/GitHub প্রজেক্টের Windows Desktop সংস্করণ। Electron দিয়ে তৈরি wrapper-এর মাধ্যমে বিদ্যমান React + Express অ্যাপটি একটি Windows application হিসেবে চলে।

## Windows EXE তৈরি

প্রথমবার Node.js 20+ ইনস্টল করুন। তারপর project folder-এ:

```powershell
npm install
npm run dist:win
```

Installer এবং Portable EXE পাবেন:

```text
release\
```

শুধু Portable EXE চাইলে:

```powershell
npm run dist:portable
```

## Gemini AI

Gemini-এর AI features চালাতে Windows environment-এ API key সেট করুন:

```powershell
$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
npm run dist:win
```

অথবা permanent user environment variable হিসেবে `GEMINI_API_KEY` যোগ করুন।

## গুরুত্বপূর্ণ

Desktop app-এর schedule data Windows-এর user data folder-এ সংরক্ষিত হবে। তাই application update/uninstall হলেও সাধারণত schedule data আলাদা user-data location-এ থাকবে।

## AI দিয়ে build করাতে চাইলে

GitHub Copilot / Gemini CLI / Claude Code-এ এই prompt ব্যবহার করতে পারেন:

"Analyze this repository as a Windows desktop application. Keep the existing React + Express functionality unchanged. Verify the Electron packaging, fix all TypeScript/build errors, generate the Windows installer and portable EXE, and make sure Gemini API calls and local schedule persistence work correctly in the packaged application."
