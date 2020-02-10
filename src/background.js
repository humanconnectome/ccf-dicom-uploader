"use strict";

import { app, BrowserWindow, Menu, protocol } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import axios from "axios";

const Cryptr = require("cryptr");

import https from "https";

import path from "path";

const isDevelopment = process.env.NODE_ENV !== "production";
const openAboutWindow = require("about-window").default;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    // if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.on("closed", () => {
    win = null;
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.adminEmail = "issues@humanconnectome.org";
const cryptr = new Cryptr("de15217f86f7453a51dff661518ce99d");

// TODO use Vuex and put this in store
app.httpGet = function(hostname, uri, auth) {
  console.log("Requesting " + auth.username + " @ " + hostname + uri);

  const http = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      requestCert: true,
      agent: false,
      strictSSL: false
    }),
    baseURL: hostname,
    withCredentials: true,
    auth: auth
  });

  return http.get(uri);
};

// TODO use Vuex and put this in store
app.httpPost = function(hostname, uri, auth) {
  console.log("POST " + hostname + uri);

  const http = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      requestCert: true,
      agent: false,
      strictSSL: false
    }),
    baseURL: hostname,
    withCredentials: true,
    auth: auth,
    headers: {
      "Content-Type": "application/json"
    }
  });

  const response = http.post(uri);
  return response;
};

app.encrypt = function(str) {
  return cryptr.encrypt(str);
};

app.decrypt = function(str) {
  return cryptr.decrypt(str);
};

// Application main menu
const aboutIcon = path.join(__dirname, "assets/icon/png/128x128.png");
console.log(aboutIcon);

var menuTemplate = [
  {
    label: "DICOM Uploader",
    submenu: [
      {
        label: "About Application",
        // selector: "orderFrontStandardAboutPanel:"
        click: () => openAboutWindow(aboutIcon)
      },
      {
        label: "Hide",
        accelerator: "Command+H",
        selector: "hide:"
      },
      {
        type: "separator"
      },
      {
        label: "Quit",
        accelerator: "Command+Q",
        click: function() {
          app.quit();
        }
      }
    ]
  },
  {
    label: "Edit",
    submenu: [
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        role: "copy"
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste"
      },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        role: "selectall"
      }
    ]
  },
  {
    label: "View",
    submenu: [
      {
        label: "Console",
        accelerator: "CmdOrCtrl+I",
        click: function() {
          win.webContents.openDevTools(["undocked"]);
        }
        // role: "toggledevtools"
      },
      {
        label: "Reload",
        accelerator: "CmdOrCtrl+R",
        role: "reload"
      }
    ]
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click: function() {
          require("electron").shell.openExternal(
            "https://humanconnectome.org/"
          );
        }
      }
    ]
  }
];
