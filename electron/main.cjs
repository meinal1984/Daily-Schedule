const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const PORT = 3000;

let mainWindow;

function startServer() {
  const appRoot = app.getAppPath();

  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dataFile = path.join(dataDir, "schedules.json");
  const serverFile = path.join(appRoot, "dist", "server.cjs");

  if (!fs.existsSync(serverFile)) {
    throw new Error(`Server file not found: ${serverFile}`);
  }

  process.env.NODE_ENV = "production";
  process.env.PORT = String(PORT);
  process.env.DATA_FILE = dataFile;
  process.env.ELECTRON_DESKTOP = "1";
  process.env.APP_ROOT = appRoot;

  // Start Express server inside the Electron main process
  require(serverFile);
}

async function waitForServer(url, retries = 80) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return true;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

async function createWindow() {
  try {
    startServer();

    const ready = await waitForServer(
      `http://127.0.0.1:${PORT}/`
    );

    if (!ready) {
      dialog.showErrorBox(
        "Daily Schedule",
        "অ্যাপ্লিকেশন সার্ভার চালু করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
      );

      app.quit();
      return;
    }

    mainWindow = new BrowserWindow({
      width: 1440,
      height: 920,
      minWidth: 1100,
      minHeight: 700,

      title: "দৈনন্দিন কর্মসূচি | Daily Schedule",

      autoHideMenuBar: true,

      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    await mainWindow.loadURL(
      `http://127.0.0.1:${PORT}/`
    );

  } catch (error) {
    console.error("Application startup error:", error);

    dialog.showErrorBox(
      "Daily Schedule",
      `অ্যাপ্লিকেশন চালু করা যায়নি।\n\n${error.message}`
    );

    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
