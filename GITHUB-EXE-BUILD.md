# GitHub EXE Build

1. Upload/replace the repository contents with this project.
2. Confirm these files exist:
   - package.json
   - electron/main.cjs
   - .github/workflows/build-windows.yml
3. Go to GitHub → Actions → Build Windows EXE.
4. Click Run workflow.
5. Wait for the green check.
6. Open the completed workflow and download the Artifact:
   Daily-Schedule-Windows

The artifact contains the Windows installer and portable EXE.

No Electron download is required on your local PC during the GitHub build.
