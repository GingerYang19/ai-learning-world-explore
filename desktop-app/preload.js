// Preload script - minimal, just exposes platform info
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  version: '1.0.0'
});
