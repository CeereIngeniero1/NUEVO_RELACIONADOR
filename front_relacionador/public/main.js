// const { app, BrowserWindow } = require('electron');

// let mainWindow;

// function createWindow() {
//     mainWindow = new BrowserWindow({
//         width: 800,
//         height: 600,
//         webPreferences: {
//             nodeIntegration: true
//         },

//         autoHideMenuBar: true, // Esta línea oculta el menú por defecto

//     });



//     mainWindow.loadFile('index.html');

//     mainWindow.on('closed', function () {
//         mainWindow = null;
//     });
// }

// app.on('ready', createWindow);

// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') app.quit();
// });

// app.on('activate', () => {
//     if (mainWindow === null) createWindow();
// });
