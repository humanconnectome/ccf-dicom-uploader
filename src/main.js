const {app, BrowserWindow, Menu } = require('electron')

const path = require('path')
const url = require('url')
const openAboutWindow = require('about-window').default

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  console.log("Creating main window")
  // Create the browser window.
  // win = new BrowserWindow({width: 800, height: 600})
  win = new BrowserWindow({width: 730, height: 550,
    resizable: false, useContentSize: true})

  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    win.loadURL(`http://localhost:3000/`)
    console.log('from main.js: development mode')
    // win.webContents.openDevTools()
  } else {
    win.loadURL(`file://${__dirname}/index.html`)
    console.log('from main.js: not development mode')
  }

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

function loadSettings () {
  console.log('Loading settings')
  // console.log(settings)
}

function init () {
  createWindow()
  // loadSettings()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', init)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.adminEmail = 'issues@humanconnectome.org'

const axios = require('axios')
const https = require('https')

const Cryptr = require('cryptr')
const cryptr = new Cryptr('de15217f86f7453a51dff661518ce99d')

// TODO use Vuex and put this in store
app.httpGet = function (hostname, uri, auth) {
  console.log("Requesting " + auth.username + " @ " + hostname + uri)

  var http = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      requestCert: true,
      agent: false,
      strictSSL: false
    }),
    baseURL: hostname,
    withCredentials: true,
    auth: auth
  })

  var response = http.get(uri)
  return response
}

// TODO use Vuex and put this in store
app.httpPost = function (hostname, uri, auth) {
  console.log("POST " + hostname + uri)

  var http = axios.create({
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
      'Content-Type': 'application/json',
    }

  })

  var response = http.post(uri)
  return response
}

app.encrypt = function(str) {
  return cryptr.encrypt(str)
}

app.decrypt = function(str) {
  return cryptr.decrypt(str)
}

// Application main menu
var aboutIcon = path.join(__dirname, 'assets/icon/png/128x128.png')
console.log(aboutIcon)

var menuTemplate = [
{
  label: "DICOM Uploader",
  submenu: [{
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
    click: function() { app.quit(); }
  }]
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
  }]
},
{
  label: "View",
  submenu: [
  {
    label: "Console",
    accelerator: "CmdOrCtrl+I",
    click: function() {
      win.webContents.openDevTools(['undocked'])
    }
    // role: "toggledevtools"
  },
  {
    label: "Reload",
    accelerator: "CmdOrCtrl+R",
    role: "reload"
  }]
},
{
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click: function() {
        require('electron').shell.openExternal('https://humanconnectome.org/')
      }
    }
  ]
}];
