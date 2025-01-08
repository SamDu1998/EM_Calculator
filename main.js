const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    // Commented out the line below to prevent opening developer tools
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    const menu = Menu.buildFromTemplate([
        {
            label: 'Language',
            submenu: [
                {
                    label: 'English',
                    click: () => {
                        const mainWindow = BrowserWindow.getFocusedWindow();
                        mainWindow.webContents.executeJavaScript('switchLanguage("en")');
                    }
                },
                {
                    label: '中文',
                    click: () => {
                        const mainWindow = BrowserWindow.getFocusedWindow();
                        mainWindow.webContents.executeJavaScript('switchLanguage("zh")');
                    }
                }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('calculate-bandwidth', async (event, minFrequency, maxFrequency) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['calculate_bandwidth.py', minFrequency, maxFrequency]);

        pythonProcess.stdout.on('data', (data) => {
            resolve(JSON.parse(data.toString()));
        });

        pythonProcess.stderr.on('data', (data) => {
            reject(new Error(data.toString()));
        });
    });
});