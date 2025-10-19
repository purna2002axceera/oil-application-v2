console.log('=== Test Started ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

try {
  const { app } = require('electron');
  console.log('Electron loaded successfully!');
  console.log('Electron version:', process.versions.electron);
  
  app.whenReady().then(() => {
    console.log('Electron app is ready!');
    setTimeout(() => {
      console.log('Test complete, quitting...');
      app.quit();
    }, 2000);
  });

  app.on('quit', () => {
    console.log('App quit event');
  });
} catch (error) {
  console.error('Error loading Electron:', error);
  process.exit(1);
}