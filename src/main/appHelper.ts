import { Tray, app, shell } from 'electron'
import path from 'path'
import { exec } from 'child_process'

function getTrayIconPath(): string {
  const fileName =
    {
      darwin: 'beeTemplate.png',
      win32: 'bee.ico'
    }[process.platform] || 'bee_16.png'

  return path.join(app.getAppPath(), 'resources', fileName)
}

export function getLargeIconPath(): string {
  return path.join(app.getAppPath(), 'resources', 'icon.png')
}

// システムトレーの初期設定、アイコン設定
export function initTray(): Tray {
  const tray = new Tray(getTrayIconPath())
  // tray.setToolTip('アプリ名')
  return tray
}

// Windows: Notepadで開く, macOS: 標準のエディタで開く
export function openEditor(filePath: string): void {
  if (process.platform === 'win32') {
    exec(`notepad.exe "${filePath}"`)
  } else {
    shell.openPath(filePath).then((result) => {
      if (result) {
        console.error('Failed to open config file:', result)
      }
    })
  }
}
