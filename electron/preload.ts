import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  openVideoDialog: () => Promise<{
    filePath: string;
    fileName: string;
    size: number;
    mediaUrl: string;
  } | null>;
  openSrtDialog: () => Promise<{
    filePath: string;
    fileName: string;
    content: string;
  } | null>;
  saveSrtDialog: (options: {
    content: string;
    defaultName?: string;
  }) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
  }>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  getAppVersion: () => Promise<string>;
}

const api: ElectronAPI = {
  openVideoDialog: () => ipcRenderer.invoke('dialog:openVideo'),
  openSrtDialog: () => ipcRenderer.invoke('dialog:openSrt'),
  saveSrtDialog: (options) => ipcRenderer.invoke('dialog:saveSrt', options),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', { filePath, content }),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
