// const { app, BrowserWindow } = require('electron');
// const path = require('path');
// const { spawn, exec } = require('child_process');
// const http = require('http');
// const fs = require('fs');

// let mainWindow;
// let backendProcess;
// let nextProcess;
// let logStream;

// // Create log file in user's home directory for production
// const logPath = path.join(app.getPath('userData'), 'app.log');
// console.log('Log file location:', logPath);

// function log(message) {
//   const timestamp = new Date().toISOString();
//   const logMessage = `[${timestamp}] ${message}\n`;
//   console.log(message);
  
//   // Also write to file in production
//   if (!app.isPackaged) return;
  
//   try {
//     fs.appendFileSync(logPath, logMessage);
//   } catch (err) {
//     console.error('Failed to write to log file:', err);
//   }
// }

// // Prevent app from quitting too early
// app.on('will-quit', (e) => {
//   console.log('App is about to quit');
// });

// // Catch unhandled errors
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
// });

// process.on('unhandledRejection', (error) => {
//   console.error('Unhandled Rejection:', error);
// });

// function killPort(port) {
//   return new Promise((resolve) => {
//     console.log(`Checking if port ${port} is in use...`);
    
//     // Windows command to kill process on port
//     const command = process.platform === 'win32'
//       ? `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port}') DO taskkill /PID %P /F`
//       : `lsof -ti:${port} | xargs kill -9`;
    
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         console.log(`Port ${port} is free or couldn't kill process`);
//       } else {
//         console.log(`Killed process on port ${port}`);
//       }
//       // Always resolve, don't fail if port is already free
//       setTimeout(resolve, 1000);
//     });
//   });
// }

// function startBackend() {
//   // Check if running in development or production
//   const isDev = !app.isPackaged;
  
//   // In production, resources are in a different location
//   const jarPath = isDev
//     ? path.join(__dirname, 'backend', 'oil-mart-0.0.1-SNAPSHOT.jar')
//     : path.join(process.resourcesPath, 'backend', 'oil-mart-0.0.1-SNAPSHOT.jar');
  
//   const workingDir = isDev
//     ? path.join(__dirname, 'backend')
//     : path.join(process.resourcesPath, 'backend');
  
//   console.log('Starting backend from:', jarPath);
//   console.log('Working directory:', workingDir);
//   console.log('Is packaged:', app.isPackaged);
//   console.log('Is development:', isDev);
  
//   // Check if JAR exists
//   const fs = require('fs');
//   if (!fs.existsSync(jarPath)) {
//     console.error('ERROR: Backend JAR not found at:', jarPath);
//     console.error('process.resourcesPath:', process.resourcesPath);
//     console.error('__dirname:', __dirname);
//     return;
//   }
  
//   backendProcess = spawn('java', ['-jar', jarPath], { 
//     stdio: 'pipe', // Change from 'inherit' to 'pipe' to capture output
//     cwd: workingDir
//   });

//   backendProcess.stdout.on('data', (data) => {
//     console.log('Backend:', data.toString());
//   });

//   backendProcess.stderr.on('data', (data) => {
//     console.error('Backend Error:', data.toString());
//   });

//   backendProcess.on('error', (err) => {
//     console.error('Failed to start backend:', err);
//   });

//   backendProcess.on('exit', (code) => {
//     console.log(`Backend exited with code ${code}`);
//   });
// }

// function startNextServer() {
//   return new Promise((resolve, reject) => {
//     console.log('Starting Next.js server...');
    
//     // Check if we're in a packaged app
//     const isDev = !app.isPackaged;
    
//     if (!isDev) {
//       console.log('Running in PRODUCTION mode (packaged app)');
//       // In production, Next.js needs to run from the app.asar location
//       const nextDir = path.join(process.resourcesPath, 'app.asar');
//       console.log('Next.js directory:', nextDir);
//     } else {
//       console.log('Running in DEVELOPMENT mode');
//     }
    
//     // Start Next.js server
//     nextProcess = spawn('npm', ['run', 'start'], {
//       stdio: 'pipe',
//       shell: true,
//       cwd: isDev ? __dirname : path.join(process.resourcesPath, 'app.asar')
//     });

//     let resolved = false;

//     nextProcess.stdout.on('data', (data) => {
//       const output = data.toString();
//       console.log('Next.js:', output);
      
//       // Wait for Next.js to be ready
//       if (!resolved && (output.includes('started server') || output.includes('Ready') || output.includes('Local:'))) {
//         resolved = true;
//         setTimeout(() => resolve(), 3000); // Give it 3 seconds
//       }
//     });

//     nextProcess.stderr.on('data', (data) => {
//       console.error('Next.js Error:', data.toString());
//     });

//     nextProcess.on('error', (err) => {
//       console.error('Failed to start Next.js:', err);
//       if (!resolved) {
//         resolved = true;
//         reject(err);
//       }
//     });

//     nextProcess.on('exit', (code) => {
//       console.log(`Next.js process exited with code ${code}`);
//       if (!resolved && code !== 0) {
//         resolved = true;
//         reject(new Error(`Next.js exited with code ${code}`));
//       }
//     });

//     // Timeout after 40 seconds
//     setTimeout(() => {
//       if (!resolved) {
//         resolved = true;
//         reject(new Error('Next.js server failed to start within 40 seconds'));
//       }
//     }, 40000);
//   });
// }

// function waitForServer(url, timeout = 45000) {
//   return new Promise((resolve, reject) => {
//     const startTime = Date.now();
//     let attemptCount = 0;
    
//     const checkServer = () => {
//       attemptCount++;
//       console.log(`Attempt ${attemptCount}: Checking if server is ready at ${url}...`);
      
//       http.get(url, (res) => {
//         console.log('Server responded with status:', res.statusCode);
//         if (res.statusCode === 200 || res.statusCode === 304) {
//           console.log('✓ Server is ready!');
//           resolve();
//         } else {
//           retry();
//         }
//       }).on('error', (err) => {
//         console.log('Server not ready yet:', err.code || err.message);
//         retry();
//       });
//     };

//     const retry = () => {
//       if (Date.now() - startTime > timeout) {
//         reject(new Error('Server failed to start within timeout'));
//         return;
//       }
//       setTimeout(checkServer, 2000); // Check every 2 seconds
//     };

//     checkServer();
//   });
// }

// async function createWindow() {
//   console.log('Creating Electron window...');
  
//   mainWindow = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     show: false,
//     backgroundColor: '#ffffff',
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//       webSecurity: !app.isPackaged ? false : true, // Only disable in dev
//       allowRunningInsecureContent: !app.isPackaged,
//       enableRemoteModule: false
//     },
//     icon: path.join(__dirname, 'public', 'icon.png') // Add your icon here
//   });

//   // Handle navigation errors
//   mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
//     console.error('Failed to load:', errorCode, errorDescription);
    
//     // Retry loading after a delay
//     setTimeout(() => {
//       console.log('Retrying to load URL...');
//       mainWindow.loadURL('http://localhost:3000');
//     }, 2000);
//   });

//   // Show window when page has loaded
//   mainWindow.webContents.on('did-finish-load', () => {
//     console.log('Page finished loading');
//     mainWindow.show();
    
//     // Check if page is actually blank
//     mainWindow.webContents.executeJavaScript('document.body.innerHTML.length').then(length => {
//       console.log('Page content length:', length);
//       if (length < 100) {
//         console.warn('⚠ Page appears blank! Check Next.js build.');
//       }
//     });
//   });

//   // Log console messages from the webpage
//   mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
//     console.log(`[Browser Console] ${message}`);
//   });

//   // Log any errors
//   mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
//     console.error('Failed to load:', errorCode, errorDescription, validatedURL);
//   });

//   // Intercept requests to see what's failing
//   mainWindow.webContents.session.webRequest.onErrorOccurred((details) => {
//     console.error('Request failed:', details.url, details.error);
//   });

//   mainWindow.once('ready-to-show', () => {
//     console.log('Window is ready to show');
//     mainWindow.show();
//   });

//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });

//   console.log('Loading URL: http://localhost:3000');
  
//   try {
//     await mainWindow.loadURL('http://localhost:3000', {
//       userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
//     });
//     console.log('URL loaded successfully');
    
//     // Give page time to render
//     await new Promise(resolve => setTimeout(resolve, 2000));
    
//     // Check what's actually loaded
//     const title = await mainWindow.webContents.getTitle();
//     const url = mainWindow.webContents.getURL();
//     console.log('Page title:', title);
//     console.log('Current URL:', url);
    
//   } catch (error) {
//     console.error('Error loading URL:', error);
//     throw error;
//   }

//   // Open DevTools only in development
//   if (process.env.ELECTRON_DEV === 'true' || !app.isPackaged) {
//     mainWindow.webContents.openDevTools();
//   }
// }

// app.whenReady().then(async () => {
//   log('========================================');
//   log('Electron app is ready');
//   log('Working directory: ' + __dirname);
//   log('Resources path: ' + process.resourcesPath);
//   log('User data path: ' + app.getPath('userData'));
//   log('Is packaged: ' + app.isPackaged);
//   log('Environment: ' + (process.env.ELECTRON_DEV === 'true' ? 'Development' : 'Production'));
//   log('========================================');
  
//   try {
//     // Kill any existing processes on ports
//     console.log('\n[0/6] Cleaning up ports...');
//     await killPort(3000);
//     await killPort(8080);
    
//     // Start backend first
//     console.log('\n[1/6] Starting backend...');
//     startBackend();
//     console.log('Waiting 8 seconds for backend to initialize...');
//     await new Promise(resolve => setTimeout(resolve, 8000));
    
//     // Then start Next.js
//     console.log('\n[2/6] Starting Next.js server...');
//     await startNextServer();
    
//     // Wait for Next.js to be responsive
//     console.log('\n[3/6] Waiting for Next.js to be responsive...');
//     await waitForServer('http://localhost:3000');
    
//     // Additional safety delay
//     console.log('\n[4/6] Additional safety delay...');
//     await new Promise(resolve => setTimeout(resolve, 3000));
    
//     // Finally create window
//     console.log('\n[5/6] Creating window...');
//     await createWindow();
    
//     console.log('\n========================================');
//     console.log('✓ Application started successfully!');
//     console.log('========================================');
//   } catch (error) {
//     console.error('\n========================================');
//     console.error('✗ Failed to start application:', error);
//     console.error('Error stack:', error.stack);
//     console.error('========================================');
//     // Don't quit immediately, wait so we can see the error
//     setTimeout(() => {
//       app.quit();
//     }, 10000);
//   }
// });

// app.on('window-all-closed', () => {
//   console.log('All windows closed');
//   if (backendProcess) {
//     console.log('Killing backend process...');
//     backendProcess.kill();
//   }
//   if (nextProcess) {
//     console.log('Killing Next.js process...');
//     nextProcess.kill();
//   }
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('before-quit', () => {
//   console.log('Before quit event - cleaning up...');
//   if (backendProcess) {
//     backendProcess.kill('SIGTERM');
//   }
//   if (nextProcess) {
//     nextProcess.kill('SIGTERM');
//   }
// });

// // Handle app activation (macOS)
// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let backendProcess;
let nextProcess;

// Create log file in user's home directory for production
const logPath = path.join(app.getPath('userData'), 'app.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  log('Uncaught Exception: ' + error.message);
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  log('Unhandled Rejection: ' + error.message);
  console.error('Unhandled Rejection:', error);
});

function killPort(port) {
  return new Promise((resolve) => {
    console.log(`Checking if port ${port} is in use...`);
    
    const command = process.platform === 'win32'
      ? `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port}') DO taskkill /PID %P /F`
      : `lsof -ti:${port} | xargs kill -9`;
    
    exec(command, (error) => {
      if (error) {
        console.log(`Port ${port} is free or couldn't kill process`);
      } else {
        console.log(`Killed process on port ${port}`);
      }
      setTimeout(resolve, 1000);
    });
  });
}

function startBackend() {
  const isDev = !app.isPackaged;
  
  const jarPath = isDev
    ? path.join(__dirname, 'backend', 'oil-mart-0.0.1-SNAPSHOT.jar')
    : path.join(process.resourcesPath, 'backend', 'oil-mart-0.0.1-SNAPSHOT.jar');
  
  const workingDir = isDev
    ? path.join(__dirname, 'backend')
    : path.join(process.resourcesPath, 'backend');
  
  log('Starting backend from: ' + jarPath);
  log('Working directory: ' + workingDir);
  
  if (!fs.existsSync(jarPath)) {
    log('ERROR: Backend JAR not found at: ' + jarPath);
    return;
  }
  
  backendProcess = spawn('java', ['-jar', jarPath], { 
    stdio: 'pipe',
    cwd: workingDir
  });

  backendProcess.stdout.on('data', (data) => {
    log('Backend: ' + data.toString());
  });

  backendProcess.stderr.on('data', (data) => {
    log('Backend Error: ' + data.toString());
  });

  backendProcess.on('error', (err) => {
    log('Failed to start backend: ' + err.message);
  });

  backendProcess.on('exit', (code) => {
    log(`Backend exited with code ${code}`);
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    log('Starting Next.js server...');
    
    const isDev = !app.isPackaged;
    
    if (isDev) {
      log('Running in DEVELOPMENT mode');
      // In development, use npm
      nextProcess = spawn('npm', ['run', 'start'], {
        stdio: 'pipe',
        shell: true,
        cwd: __dirname
      });
    } else {
      log('Running in PRODUCTION mode (packaged app)');
      
      // In production, use process.execPath which points to the electron executable
      // which has Node.js built in
      const appDir = path.join(process.resourcesPath, 'app.asar.unpacked');
      const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');
      
      log('Electron executable: ' + process.execPath);
      log('App directory: ' + appDir);
      log('Next.js bin: ' + nextBin);
      
      // Check if files exist
      if (!fs.existsSync(nextBin)) {
        log('ERROR: Next.js binary not found at: ' + nextBin);
        log('Trying alternate path...');
        
        // Try without .unpacked
        const altAppDir = path.join(process.resourcesPath, 'app.asar');
        const altNextBin = path.join(altAppDir, 'node_modules', 'next', 'dist', 'bin', 'next');
        log('Alternative Next.js bin: ' + altNextBin);
        
        if (!fs.existsSync(altNextBin)) {
          reject(new Error('Next.js binary not found in either location'));
          return;
        }
      }
      
      // Use process.execPath (Electron's node) to run Next.js
      nextProcess = spawn(process.execPath, [
        nextBin,
        'start',
        '-p',
        '3000'
      ], {
        stdio: 'pipe',
        cwd: appDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          ELECTRON_RUN_AS_NODE: '1' // This tells Electron to run as Node.js
        }
      });
    }

    let resolved = false;

    nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      log('Next.js: ' + output);
      
      if (!resolved && (output.includes('started server') || output.includes('Ready') || output.includes('Local:'))) {
        resolved = true;
        setTimeout(() => resolve(), 3000);
      }
    });

    nextProcess.stderr.on('data', (data) => {
      log('Next.js Error: ' + data.toString());
    });

    nextProcess.on('error', (err) => {
      log('Failed to start Next.js: ' + err.message);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    nextProcess.on('exit', (code) => {
      log(`Next.js process exited with code ${code}`);
      if (!resolved && code !== 0) {
        resolved = true;
        reject(new Error(`Next.js exited with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Next.js server failed to start within 40 seconds'));
      }
    }, 40000);
  });
}

function waitForServer(url, timeout = 45000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let attemptCount = 0;
    
    const checkServer = () => {
      attemptCount++;
      log(`Attempt ${attemptCount}: Checking if server is ready at ${url}...`);
      
      http.get(url, (res) => {
        log('Server responded with status: ' + res.statusCode);
        if (res.statusCode === 200 || res.statusCode === 304) {
          log('✓ Server is ready!');
          resolve();
        } else {
          retry();
        }
      }).on('error', (err) => {
        log('Server not ready yet: ' + (err.code || err.message));
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error('Server failed to start within timeout'));
        return;
      }
      setTimeout(checkServer, 2000);
    };

    checkServer();
  });
}

async function createWindow() {
  log('Creating Electron window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !app.isPackaged ? false : true,
      allowRunningInsecureContent: !app.isPackaged,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'public', 'icon.png')
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log('Failed to load: ' + errorCode + ' ' + errorDescription);
    
    setTimeout(() => {
      log('Retrying to load URL...');
      mainWindow.loadURL('http://localhost:3000');
    }, 2000);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log('Page finished loading');
    mainWindow.show();
    
    mainWindow.webContents.executeJavaScript('document.body.innerHTML.length').then(length => {
      log('Page content length: ' + length);
      if (length < 100) {
        log('⚠ Page appears blank! Check Next.js build.');
      }
    });
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    log(`[Browser Console] ${message}`);
  });

  mainWindow.webContents.session.webRequest.onErrorOccurred((details) => {
    log('Request failed: ' + details.url + ' ' + details.error);
  });

  mainWindow.once('ready-to-show', () => {
    log('Window is ready to show');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log('Loading URL: http://localhost:3000');
  
  try {
    await mainWindow.loadURL('http://localhost:3000', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    log('URL loaded successfully');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const title = await mainWindow.webContents.getTitle();
    const url = mainWindow.webContents.getURL();
    log('Page title: ' + title);
    log('Current URL: ' + url);
    
  } catch (error) {
    log('Error loading URL: ' + error.message);
    throw error;
  }

  if (process.env.ELECTRON_DEV === 'true' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  log('========================================');
  log('Electron app is ready');
  log('Working directory: ' + __dirname);
  log('Resources path: ' + process.resourcesPath);
  log('User data path: ' + app.getPath('userData'));
  log('Is packaged: ' + app.isPackaged);
  log('Log file: ' + logPath);
  log('========================================');
  
  try {
    log('[0/6] Cleaning up ports...');
    await killPort(3000);
    await killPort(8080);
    
    log('[1/6] Starting backend...');
    startBackend();
    log('Waiting 8 seconds for backend to initialize...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    log('[2/6] Starting Next.js server...');
    await startNextServer();
    
    log('[3/6] Waiting for Next.js to be responsive...');
    await waitForServer('http://localhost:3000');
    
    log('[4/6] Additional safety delay...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    log('[5/6] Creating window...');
    await createWindow();
    
    log('========================================');
    log('✓ Application started successfully!');
    log('========================================');
  } catch (error) {
    log('========================================');
    log('✗ Failed to start application: ' + error.message);
    log('Error stack: ' + error.stack);
    log('========================================');
    
    // Show error dialog to user
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Application Error',
      'Failed to start the application. Please check the log file at:\n' + logPath
    );
    
    setTimeout(() => {
      app.quit();
    }, 10000);
  }
});

app.on('window-all-closed', () => {
  log('All windows closed');
  if (backendProcess) {
    log('Killing backend process...');
    backendProcess.kill();
  }
  if (nextProcess) {
    log('Killing Next.js process...');
    nextProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log('Before quit event - cleaning up...');
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
  if (nextProcess) {
    nextProcess.kill('SIGTERM');
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});