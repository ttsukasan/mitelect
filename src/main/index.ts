// @ts-ignore
import { app, Menu, Tray, ipcMain, Event, nativeImage } from 'electron'
// @ts-ignore
import { join } from 'path'
import path from 'path'
import icon16 from '../../resources/fish_16.png?asset'
import icon24 from '../../resources/fish_24.png?asset'
import icon32 from '../../resources/fish_32.png?asset'

let tray: Tray | null = null

// 最適なサイズのアイコンを選択
function getIcon() {
  // macOSのRetinaディスプレイ向け
  if (process.platform === 'darwin' && nativeImage.createFromPath(path.join(__dirname, '../../resources/icon-32.png')).isMacTemplateImage) {
    return icon32
  }

  // Windowsの高DPI環境向け
  if (process.platform === 'win32' && (process.getSystemMetrics(0) > 1920 || process.getSystemMetrics(1) > 1080)) {
    return icon24
  }

  // 通常環境（または16x16が推奨される場合）
  return icon16
}


app.whenReady().then(() => {
  // タスクバートレイのアイコンとメニュー設定
  tray = new Tray(getIcon())

  const contextMenu = Menu.buildFromTemplate([
    { label: '機能1', click: () => runFeature1() },
    { label: '機能2', click: () => runFeature2() },
    { type: 'separator' },
    { label: '終了', role: 'quit' },
  ])

  tray.setToolTip('Mitelecton')
  tray.setContextMenu(contextMenu)

  // Windows用ユーザーモデルIDを設定
  app.setAppUserModelId('com.electron')
})

// 各機能の処理内容（バックグラウンドスクリプト）
const runFeature1 = () => {
  console.log('機能1を実行')
  // 機能1の具体的な処理をここに追加
}

const runFeature2 = () => {
  console.log('機能2を実行')
  // 機能2の具体的な処理をここに追加
}

// ウィンドウを開かず、終了時の挙動をカスタマイズ
app.on('window-all-closed', (event: Event) => {
  event.preventDefault() // ウィンドウを閉じてもアプリが終了しないように設定
})
