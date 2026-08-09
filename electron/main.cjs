const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = 3000;

let serverProcess;
let mainWindow;

function getServerCommand() {
  const serverFile = path.join(
    process.resourcesPath,
    "app",
    "dist",
    "server.cjs"
  );

  return {
    command: process.execPath,
    args: [serverFile],
  };
}

function startServer() {
  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dataFile = path.join(dataDir, "schedules.json");

  const { command, args } = getServerCommand();

  serverProcess = spawn(command, args, {
    cwd: path.dirname(args[0]),

    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      DATA_FILE: dataFile,
      ELECTRON_DESKTOP: "1",
    },

    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (d) => {
    console.log(String(d));
  });

  serverProcess.stderr?.on("data", (d) => {
    console.error(String(d));
  });
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
  startServer();

  const ready = await waitForServer(`http://127.0.0.1:${PORT}/`);

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
      nodeIntegration: false,
    },
  });

  await mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
