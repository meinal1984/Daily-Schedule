const {
  app,
  BrowserWindow,
  dialog,
} = require("electron");

const path = require("path");
const fs = require("fs");

const PORT = 3000;

let mainWindow;

// ============================================================
// START EXPRESS SERVER
// ============================================================

function startServer() {
  const appRoot = app.getAppPath();

  // User-writable data directory
  const dataDir = path.join(
    app.getPath("userData"),
    "data"
  );

  fs.mkdirSync(dataDir, {
    recursive: true,
  });

  const dataFile = path.join(
    dataDir,
    "schedules.json"
  );

  // Packaged server
  const serverFile = path.join(
    appRoot,
    "dist",
    "server.cjs"
  );

  if (!fs.existsSync(serverFile)) {
    throw new Error(
      `Server file not found:\n${serverFile}`
    );
  }

  // Production environment
  process.env.NODE_ENV = "production";
  process.env.PORT = String(PORT);

  process.env.DATA_FILE = dataFile;

  process.env.ELECTRON_DESKTOP = "1";

  process.env.APP_ROOT = appRoot;

  // Start Express inside Electron
  require(serverFile);
}

// ============================================================
// WAIT FOR SERVER
// ============================================================

async function waitForServer(
  url,
  retries = 80
) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server is not ready yet
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );
  }

  return false;
}

// ============================================================
// CREATE WINDOW
// ============================================================

async function createWindow() {
  try {
    // Start Express server
    startServer();

    // Wait for Express
    const ready = await waitForServer(
      `http://127.0.0.1:${PORT}/`
    );

    if (!ready) {
      dialog.showErrorBox(
        "Daily Schedule",
        "অ্যাপ্লিকেশন সার্ভার চালু করা যায়নি।\n\nঅনুগ্রহ করে আবার চেষ্টা করুন।"
      );

      app.quit();

      return;
    }

    // ========================================================
    // ELECTRON WINDOW
    // ========================================================

    mainWindow = new BrowserWindow({
      width: 1440,
      height: 920,

      minWidth: 1100,
      minHeight: 700,

      title:
        "দৈনন্দিন কর্মসূচি | Daily Schedule",

      // IMPORTANT:
      // Keep Electron menu visible
      autoHideMenuBar: false,

      // Show menu when application starts
      menuBarVisible: true,

      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,

        // Security
        sandbox: false,
      },

      show: false,
    });

    // ========================================================
    // LOAD APPLICATION
    // ========================================================

    await mainWindow.loadURL(
      `http://127.0.0.1:${PORT}/`
    );

    // Show window after page loads
    mainWindow.show();

    // ========================================================
    // OPTIONAL: OPEN DEVTOOLS WITH F12
    // ========================================================

    mainWindow.webContents.on(
      "before-input-event",
      (event, input) => {
        if (
          input.key === "F12" &&
          input.type === "keyDown"
        ) {
          mainWindow.webContents.toggleDevTools();
        }
      }
    );

    // ========================================================
    // WINDOW CLOSED
    // ========================================================

    mainWindow.on(
      "closed",
      () => {
        mainWindow = null;
      }
    );
  } catch (error) {
    console.error(
      "Application startup error:",
      error
    );

    dialog.showErrorBox(
      "Daily Schedule",
      `অ্যাপ্লিকেশন চালু করা যায়নি।\n\n${
        error && error.message
          ? error.message
          : String(error)
      }`
    );

    app.quit();
  }
}

// ============================================================
// ELECTRON READY
// ============================================================

app.whenReady().then(() => {
  createWindow();

  // macOS
  app.on("activate", () => {
    if (
      BrowserWindow.getAllWindows()
        .length === 0
    ) {
      createWindow();
    }
  });
});

// ============================================================
// CLOSE ALL WINDOWS
// ============================================================

app.on(
  "window-all-closed",
  () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  }
);
