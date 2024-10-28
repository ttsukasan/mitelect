import { Tray, app, shell } from 'electron'
import path from 'path'
import { exec } from 'child_process'

// システムトレーの初期設定、アイコン設定
export function initTray(): Tray {
  const fileName =
    {
      darwin: 'beeTemplate.png',
      win32: 'bee.ico'
    }[process.platform] || 'bee_16.png'

  const iconPath = path.join(app.getAppPath(), 'resources', fileName)
  const tray = new Tray(iconPath)
  tray.setToolTip('みてらー')
  return tray
}

// Windows: Notepadで開く, macOS: TextEditで開く
export function openEditor(filePath: string): void {
  if (process.platform === 'win32') {
    exec(`notepad.exe "${filePath}"`, (error) => {
      console.warn('Failed to open config file:', error)
      shell.openPath(filePath)
    })
  } else if (process.platform === 'darwin') {
    exec(`open -a TextEdit "${filePath}"`, (error) => {
      console.warn('Failed to open config file:', error)
      shell.openPath(filePath)
    })
  } else {
    shell.openPath(filePath).then((result) => {
      if (result) {
        console.error('Failed to open config file:', result)
      }
    })
  }
}
