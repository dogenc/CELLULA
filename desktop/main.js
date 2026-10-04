// CELLULA Desktop: zeigt die Web-App aus ../dist in einem eigenen Fenster – komplett offline.
// Die App wird über das eigene Schema cellula://app/ geladen. So bleiben absolute Pfade (/assets/…),
// ES-Module und der lokale Speicher (Notizen, Quiz-Lernstand) zwischen den Starts stabil erhalten.
const { app, BrowserWindow, protocol, net, shell, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = app.isPackaged ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..', 'dist');
const ORIGIN = 'cellula://app';

protocol.registerSchemesAsPrivileged([{
  scheme: 'cellula',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, allowServiceWorkers: true }
}]);

if (!app.requestSingleInstanceLock()) app.quit();

function serveFile(request) {
  const { pathname } = new URL(request.url);
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  // Nur Dateien innerhalb des App-Ordners ausliefern.
  if (!file.startsWith(ROOT + path.sep)) return new Response('Not found', { status: 404 });
  return net.fetch(pathToFileURL(file).toString());
}

// Nur sichere Adressarten an das Betriebssystem weitergeben.
function isAppURL(url) {try {const u=new URL(url);return u.protocol==='cellula:' && u.hostname==='app';}catch{return false;}}

function openSafe(url) {
  try { if (['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(url).protocol)) shell.openExternal(url); } catch {}
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 980, minHeight: 680,
    title: 'CELLULA · Zellbiologie-Atlas', backgroundColor: '#eef5fb', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  win.once('ready-to-show', () => win.show());
  // Quellen-Links, tel: und alles Fremde im Standardbrowser bzw. System öffnen.
  win.webContents.setWindowOpenHandler(({ url }) => { if (!isAppURL(url)) openSafe(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!isAppURL(url)) { e.preventDefault(); openSafe(url); } });
  win.loadURL(ORIGIN + '/');
}

app.on('second-instance', () => { const [w] = BrowserWindow.getAllWindows(); if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });

app.whenReady().then(() => {
  protocol.handle('cellula', serveFile);
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]));
  } else {
    Menu.setApplicationMenu(null);
  }
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

