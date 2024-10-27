import {Tray, app} from 'electron'
import path from 'path'

export function initTray(): Tray{
  const fileName = {
    darwin: 'beeTemplate.png',
    win32: 'bee.ico'
  }[process.platform] || 'bee_16.png'

  const iconPath = path.join(app.getAppPath(), 'resources', fileName)
  const tray = new Tray(iconPath)
  tray.setToolTip('みてらー')
  return tray
}
