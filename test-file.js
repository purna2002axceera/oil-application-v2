const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message); // Also try console
}

log('=== Test Started ===');
log('Node version: ' + process.version);
log('Platform: ' + process.platform);
log('__dirname: ' + __dirname);

try {
  const { app } = require('electron');
  log('Electron loaded successfully!');
  log('Electron version: ' + process.versions.electron);
  
  app.whenReady().then(() => {
    log('Electron app is READY!');
    setTimeout(() => {
      log('Quitting app...');
      app.quit();
    }, 3000);
  });

  app.on('quit', () => {
    log('App quit event fired');
  });

  app.on('ready', () => {
    log('Ready event fired');
  });

} catch (error) {
  log('ERROR: ' + error.message);
  log('Stack: ' + error.stack);
}