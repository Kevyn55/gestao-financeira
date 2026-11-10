const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
const PORT = 3000;
const SERVER_URL = `http://localhost:${PORT}`;

function isServerRunning(port, callback) {
  const req = http.get(`http://localhost:${port}/api/auth/me`, (res) => {
    callback(true);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(1500, () => {
    req.destroy();
    callback(false);
  });
}

function startServer(callback) {
  isServerRunning(PORT, (running) => {
    if (running) {
      console.log('Next.js server is already running.');
      callback();
      return;
    }

    console.log('Starting Next.js server in background...');
    const appDir = path.resolve(__dirname, '..');
    const nodeExecutable = process.execPath.includes('node.exe')
      ? process.execPath
      : 'node';

    // Start next server via node
    const nextServerScript = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');

    serverProcess = spawn(nodeExecutable, [nextServerScript, 'start', '-p', String(PORT)], {
      cwd: appDir,
      env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT) },
      stdio: 'ignore',
      windowsHide: true,
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to spawn server process:', err);
    });

    // Poll until ready
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      isServerRunning(PORT, (isUp) => {
        if (isUp) {
          clearInterval(interval);
          callback();
        } else if (attempts > 30) {
          clearInterval(interval);
          dialog.showErrorBox(
            'Erro ao Iniciar Servidor',
            'O servidor local não respondeu no prazo esperado. Verifique os logs.'
          );
        }
      });
    }, 500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'Gestão Financeira & Controle de Dívidas',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startServer(() => {
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch (e) {}
    }
    app.quit();
  }
});

