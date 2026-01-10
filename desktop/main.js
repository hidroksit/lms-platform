const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray = null;
let downloadItems = [];

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the Next.js app (Localhost for development)
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
        mainWindow.loadURL(frontendURL);
    } catch (e) {
        console.log('Error loading URL:', e);
    }

    // Auto-updater events
    autoUpdater.on('update-available', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Güncelleme Mevcut',
            message: 'Yeni bir sürüm mevcut. İndiriliyor...',
            buttons: ['Tamam']
        });
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Güncelleme Hazır',
            message: 'Güncelleme indirildi. Uygulamayı yeniden başlatmak ister misiniz?',
            buttons: ['Yeniden Başlat', 'Sonra']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    // Check for updates on startup (production only)
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 3000);
    }

    // Download manager
    session.defaultSession.on('will-download', (event, item, webContents) => {
        const fileName = item.getFilename();
        const downloadPath = path.join(app.getPath('downloads'), fileName);

        item.setSavePath(downloadPath);

        const downloadItem = {
            id: Date.now(),
            fileName: fileName,
            totalBytes: item.getTotalBytes(),
            receivedBytes: 0,
            state: 'progressing',
            savePath: downloadPath
        };

        downloadItems.push(downloadItem);

        item.on('updated', (event, state) => {
            if (state === 'progressing') {
                downloadItem.receivedBytes = item.getReceivedBytes();
                downloadItem.progress = Math.round((item.getReceivedBytes() / item.getTotalBytes()) * 100);

                // Send progress to renderer
                mainWindow.webContents.send('download-progress', downloadItem);
            }
        });

        item.once('done', (event, state) => {
            downloadItem.state = state;
            if (state === 'completed') {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'İndirme Tamamlandı',
                    message: `${fileName} başarıyla indirildi!`,
                    buttons: ['Klasörü Aç', 'Tamam']
                }).then((result) => {
                    if (result.response === 0) {
                        require('electron').shell.showItemInFolder(downloadPath);
                    }
                });
            } else if (state === 'interrupted') {
                dialog.showMessageBox(mainWindow, {
                    type: 'error',
                    title: 'İndirme Başarısız',
                    message: `${fileName} indirilemedi.`,
                    buttons: ['Tamam']
                });
            }
            mainWindow.webContents.send('download-complete', downloadItem);
        });
    });

    // Handle close event to minimize to tray instead of quitting
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();

            // Show notification that app is still running
            new Notification({
                title: 'LMS Platform',
                body: 'Uygulama arka planda çalışmaya devam ediyor.',
            }).show();
        }
        return false;
    });
}

function createTray() {
    // For demo purposes, using empty icon. In production, use proper icon.
    try {
        const nativeImage = require('electron').nativeImage;
        const icon = nativeImage.createEmpty();
        tray = new Tray(icon);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Göster',
                click: () => {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
            { type: 'separator' },
            {
                label: 'Güncelleme Kontrol Et',
                click: () => {
                    autoUpdater.checkForUpdates();
                }
            },
            {
                label: 'İndirmeler',
                click: () => {
                    require('electron').shell.openPath(app.getPath('downloads'));
                }
            },
            { type: 'separator' },
            {
                label: 'Çıkış',
                click: () => {
                    app.isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('LMS Platform');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
            mainWindow.show();
            mainWindow.focus();
        });
    } catch (e) {
        console.log('Tray creation failed:', e);
    }
}

function createMenu() {
    const template = [
        {
            label: 'Dosya',
            submenu: [
                {
                    label: 'Offline Senkronizasyon',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Offline Senkronizasyon',
                            message: 'Verileriniz senkronize ediliyor...',
                            buttons: ['Tamam']
                        });
                        mainWindow.webContents.send('sync-offline-data');
                    }
                },
                { type: 'separator' },
                { label: 'Çıkış', click: () => { app.isQuitting = true; app.quit(); } }
            ]
        },
        {
            label: 'Görünüm',
            submenu: [
                { role: 'reload', label: 'Yenile' },
                { role: 'forceReload', label: 'Zorla Yenile' },
                { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Yakınlaştırmayı Sıfırla' },
                { role: 'zoomIn', label: 'Yakınlaştır' },
                { role: 'zoomOut', label: 'Uzaklaştır' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Tam Ekran' }
            ]
        },
        {
            label: 'Araçlar',
            submenu: [
                {
                    label: 'İndirme Yöneticisi',
                    click: () => {
                        const downloads = downloadItems.map(d =>
                            `${d.fileName} - ${d.state === 'completed' ? 'Tamamlandı' : d.progress + '%'}`
                        ).join('\n');

                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'İndirme Yöneticisi',
                            message: downloads || 'Henüz indirme yok',
                            buttons: ['Tamam']
                        });
                    }
                },
                {
                    label: 'Webcam ve Mikrofon Ayarları',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Medya Ayarları',
                            message: 'Webcam ve mikrofon ayarlarına sistem ayarlarından erişebilirsiniz.',
                            buttons: ['Tamam']
                        });
                    }
                }
            ]
        },
        {
            label: 'Yardım',
            submenu: [
                {
                    label: 'Güncelleme Kontrol Et',
                    click: () => {
                        autoUpdater.checkForUpdates().then(() => {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: 'Güncelleme Kontrolü',
                                message: 'Güncellemeler kontrol ediliyor...',
                                buttons: ['Tamam']
                            });
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'Hakkında',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Hakkında',
                            message: `LMS Masaüstü Uygulaması v${app.getVersion()}\n\nElectron ile geliştirilmiştir.\n\nÖzellikler:\n• Otomatik güncelleme\n• İndirme yöneticisi\n• Offline senkronizasyon\n• Webcam/Mikrofon desteği`,
                            buttons: ['Tamam']
                        });
                    }
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Do not quit, keep in tray
    }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('check-for-updates', () => {
    return autoUpdater.checkForUpdates();
});
ipcMain.handle('get-downloads', () => {
    return downloadItems;
});
ipcMain.handle('open-download-folder', () => {
    require('electron').shell.openPath(app.getPath('downloads'));
});

// Offline sync handler
ipcMain.handle('sync-offline-data', async () => {
    // This would implement actual offline data sync
    return { success: true, message: 'Offline veriler senkronize edildi' };
});
