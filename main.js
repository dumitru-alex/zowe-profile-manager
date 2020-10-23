const path = require('path');
const os = require('os');
const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  ipcMain,
  shell,
} = require('electron');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const log = require('electron-log');

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;
let aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'ImageShrink',
    width: isDev ? 800 : 500,
    height: 600,
    closable: true,
    resizable: isDev,
    icon: './assets/icons/Icon_256x256.png',
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  // mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  // shorthand for above
  mainWindow.loadFile('./app/index.html');
}
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: 'About ImageShrink',
    width: 300,
    height: 300,
    closable: true,
    resizable: false,
    icon: './assets/icons/Icon_256x256.png',
    backgroundColor: 'white',
  });

  // mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  // shorthand for above
  aboutWindow.loadFile('./app/about.html');
}

// Start the app
app.on('ready', () => {
  createMainWindow();

  // set up the menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  globalShortcut.register('CmdOrCtrl+R', () => {
    mainWindow.reload();
  });
  globalShortcut.register('CmdOrCtrl+I', () => {
    mainWindow.toggleDevTools();
  });

  mainWindow.on('ready', () => {
    mainWindow = null;
  });
});

const menu = [
  {
    role: 'fileMenu',
    // label: 'File',
    // submenu: [
    //   {
    //     label: 'Quit',
    //     click: () => app.quit(),
    //     accelerator: 'CmdOrCtrl+W',
    //   },
    // ],
  },
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  // for Mac
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),

  // for Dev
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
];

async function shrinkImage({ imgPath, quality, destination }) {
  try {
    const pngQuality = quality / 100;
    const files = await imagemin([slash(imgPath)], {
      destination,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    });

    shell.openPath(destination);
    log.info(files);
    mainWindow.webContents.send('image:done');
  } catch (err) {
    log.error(err);
  }
}

ipcMain.on('image:minimize', (e, options) => {
  options.destination = path.join(os.homedir(), 'imageshrink');
  shrinkImage(options);
});

// for Mac
app.on('window-all-closed', () => {
  // quit when all windows are closed
  if (!isMac) {
    app.quit();
  }
});
app.on('activate', () => {
  // create new window when dock icon is clicked and no other windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
