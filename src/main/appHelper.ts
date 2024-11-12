import { Tray, app, shell } from 'electron'
import path from 'path'
import { exec } from 'child_process'

function getTrayIconPath(): string {
  let fileName = 'bee_16.png' // linux?
  fileName = isMac() ? 'beeTemplate.png' : fileName
  fileName = isWin() ? 'bee.ico' : fileName
  return path.join(app.getAppPath(), 'resources', fileName)
}

export function isMac(): boolean {
  return process.platform === 'darwin'
}

export function isWin(): boolean {
  return process.platform === 'win32'
}

export function getLargeIconPath(): string {
  return path.join(app.getAppPath(), 'resources', 'icon.png')
}

// システムトレーの初期設定、アイコン設定
export function initTray(): Tray {
  const tray = new Tray(getTrayIconPath())
  tray.setToolTip(`MiteTray ${app.getVersion()}`)
  return tray
}

// Windows: Notepadで開く, macOS: 標準のエディタで開く
export function openEditor(filePath: string): void {
  if (isWin()) {
    exec(`notepad.exe "${filePath}"`)
  } else {
    shell.openPath(filePath).then((result) => {
      if (result) {
        console.error('Failed to open config file:', result)
      }
    })
  }
}
