// Electron IPC channels and preload bridges: the private API between the UI and the privileged main process.
import { scanLines } from './common.js';

export function extractIpc(sources) {
  return scanLines(sources, [
    { re: /\bipcMain\.(on|once|handle|handleOnce)\(\s*["'`]([^"'`]{1,100})["'`]/g, group: 2, meta: (v, m) => ({ side: 'main', how: m[1] }) },
    { re: /\bipcRenderer\.(send|sendSync|invoke|on|once|sendTo|sendToHost)\(\s*["'`]([^"'`]{1,100})["'`]/g, group: 2, meta: (v, m) => ({ side: 'renderer', how: m[1] }) },
    { re: /\bwebContents\.send\(\s*["'`]([^"'`]{1,100})["'`]/g, meta: () => ({ side: 'main->renderer', how: 'webContents.send' }) },
    { re: /\b(?:sender|contents|win|window|mainWindow)\.(?:webContents\.)?send\(\s*["'`]([^"'`]{1,100})["'`]/g, meta: () => ({ side: 'main->renderer', how: 'send' }) },
    { re: /\bcontextBridge\.exposeInMainWorld\(\s*["'`]([^"'`]{1,100})["'`]/g, map: v => `bridge:${v}`, meta: () => ({ side: 'preload', how: 'exposeInMainWorld' }) },
    { re: /\bprotocol\.(?:handle|registerFileProtocol|registerStringProtocol|registerBufferProtocol|registerHttpProtocol)\(\s*["'`]([^"'`]{1,60})["'`]/g, map: v => `protocol:${v}`, meta: () => ({ side: 'main', how: 'protocol' }) },
    { re: /\bsetAsDefaultProtocolClient\(\s*["'`]([^"'`]{1,60})["'`]/g, map: v => `url-scheme:${v}`, meta: () => ({ side: 'main', how: 'url scheme' }) },
  ], { skipVendor: true });
}
